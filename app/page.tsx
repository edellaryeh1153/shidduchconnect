import { supabase } from "@/lib/supabase/client";

export default function Home() {
  console.log("Supabase connected:", !!supabase);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>ShidduchConnect</h1>
      <p>My first website is working.</p>
      <p>Supabase is connected.</p>
    </main>
  );
}