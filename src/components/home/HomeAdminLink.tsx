"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/context/auth-context";

export function HomeAdminLink() {
  const { user } = useAuth();

  return (
    <Link
      prefetch={false}
      href={user ? "/dashboard" : "/login"}
      className="group flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3.5 py-1 text-[10px] font-medium tracking-widest text-zinc-400 uppercase transition-all hover:border-zinc-600 hover:text-white"
    >
      <Lock
        size={11}
        strokeWidth={2}
        className="transition-transform group-hover:scale-110"
      />
      <span>{user ? "Табло" : "Админ"}</span>
    </Link>
  );
}
