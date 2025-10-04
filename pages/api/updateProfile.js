import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { full_name, batch, company, userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, batch, company, last_verified: new Date().toISOString() })
      .eq("id", userId)
    
    if (error) {
      console.error("Supabase error:", error)
      return res.status(400).json({ error: error.message })
    }
    
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error("API route error:", err)
    return res.status(500).json({ error: err.message || "Internal server error" })
  }
}
