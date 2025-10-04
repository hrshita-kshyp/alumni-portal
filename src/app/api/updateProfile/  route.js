import { getSupabaseServerClient } from "@/lib/supabaseClient"

export async function POST(req) {
  try {
    const body = await req.json()
    const { full_name, batch, company, userId } = body
    
    console.log("Received request:", { full_name, batch, company, userId })
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const supabase = getSupabaseServerClient()
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, batch, company, last_verified: new Date().toISOString() })
      .eq("id", userId)
    
    if (error) {
      console.error("Supabase error:", error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error("API route error:", err)
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
