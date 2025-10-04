"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }

    const { data: profileData, error } = await supabase
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/auth")
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        batch: profile.batch,
        company: profile.company
      })
      .eq("id", profile.id)
    setSaving(false)
    if (error) alert(error.message)
    else alert("Profile updated successfully!")
  }

  const markDataSame = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ last_verified: new Date().toISOString() })
      .eq("id", profile.id)
    setSaving(false)
    if (error) alert(error.message)
    else alert("Marked as verified!")
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
        Save Changes
      </button>
      <button onClick={markDataSame} disabled={saving}>
        Data is same ✅
      </button>
      <hr style={{ margin: "1rem 0" }} />
      <button onClick={logout} style={{ padding: "0.5rem 1rem" }}>Logout</button>
    </div>
  )
}
