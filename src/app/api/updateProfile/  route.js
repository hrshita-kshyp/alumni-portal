// app/api/updateProfile/route.js
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export async function POST(req) {
  try {
    const { full_name, batch, company, userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, batch, company, last_verified: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
