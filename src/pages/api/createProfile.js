import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: "Missing userId" })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,  // Changed
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ id: userId, full_name: "", batch: "", company: "" }])
    
    if (error) {
      console.error("Error creating profile:", error.message)
      return res.status(500).json({ error: error.message })
    }
    
    return res.status(200).json({ message: "Profile created", profile: data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Server error" })
  }
}
