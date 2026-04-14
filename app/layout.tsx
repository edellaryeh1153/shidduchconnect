import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "ShidduchConnect",
  description: "Professional matchmaking platform for the Jewish community",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F7F5F0] text-gray-800 antialiased" style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}