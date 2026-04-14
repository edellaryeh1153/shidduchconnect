"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AppUser } from "@/types";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  authUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  authUser: null, appUser: null, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAppUser(userId: string) {
    const { data } = await supabase.from("users").select("*").eq("id", userId).single();
    if (data) setAppUser(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        loadAppUser(session.user.id);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await loadAppUser(session.user.id);
      } else {
        setAuthUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setAppUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ authUser, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

export function canDo(user: AppUser | null, action: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return action === "view";
  return ["view", "create", "edit", "match", "note", "ai"].includes(action);
}