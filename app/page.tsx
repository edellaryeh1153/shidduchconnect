"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { authUser, loading } = useAuth();
  useEffect(() => {
    if (!loading) router.replace(authUser ? "/dashboard" : "/login");
  }, [authUser, loading, router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-lg bg-[#C4956A] flex items-center justify-center text-white font-bold text-xl mx-auto">שׁ</div>
    </div>
  );
}