import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Profile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", batch: "", company: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
  }, []);

  const fetchProfile = async (id) => {
    let { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (data) setProfile(data);
  };

  const updateProfile = async () => {
    const updates = { ...profile, id: session.user.id, last_verified: new Date() };
    let { error } = await supabase.from("profiles").upsert(updates);
    if (error) alert(error.message);
    else alert("Profile updated!");
  };

  if (!session) return <p>Not logged in</p>;

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col gap-3">
      <h1 className="text-xl font-bold">Your Profile</h1>
      <input
        className="border p-2"
        placeholder="Full Name"
        value={profile.full_name}
        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
      />
      <input
        className="border p-2"
        placeholder="Batch"
        value={profile.batch}
        onChange={(e) => setProfile({ ...profile, batch: e.target.value })}
      />
      <input
        className="border p-2"
        placeholder="Company"
        value={profile.company}
        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
      />
      <button className="bg-blue-600 text-white p-2" onClick={updateProfile}>
        Save
      </button>
    </div>
  );
}
