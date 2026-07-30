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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 p-6 font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-64 -mr-64 size-[500px] rounded-full bg-zinc-200/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -mb-64 -ml-64 size-[500px] rounded-full bg-zinc-200/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md duration-700 animate-in fade-in slide-in-from-bottom-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] text-zinc-400 uppercase transition-colors hover:text-zinc-950"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Обратно към началото
        </Link>

        <BentoCard className="rounded-4xl border-zinc-100 bg-white p-10 shadow-none">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 flex size-16 -rotate-6 transform items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-none">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h1 className="font-bento text-3xl font-light tracking-tighter text-zinc-950 uppercase">
              Админ Портал
            </h1>
            <p className="mt-2 text-[10px] font-medium tracking-[0.4em] text-zinc-400 uppercase">
              Бадминтон Клуб Гълъбово
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase"
              >
                Имейл
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@bkgalabovo.com"
                required
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 px-6 font-medium transition-all focus:bg-white focus:ring-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase"
                >
                  Парола
                </Label>
                <Link
                  href="#"
                  className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase transition-colors hover:text-zinc-950"
                >
                  Забравена парола?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 px-6 font-medium transition-all focus:bg-white focus:ring-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-center text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="h-14 w-full rounded-2xl border-none bg-zinc-950 text-[11px] font-medium tracking-[0.2em] text-white uppercase shadow-none transition-all hover:bg-zinc-900 active:scale-95 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Влез в системата"
              )}
            </Button>
          </form>

          <div className="mt-10 border-t border-zinc-50 pt-8 text-center">
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Система за управление на спортни клубове
            </p>
          </div>
        </BentoCard>

        <p className="mt-8 text-center text-[10px] font-medium tracking-[0.4em] text-zinc-300 uppercase">
          v2.1.0 • Secure Infrastructure
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
