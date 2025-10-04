"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const fetchProfile = async () => {
    const { data: { user: currentUser }, error: userErr } = await supabaseClient.auth.getUser()
    if (!currentUser || userErr) {
      router.push("/auth")
      return
    }

    setUser(currentUser)

    const { data: profileData, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single()

    if (error) console.log("Profile fetch error:", error.message)
    setProfile(profileData)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
      if (!currentSession) {
        router.push("/auth")
      }
    })

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [router])

  const logout = async () => {
    await supabaseClient.auth.signOut()
    router.push("/auth")
  }

  const saveProfile = async () => {
    if (!profile || !user) {
      console.log("Missing profile or user:", { profile, user })
      return
    }
    
    setSaving(true)

    try {
      console.log("Saving profile with data:", {
        full_name: profile.full_name,
        batch: profile.batch,
        company: profile.company,
        userId: user.id
      })

      const res = await fetch("/api/updateProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          batch: profile.batch,
          company: profile.company,
          userId: user.id
        })
      })

      console.log("Response status:", res.status)
      const data = await res.json()
      console.log("Response data:", data)

      if (data.error) {
        alert(data.error)
      } else {
        alert("Profile updated successfully!")
        await fetchProfile()
      }
    } catch (err) {
      console.error("Save error:", err)
      alert("Failed to update profile: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const markDataSame = async () => {
    if (!user) {
      console.log("Missing user:", user)
      return
    }
    
    setSaving(true)

    try {
      const res = await fetch("/api/markDataSame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        alert("Marked as verified!")
        await fetchProfile()
      }
    } catch (err) {
      console.error("Mark data same error:", err)
      alert("Failed to mark as verified: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (!profile) return <p>Profile not found.</p>

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Edit Profile</h1>

      <label>Full Name:</label>
      <input
        type="text"
        value={profile.full_name || ""}
        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
        style={{ display: "block", margin: "0.5rem 0", width: "100%" }}
      />

      <label>Batch:</label>
      <input
        type="text"
        value={profile.batch || ""}
        onChange={(e) => setProfile({ ...profile, batch: e.target.value })}
        style={{ display: "block", margin: "0.5rem 0", width: "100%" }}
      />

      <label>Company:</label>
      <input
        type="text"
        value={profile.company || ""}
        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
        style={{ display: "block", margin: "0.5rem 0", width: "100%" }}
      />

      <button onClick={saveProfile} disabled={saving} style={{ marginRight: "0.5rem" }}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
      <button onClick={markDataSame} disabled={saving}>
        {saving ? "Processing..." : "Data is same ✅"}
      </button>

      <hr style={{ margin: "1rem 0" }} />
      <button onClick={logout} style={{ padding: "0.5rem 1rem" }}>Logout</button>
    </div>
  )
}
