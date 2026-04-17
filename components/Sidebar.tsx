"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/NotificationBell";

export default function Sidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();
  if (!appUser) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/profiles", label: "Profiles", icon: "◉" },
    { href: "/quick-add", label: "Quick Add", icon: "⚡" },
    { href: "/matches", label: "Matches", icon: "⟡" },
    { href: "/compare", label: "Compare", icon: "⇆" },
    { href: "/recommendations", label: "Recommendations", icon: "✦" },
    { href: "/ai", label: "AI Shadchan", icon: "✧" },
    { href: "/favorites", label: "Watchlist", icon: "★" },
  ];

  const adminItems = [
    { href: "/admin/users", label: "Manage Users", icon: "⚙" },
    { href: "/admin/audit", label: "Audit Log", icon: "📋" },
  ];

  function navLink(item: { href: string; label: string; icon: string }) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150 ${
          active
            ? "bg-white/12 text-white border-r-[3px] border-[#C4956A] font-medium"
            : "text-[#8BAAB5] hover:text-white hover:bg-white/5 border-r-[3px] border-transparent"
        }`}>
        <span className="text-base w-5 text-center">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="w-[250px] min-h-screen bg-gradient-to-b from-[#1B3A4B] to-[#162F3D] text-white flex flex-col shrink-0 shadow-xl">
      {/* Logo */}
      <div className="p-5 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4956A] to-[#A87B52] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
            שׁ
          </div>
          <div>
            <div className="font-semibold text-[17px] leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              ShidduchConnect
            </div>
            <div className="text-[10px] text-[#6B8E9B] uppercase tracking-wider">Matchmaking Platform</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <div className="px-5 mb-2 text-[10px] text-[#4A7080] uppercase tracking-[0.15em] font-medium">Menu</div>
        {navItems.map((item) => navLink(item))}

        {appUser.role === "admin" && (
          <>
            <div className="px-5 mt-6 mb-2 text-[10px] text-[#4A7080] uppercase tracking-[0.15em] font-medium">Admin</div>
            {adminItems.map((item) => navLink(item))}
          </>
        )}

        <div className="px-5 mt-6 mb-2 text-[10px] text-[#4A7080] uppercase tracking-[0.15em] font-medium">Account</div>
        {navLink({ href: "/settings", label: "Settings", icon: "⚙" })}
        {navLink({ href: "/help", label: "Help & FAQ", icon: "?" })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/8 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C4956A]/20 flex items-center justify-center text-[#C4956A] text-sm font-semibold">
            {appUser.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{appUser.name}</div>
            <div className="text-[10px] text-[#6B8E9B] capitalize">{appUser.role}</div>
          </div>
          <NotificationBell />
        </div>
        <button onClick={signOut} className="mt-3 w-full text-left text-xs text-[#6B8E9B] hover:text-white transition-colors px-1">
          ← Sign Out
        </button>
      </div>
    </aside>
  );
}