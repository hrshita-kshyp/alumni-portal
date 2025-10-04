"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null) // Supabase user object
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const fetchProfile = async () => {
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser()
    if (!user || userErr) {
      router.push("/auth")
      return
    }

    setUser(user) // store user object

    const { data: profileData, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) console.log("Profile fetch error:", error.message)
    setProfile(profileData)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()

    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/auth")
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabaseClient.auth.signOut()
    router.push("/auth")
  }

  const saveProfile = async () => {
    if (!profile || !user) return
    setSaving(true)

    try {
      const res = await fetch("/api/updateProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          batch: profile.batch,
          company: profile.company,
          userId: user.id // always use user.id
        })
      })

      const data = await res.json()
      if (data.error) alert(data.error)
      else alert("Profile updated successfully!")
    } catch (err) {
      console.log(err)
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const markDataSame = async () => {
    if (!user) return
    setSaving(true)

    try {
      const res = await fetch("/api/markDataSame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await res.json()
      if (data.error) alert(data.error)
      else alert("Marked as verified!")
    } catch (err) {
      console.log(err)
      alert("Failed to mark as verified")
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
