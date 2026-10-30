"use client";

import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSessionAction, loginAction } from "@/lib/actions/auth";

function getFriendlyErrorMessage(err: unknown): string {
  const firebaseErr = err as { code?: string; message?: string };
  const code = firebaseErr?.code || "";

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/invalid-email"
  ) {
    return "Грешен имейл или парола.";
  }
  if (code === "auth/user-disabled") {
    return "Този профил е деактивиран от администратор.";
  }
  if (code === "auth/too-many-requests") {
    return "Твърде много неуспешни опити. Моля, изчакайте няколко минути.";
  }
  if (code === "auth/network-request-failed") {
    return "Мрежова грешка. Проверете интернет връзката си и опитайте отново.";
  }
  if (firebaseErr?.message) {
    return firebaseErr.message;
  }
  return "Възникна грешка при входа. Моля, опитайте отново.";
}

async function syncSessionCookie(
  idToken: string | null,
  email: string,
  pass: string
) {
  if (!idToken) return;
  const sessionRes = await createSessionAction(idToken);
  if (!sessionRes.success) {
    console.warn("createSessionAction fallback:", sessionRes.error);
    const fallbackRes = await loginAction(email, pass);
    if (!fallbackRes.success) {
      console.warn("loginAction fallback:", fallbackRes.error);
    }
  }
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Моля, въведете имейл и парола.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Try client-side sign-in first (ideal for Vercel/production)
      let clientSuccess = false;
      try {
        const [
          {
            signInWithEmailAndPassword,
            setPersistence,
            browserLocalPersistence,
          },
          { getFirebaseAuth },
        ] = await Promise.all([
          import("firebase/auth"),
          import("@/lib/firebase"),
        ]);
        const auth = getFirebaseAuth();
        await setPersistence(auth, browserLocalPersistence).catch(() => {});
        const cred = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        const idToken = await cred.user.getIdToken(true);
        await syncSessionCookie(idToken, cleanEmail, password);
        clientSuccess = true;
      } catch (clientAuthErr: unknown) {
        console.warn("Client auth fallback notice:", clientAuthErr);
      }

      // 2. Fall back to server action (essential for CI emulator environments)
      if (!clientSuccess) {
        const serverRes = await loginAction(cleanEmail, password);
        if (!serverRes.success) {
          throw new Error(serverRes.error || "Неуспешен вход.");
        }
      }

      try {
        localStorage.setItem("firebase:hasAuth", "1");
      } catch {
        // Ignore storage restrictions
      }

      toast.success("Успешен вход", {
        description: "Пренасочваме ви към системата...",
      });

      // 3. Hard navigation: guarantees cookies are sent in request headers
      // and prevents the client-side AuthProvider race condition from bouncing back to /login
      const redirectParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const redirectTarget = redirectParam || "/dashboard";
      window.location.href = redirectTarget;
    } catch (err: unknown) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      toast.error("Грешка при вход", { description: friendlyMessage });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm sm:max-w-md">
      <Link
        href="/"
        className="mb-2.5 sm:mb-3 inline-flex min-h-6 items-center gap-1.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-zinc-600 uppercase transition-colors hover:text-zinc-950 dark:text-zinc-400"
      >
        <ArrowLeft size={13} strokeWidth={2} /> Обратно към порталите
      </Link>

      <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-lg shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950">
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
          <p className="mt-0.5 text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-zinc-600 uppercase dark:text-zinc-400">
            Бадминтон Клуб Гълъбово
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
          <div className="space-y-1 sm:space-y-1.5">
            <Label
              htmlFor="email"
              className="ml-1 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] text-zinc-700 uppercase dark:text-zinc-300"
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
            <div className="mb-1 ml-1 flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-[10px] sm:text-[11px] font-medium tracking-[0.15em] text-zinc-700 uppercase dark:text-zinc-300"
              >
                Парола
              </Label>
              <Link
                href="#"
                className="inline-flex min-h-6 items-center py-1 text-[9px] sm:text-[10px] font-medium tracking-[0.15em] text-zinc-600 uppercase transition-colors hover:text-zinc-950 dark:text-zinc-400"
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
          <p className="text-[9px] sm:text-[10px] font-medium tracking-[0.15em] text-zinc-600 uppercase leading-snug dark:text-zinc-400">
            Система за управление на спортен клуб и възстановителен център
          </p>
        </div>
      </BentoCard>

      <p className="mt-2.5 sm:mt-3 text-center text-[9px] sm:text-[10px] font-medium tracking-[0.25em] text-zinc-600 uppercase dark:text-zinc-400">
        © 2026 БК Гълъбово & Recovery Zone by ZM
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-zinc-50 px-4 py-8 font-sans"
    >
      {/* Background Decorative Elements bounded in overflow-hidden */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 -mt-28 -mr-28 size-96 rounded-full bg-blue-100/30 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -mb-28 -ml-28 size-96 rounded-full bg-zinc-200/40 blur-[100px]" />
      </div>

      <LoginForm />
    </main>
  );
}
