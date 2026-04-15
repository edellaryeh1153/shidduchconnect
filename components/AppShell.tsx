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
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C4956A] to-[#A87B52] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">שׁ</div>
        <p className="text-gray-500 text-sm">Loading ShidduchConnect...</p>
        <div className="mt-3 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-[#C4956A] rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );

  if (!authUser || !appUser) return null;

  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto max-w-[1200px]">
        {children}
      </main>
    </div>
  );
}