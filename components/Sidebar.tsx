"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();
  if (!appUser) return null;
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/profiles", label: "Profiles", icon: "◉" },
    { href: "/matches", label: "Matches", icon: "⟡" },
    { href: "/recommendations", label: "Recommendations", icon: "✦" },
    { href: "/ai", label: "AI Shadchan", icon: "✧" },
  ];
  const adminItems = [
    { href: "/admin/users", label: "Manage Users", icon: "⚙" },
    { href: "/admin/audit", label: "Audit Log", icon: "📋" },
  ];
  function navLink(item: { href: string; label: string; icon: string }) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? "bg-white/10 text-white border-r-2 border-[#C4956A]" : "text-[#8BAAB5] hover:text-white hover:bg-white/5"}`}>
        <span className="text-base">{item.icon}</span>{item.label}
      </Link>
    );
  }
  return (
    <aside className="w-64 min-h-screen bg-[#1B3A4B] text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#C4956A] flex items-center justify-center text-white font-bold text-lg">שׁ</div>
          <div>
            <div className="font-semibold text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>ShidduchConnect</div>
            <div className="text-xs text-[#8BAAB5]">Matchmaking Platform</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 py-4">
        <div className="px-4 mb-2 text-xs text-[#6B8E9B] uppercase tracking-wider">Menu</div>
        {navItems.map(navLink)}
        {appUser.role === "admin" && (<>
          <div className="px-4 mt-6 mb-2 text-xs text-[#6B8E9B] uppercase tracking-wider">Admin</div>
          {adminItems.map(navLink)}
        </>)}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="text-sm font-medium">{appUser.name}</div>
        <div className="text-xs text-[#8BAAB5] capitalize mb-3">{appUser.role}</div>
        <button onClick={signOut} className="text-xs text-[#8BAAB5] hover:text-white transition-colors">Sign Out →</button>
      </div>
    </aside>
  );
}