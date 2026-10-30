"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  parentLoginAction,
  requestParentPasswordResetAction,
} from "@/lib/actions/parent-portal";

export default function ParentLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Моля, попълнете телефон/имейл и парола.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await parentLoginAction(identifier, password, rememberMe);
      if (!res.success) {
        toast.error(res.error || "Неуспешен вход.");
        setIsLoading(false);
        return;
      }

      toast.success("Успешен вход в Родителския портал!");
      router.push("/club/parents");
      router.refresh();
    } catch {
      toast.error("Възникна мрежова грешка при вход.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      toast.error("Моля, въведете вашия имейл или телефон.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await requestParentPasswordResetAction(resetIdentifier);
      if (!res.success) {
        toast.error(res.error || "Грешка при заявка за нова парола.");
      } else {
        setResetSuccess(true);
      }
    } catch {
      toast.error("Възникна грешка при изпращане на заявката.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-slate-100 sm:px-6"
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/club"
            className="inline-flex min-h-11 items-center gap-2 py-2 text-xs font-semibold tracking-wider text-zinc-300 uppercase transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            <span>Към сайта на БК Гълъбово</span>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-blue-500/20 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 relative size-16 overflow-hidden rounded-2xl border border-blue-500/40 bg-zinc-950 p-2 shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              <Image
                src="/icons/badge-option-3-light-squircle.png"
                alt="БК Гълъбово"
                width={64}
                height={64}
                className="size-full object-cover"
                priority
              />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-[11px] font-bold tracking-widest text-blue-400 uppercase">
              <Users size={12} />
              <span>Родителски портал</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              Вход за родители
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Следете присъствията, графика и данните на детето си
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
              >
                Телефон или Имейл
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="напр. 0888123456 или roditel@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <User
                  size={18}
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-bold tracking-wider text-zinc-300 uppercase"
                >
                  Парола
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetSuccess(false);
                    setForgotOpen(true);
                  }}
                  className="inline-flex min-h-11 items-center text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
                >
                  Забравена парола?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-200"
                  aria-label={
                    showPassword ? "Скрий паролата" : "Покажи паролата"
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="rememberMe"
                className="text-xs text-zinc-300 select-none"
              >
                Запомни ме на това устройство (30 дни)
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-1.02 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Влизане...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Вход в профила</span>
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-8 border-t border-zinc-800/80 pt-6 text-center">
            <p className="text-xs text-zinc-400">
              Нямате регистриран профил за вашето дете?
            </p>
            <Link
              href="/club/parents/request"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/30 px-4 py-2.5 text-xs font-bold text-blue-300 transition-all hover:border-blue-400 hover:bg-blue-900/50 hover:text-white"
            >
              <Users size={14} />
              <span>Подайте заявка за достъп тук</span>
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Сигурна криптирана връзка • БК „Гълъбово“ 2026</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-zinc-900 p-6 shadow-2xl">
            {resetSuccess ? (
              <div className="text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
                <h3 className="mt-3 text-lg font-bold text-white">
                  Проверете пощата си
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Ако съществува регистриран профил с тези данни, на имейла е
                  изпратен линк за нова парола (валиден 1 час).
                </p>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="mt-6 w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-white uppercase hover:bg-zinc-700"
                >
                  Затвори
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-950/60 p-2 text-blue-400 border border-blue-500/30">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">
                      Забравена парола
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Въведете вашия телефон или имейл
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="напр. 0888123456 или roditel@email.com"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 uppercase hover:bg-zinc-800"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white uppercase shadow-md hover:bg-blue-500 disabled:opacity-50"
                  >
                    {resetLoading ? "Изпращане..." : "Изпрати линк"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
