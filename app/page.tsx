"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
      setChecking(false);
    }
    check();

    // Fallback — if nothing happens in 3 seconds, go to login
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-lg bg-[#C4956A] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">שׁ</div>
        <p className="text-gray-500 text-sm">Loading ShidduchConnect...</p>
      </div>
    </div>
  );
}