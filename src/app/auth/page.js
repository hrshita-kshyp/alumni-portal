"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Redirect logged-in users automatically
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push("/profile")
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async () => {
    if (!email || !password) return alert("Enter email and password")
    if (password.length < 6) return alert("Password must be at least 6 characters")
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    })
    setLoading(false)

    if (error) return alert(error.message)

    // Auto-create profile row
    const { error: profileError } = await supabase.from("profiles").insert([
      { id: data.user.id, full_name: "", batch: "", company: "" }
    ])
    if (profileError) console.log(profileError.message)

    alert("Signup successful! Check your email to confirm verification.")
  }

  const signIn = async () => {
    if (!email || !password) return alert("Enter email and password")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    setLoading(false)

    if (error) return alert(error.message)
    // No need to manually getSession; the onAuthStateChange listener will redirect
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Login / Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "0.5rem 0", width: "100%", padding: "0.5rem" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "0.5rem 0", width: "100%", padding: "0.5rem" }}
      />
      <button onClick={signIn} disabled={loading} style={{ marginRight: "0.5rem" }}>
        Login
      </button>
      <button onClick={signUp} disabled={loading}>
        Register
      </button>
    </div>
  )
}
