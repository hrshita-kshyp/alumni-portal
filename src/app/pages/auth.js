import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email to confirm signup!");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.href = "/profile";
  };

  return (
    <div className="flex flex-col gap-2 p-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold">Login / Register</h1>
      <input
        className="border p-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-blue-500 text-white p-2" onClick={signIn}>
        Login
      </button>
      <button className="bg-green-500 text-white p-2" onClick={signUp}>
        Register
      </button>
    </div>
  );
}
