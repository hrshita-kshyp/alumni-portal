import { getSupabaseServerClient } from "@/lib/supabaseClient"

export async function POST(req) {
  const body = await req.json()
  const { userId } = body

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing user ID" }), { status: 400 })
  }

  const supabase = getSupabaseServerClient()

  const { error } = await supabase
    .from("profiles")
    .update({ last_verified: new Date().toISOString() })
    .eq("id", userId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
