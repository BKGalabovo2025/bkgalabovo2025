"use client";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { resetParentPasswordWithTokenAction } from "@/lib/actions/parent-portal";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Невалиден или липсващ токен за възстановяване.");
      return;
    }

    if (password.length < 6) {
      toast.error("Паролата трябва да съдържа поне 6 символа.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Паролите не съвпадат.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetParentPasswordWithTokenAction(token, password);
      if (!res.success) {
        toast.error(res.error || "Грешка при смяна на паролата.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Паролата беше сменена успешно!");
    } catch {
      toast.error("Възникна мрежова грешка при обновяване на паролата.");
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-950/40 text-red-400 border border-red-500/30">
          <Lock size={28} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-white">Невалиден линк</h2>
        <p className="mt-2 text-xs text-zinc-400">
          Този линк за смяна на парола е невалиден или вече е изтекъл.
        </p>
        <Link
          href="/club/parents/login"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white uppercase hover:bg-blue-500"
        >
          Към екрана за вход
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
        <h2 className="mt-3 text-xl font-bold text-white">
          Паролата е променена!
        </h2>
        <p className="mt-2 text-xs text-zinc-400">
          Вече можете да влезете в Родителския портал с новата си парола.
        </p>
        <Link
          href="/club/parents/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-lg hover:scale-105"
        >
          Вход в портала
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="newPass"
          className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
        >
          Нова парола (мин. 6 знака)
        </label>
        <input
          id="newPass"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPass"
          className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
        >
          Потвърдете новата парола
        </label>
        <input
          id="confirmPass"
          type="password"
          required
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg hover:scale-1.01 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Запазване...</span>
          </>
        ) : (
          <>
            <KeyRound size={16} />
            <span>Запази новата парола</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-slate-100 sm:px-6"
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/club/parents/login"
            className="inline-flex min-h-11 items-center gap-2 py-2 text-xs font-semibold tracking-wider text-zinc-300 uppercase hover:text-white"
          >
            <ArrowLeft size={16} />
            <span>Към вход за родители</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-blue-500/20 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 relative size-14 overflow-hidden rounded-2xl border border-blue-500/40 bg-zinc-950 p-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Image
                src="/icons/badge-option-3-light-squircle.png"
                alt="БК Гълъбово"
                width={56}
                height={56}
                className="size-full object-cover"
                priority
              />
            </div>
            <h1 className="text-xl font-black text-white uppercase sm:text-2xl">
              Нова парола
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Въведете новата парола за вашия профил
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            }
          >
            <ResetPasswordContent />
          </Suspense>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Сигурно нулиране на парола • БК „Гълъбово“</span>
        </div>
      </div>
    </main>
  );
}
