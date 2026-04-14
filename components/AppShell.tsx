"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { authUser, appUser, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !authUser) router.replace("/login"); }, [authUser, loading, router]);
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-lg bg-[#C4956A] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">שׁ</div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
  if (!authUser || !appUser) return null;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}