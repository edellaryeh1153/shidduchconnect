"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AddProfilePage() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("girl");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [hashkafa, setHashkafa] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Saving...");

    const { error } = await supabase.from("profiles").insert([
      {
        name,
        gender,
        age: Number(age),
        city,
        hashkafa,
      },
    ]);

    if (error) {
      setMessage("Error saving profile.");
      return;
    }

    setMessage("Profile saved successfully.");
    setName("");
    setGender("girl");
    setAge("");
    setCity("");
    setHashkafa("");
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Add Profile</h1>

      <p>
        <Link href="/">Back to home</Link>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "12px", maxWidth: "400px" }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="girl">Girl</option>
          <option value="boy">Boy</option>
        </select>

        <input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          placeholder="Hashkafa"
          value={hashkafa}
          onChange={(e) => setHashkafa(e.target.value)}
        />

        <button type="submit">Save Profile</button>
      </form>

      <p>{message}</p>
    </main>
  );
}