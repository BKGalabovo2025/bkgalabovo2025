"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import Link from "next/link";

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
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Успешен вход", {
        description: "Пренасочваме ви към таблото за управление...",
      });
      router.push("/dashboard");
    } catch (err) {
      let errorMessage = "Възникна грешка при входа. Моля, опитайте отново.";
      const firebaseError = err as AuthError;
      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        errorMessage = "Грешен имейл или парола.";
      }
      setError(errorMessage);
      console.error("Firebase Login Error:", err);
      toast.error("Грешка при вход", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-200/20 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-200/20 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition-colors mb-8 font-medium uppercase tracking-[0.3em] text-[10px]"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Обратно към началото
        </Link>

        <BentoCard className="p-10 bg-white border-zinc-100 shadow-none rounded-[2.5rem]">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 bg-zinc-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-none mb-6 transform -rotate-6 border border-zinc-800">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tighter text-zinc-950 font-bento uppercase">
              Админ Портал
            </h1>
            <p className="text-zinc-400 font-medium tracking-[0.4em] uppercase text-[10px] mt-2">
              Бадминтон Клуб Гълъбово
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 ml-1"
              >
                Имейл
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bkgalabovo.com"
                required
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-medium px-6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500"
                >
                  Парола
                </Label>
                <Link
                  href="#"
                  className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] hover:text-zinc-950 transition-colors"
                >
                  Забравена парола?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-medium px-6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.1em] text-center">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white font-medium uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-none transition-all active:scale-95 disabled:opacity-50 border-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Влез в системата"
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">
              Система за управление на спортни клубове
            </p>
          </div>
        </BentoCard>

        <p className="mt-8 text-center text-[10px] font-medium text-zinc-300 uppercase tracking-[0.4em]">
          v2.1.0 • Secure Infrastructure
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
