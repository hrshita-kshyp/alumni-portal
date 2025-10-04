"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Profile() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState({ full_name: "", batch: "", company: "" })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession()
      setSession(currentSession)
      if (currentSession) {
        fetchProfile(currentSession.user.id)
      } else {
        router.push("/auth")
      }
      setLoading(false)
    }

    getSession()

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)
      if (!currentSession) {
        router.push("/auth")
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  const fetchProfile = async (id) => {
    const { data } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
    
    if (data) setProfile(data)
  }

  const updateProfile = async () => {
    if (!session) return

    try {
      const updates = { 
        ...profile, 
        id: session.user.id, 
        last_verified: new Date().toISOString() 
      }
      
      const { error } = await supabaseClient
        .from("profiles")
        .upsert(updates)
      
      if (error) {
        alert(error.message)
      } else {
        alert("Profile updated!")
      }
    } catch (err) {
      console.error("Update error:", err)
      alert("Failed to update profile")
    }
  }

  if (loading) return <p>Loading...</p>
  if (!session) return <p>Not logged in</p>

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col gap-3">
      <h1 className="text-xl font-bold">Your Profile</h1>
      <input
        className="border p-2"
        placeholder="Full Name"
        value={profile.full_name || ""}
        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
      />
      <input
        className="border p-2"
        placeholder="Batch"
        value={profile.batch || ""}
        onChange={(e) => setProfile({ ...profile, batch: e.target.value })}
      />
      <input
        className="border p-2"
        placeholder="Company"
        value={profile.company || ""}
        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
      />
      <button className="bg-blue-600 text-white p-2" onClick={updateProfile}>
        Save
      </button>
    </div>
  )
}
