"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Server action: verifies credentials & writes the session cookie
      const res = await loginAction(email, password);

      if (!res.success) {
        throw new Error(res.error || "Неуспешен вход");
      }

      // 2. Client-side sign-in: keeps Firebase Auth state in sync so
      //    AuthContext (onIdTokenChanged) sees the user and doesn't show
      //    a blank screen due to user === null.
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Успешен вход", {
        description: "Пренасочваме ви към таблото за управление...",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Възникна грешка при входа. Моля, опитайте отново.";
      setError(errorMessage);
      toast.error("Грешка при вход", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-y-auto bg-zinc-50 p-3 sm:p-5 font-sans">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 size-[500px] rounded-full bg-zinc-200/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-64 -ml-64 size-[500px] rounded-full bg-zinc-200/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md duration-700 animate-in fade-in slide-in-from-bottom-6">
        <Link
          href="/"
          className="mb-2.5 sm:mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-zinc-400 uppercase transition-colors hover:text-zinc-950"
        >
          <ArrowLeft size={13} strokeWidth={2} /> Обратно към порталите
        </Link>

        <BentoCard className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-lg shadow-zinc-950/5">
          <div className="mb-4 sm:mb-5 flex flex-col items-center text-center">
            <div className="mb-2.5 sm:mb-3 flex size-10 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-md">
              <ShieldCheck
                size={20}
                strokeWidth={1.75}
                className="sm:size-[22px]"
              />
            </div>
            <h1 className="font-bento text-xl font-bold tracking-tight text-zinc-950 uppercase sm:text-2xl">
              Админ Портал
            </h1>
            <p className="mt-0.5 text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-zinc-400 uppercase">
              Бадминтон Клуб Гълъбово
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
            <div className="space-y-1 sm:space-y-1.5">
              <Label
                htmlFor="email"
                className="ml-1 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] text-zinc-500 uppercase"
              >
                Имейл
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@bkgalabovo.com"
                required
                className="h-10 sm:h-11 rounded-xl border-zinc-200 bg-zinc-50/60 px-3.5 text-xs sm:text-sm font-medium transition-all focus:bg-white focus:border-zinc-400 focus:ring-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="ml-1 flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[10px] sm:text-[11px] font-medium tracking-[0.15em] text-zinc-500 uppercase"
                >
                  Парола
                </Label>
                <Link
                  href="#"
                  className="text-[9px] sm:text-[10px] font-medium tracking-[0.15em] text-zinc-400 uppercase transition-colors hover:text-zinc-950"
                >
                  Забравена парола?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-10 sm:h-11 rounded-xl border-zinc-200 bg-zinc-50/60 px-3.5 text-xs sm:text-sm font-medium transition-all focus:bg-white focus:border-zinc-400 focus:ring-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-2.5">
                <p className="text-center text-[10px] font-semibold tracking-wider text-red-600 uppercase">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="mt-1 h-10 sm:h-11 w-full rounded-xl border-none bg-zinc-950 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white uppercase shadow-sm transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Влез в системата"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-5 border-t border-zinc-100 pt-3 sm:pt-3.5 text-center">
            <p className="text-[9px] sm:text-[10px] font-medium tracking-[0.15em] text-zinc-400 uppercase leading-snug">
              Система за управление на спортен клуб и възстановителен център
            </p>
          </div>
        </BentoCard>

        <p className="mt-2.5 sm:mt-3 text-center text-[9px] sm:text-[10px] font-medium tracking-[0.25em] text-zinc-400 uppercase">
          © 2026 БК Гълъбово & Recovery Zone by ZM
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
