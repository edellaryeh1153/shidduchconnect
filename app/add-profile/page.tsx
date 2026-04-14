"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AddProfilePage() {
  const [gender, setGender] = useState("girl");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [city, setCity] = useState("");
  const [hashkafa, setHashkafa] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Saving...");

    const fullName = `${firstName} ${lastName}`.trim();

    const { error } = await supabase.from("profiles").insert([
      {
        created_by: (await supabase.auth.getUser()).data.user?.id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        gender,
        age: Number(age),
        height_inches: heightInches ? Number(heightInches) : null,
        city,
        hashkafa,
        personal_phone: personalPhone,
        mother_name: motherName,
        mother_phone: motherPhone,
        father_name: fatherName,
        father_phone: fatherPhone,
        notes,
      },
    ]);

    if (error) {
      setMessage("Error saving profile.");
      return;
    }

    setMessage("Profile saved successfully.");
    setGender("girl");
    setFirstName("");
    setLastName("");
    setAge("");
    setHeightInches("");
    setCity("");
    setHashkafa("");
    setPersonalPhone("");
    setMotherName("");
    setMotherPhone("");
    setFatherName("");
    setFatherPhone("");
    setNotes("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5f0",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        color: "#1b3a4b",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "32px",
            border: "1px solid #ece7df",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ marginTop: 0, marginBottom: "20px" }}>
            <Link
              href="/"
              style={{ color: "#1b3a4b", textDecoration: "none", fontWeight: 600 }}
            >
              ← Back to home
            </Link>
          </p>

          <h1 style={{ marginTop: 0, marginBottom: "10px", fontSize: "36px" }}>
            Add Profile
          </h1>

          <p style={{ marginTop: 0, color: "#4b5d68", marginBottom: "24px" }}>
            Add a new boy or girl profile with parent contact information and
            hashkafa level.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>Section</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={fieldStyle}
              >
                <option value="girl">Girls</option>
                <option value="boy">Boys</option>
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={fieldStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Height (inches)</label>
                <input
                  type="number"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Hashkafa Level</label>
                <input
                  value={hashkafa}
                  onChange={(e) => setHashkafa(e.target.value)}
                  placeholder="Yeshivish, Modern Orthodox, Chassidish, etc."
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Personal Phone</label>
                <input
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Mother Name</label>
                <input
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Mother Phone</label>
                <input
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Father Name</label>
                <input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Father Phone</label>
                <input
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                style={{
                  ...fieldStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#1b3a4b",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 18px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Profile
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "18px",
                color: message.toLowerCase().includes("error") ? "#b91c1c" : "#166534",
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontWeight: 600,
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  fontSize: "16px",
  boxSizing: "border-box",
};