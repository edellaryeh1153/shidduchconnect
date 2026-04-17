"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

export default function NotificationBell() {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  async function load() {
    if (!appUser) return;
    const { data } = await supabase.from("notifications")
      .select("*").eq("user_id", appUser.id)
      .order("created_at", { ascending: false }).limit(20);
    const notifs = data || [];
    setNotifications(notifs);
    setUnread(notifs.filter((n: any) => !n.is_read).length);
  }

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [appUser]);

  async function markAllRead() {
    if (!appUser) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", appUser.id).eq("is_read", false);
    load();
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    load();
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 text-[#8BAAB5] hover:text-white transition-colors">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#1B3A4B]">Notifications</h3>
              {unread > 0 && <button onClick={markAllRead} className="text-[10px] text-[#C4956A] hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No notifications yet.</p>}
              {notifications.map((n) => (
                <div key={n.id} onClick={() => { markRead(n.id); setOpen(false); }}
                  className={`p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer ${!n.is_read ? "bg-[#C4956A]/5" : ""}`}>
                  {n.link ? (
                    <Link href={n.link} className="block">
                      <div className="text-sm font-medium text-[#1B3A4B]">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-[#1B3A4B]">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}