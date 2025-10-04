import { getSupabaseServerClient } from "@/lib/supabaseClient"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { full_name, batch, company, userId } = req.body
  if (!userId) return res.status(400).json({ error: "Missing user ID" })

  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, batch, company, last_verified: new Date().toISOString() })
    .eq("id", userId)

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ success: true })
}
