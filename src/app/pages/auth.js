"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/profile")
    })

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_, session) => {
      if (session) router.push("/profile")
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  const signUp = async () => {
    if (!email || !password) return alert("Enter email and password")
    if (password.length < 6) return alert("Password must be at least 6 characters")
    setLoading(true)

    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim(),
      password
    })
    setLoading(false)
    if (error) return alert(error.message)

    // server API call to create profile
    try {
      await fetch("/api/createProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id })
      })
    } catch (err) {
      console.log("Profile creation failed", err)
    }

    alert("Signup successful! Check your email to confirm verification.")
  }

  const signIn = async () => {
    if (!email || !password) return alert("Enter email and password")
    setLoading(true)

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    setLoading(false)
    if (error) return alert(error.message)
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
        {loading ? "Logging in..." : "Login"}
      </button>
      <button onClick={signUp} disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
    </div>
  )
}
