"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface User {
  userId: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.push("/login");
      }
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  if (loading) {
    return (
      <header className="w-full border-b border-card-border bg-card-bg/50 backdrop-blur-md h-16 flex items-center justify-between px-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card-bg/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              DecisionLab
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-950 text-indigo-300 rounded border border-indigo-900">
              MVP
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-white ${
                  pathname === "/dashboard" ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                Dashboard
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    pathname === "/admin" ? "text-indigo-400" : "text-slate-400"
                  }`}
                >
                  Admin Control Panel
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="text-slate-300 font-medium">{user.email}</span>
                <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="md:hidden p-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-card-border rounded"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-card-border rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-lg transition-all shadow-md shadow-indigo-500/10"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
