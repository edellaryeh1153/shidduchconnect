"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string;
  gender: string;
  age: number;
};

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      const { data, error } = await supabase.from("profiles").select("*");

      if (error) {
        setError("Error loading profiles.");
        return;
      }

      setProfiles(data || []);
    }

    loadProfiles();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>ShidduchConnect</h1>
      <p>My first website is working.</p>
      <p>Supabase is connected.</p>

      <p>
        <Link href="/add-profile">Add a new profile</Link>
      </p>

      <h2>Profiles</h2>

      {error ? (
        <p>{error}</p>
      ) : (
        <ul>
          {profiles.map((profile) => (
            <li key={profile.id}>
              {profile.name} - {profile.gender} - {profile.age}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}