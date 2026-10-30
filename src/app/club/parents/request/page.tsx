"use client";

import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { submitParentAccessRequestAction } from "@/lib/actions/parent-portal";
import { ParentRole } from "@/types/parent-portal.types";

export default function ParentRequestPage() {
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRole, setParentRole] = useState<ParentRole>("mother");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [childFullName, setChildFullName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentName.trim()) {
      toast.error("Моля, въведете трите си имена.");
      return;
    }
    if (!parentPhone.trim()) {
      toast.error("Моля, въведете телефонен номер.");
      return;
    }
    if (!parentEmail.trim()) {
      toast.error("Моля, въведете имейл адрес.");
      return;
    }
    if (password.length < 6) {
      toast.error("Паролата трябва да бъде поне 6 символа.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Паролите не съвпадат.");
      return;
    }
    if (!childFullName.trim()) {
      toast.error("Моля, въведете името на детето.");
      return;
    }
    if (!childBirthDate) {
      toast.error("Моля, изберете рождена дата на детето.");
      return;
    }
    if (!agreedTerms) {
      toast.error("Моля, потвърдете съгласието си.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await submitParentAccessRequestAction({
        parentName,
        parentPhone,
        parentEmail,
        password,
        parentRole,
        childFullName,
        childBirthDate,
      });

      if (!res.success) {
        toast.error(res.error || "Грешка при изпращане на заявката.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Заявката беше изпратена успешно!");
    } catch {
      toast.error("Възникна мрежова грешка при изпращане.");
      setIsLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-slate-100 sm:px-6"
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Back link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/club/parents/login"
            className="inline-flex min-h-11 items-center gap-2 py-2 text-xs font-semibold tracking-wider text-zinc-300 uppercase transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            <span>Към вход за родители</span>
          </Link>
          <Link
            href="/club"
            className="inline-flex min-h-11 items-center py-2 text-xs text-zinc-400 hover:text-white"
          >
            Към сайта на клуба
          </Link>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={44} />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
              <Sparkles size={12} />
              <span>Заявката е приета</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-white uppercase sm:text-3xl">
              Успешно изпратена заявка!
            </h1>

            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              Благодарим ви, <strong>{parentName}</strong>! Вашата заявка за
              достъп до картона на <strong>{childFullName}</strong> е
              регистрирана.
            </p>

            <div className="my-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-left text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <Shield size={16} className="text-blue-400" />
                <span>Какво следва?</span>
              </div>
              <p>
                1. Треньорът / администраторът на клуба ще прегледа данните и ще
                активира вашия профил.
              </p>
              <p>
                2. Веднага след одобрението ще получите **потвърдителен имейл**
                на <span className="text-white">{parentEmail}</span>.
              </p>
              <p>
                3. След това ще можете да влезете със своя телефон{" "}
                <span className="text-white">{parentPhone}</span> и избраната
                парола.
              </p>
            </div>

            <Link
              href="/club/parents/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105"
            >
              Към екрана за вход
            </Link>
          </div>
        ) : (
          /* Request Form Card */
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
                Заявка за родителски достъп
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Попълнете данните, за да заявите достъп до досието на детето си
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION 1: PARENT INFO */}
              <div className="space-y-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-400 uppercase">
                  <User size={15} />
                  <span>1. Данни за родителя</span>
                </div>

                <div>
                  <label
                    htmlFor="parentName"
                    className="mb-1 block text-xs font-semibold text-zinc-300"
                  >
                    Име и фамилия на родителя *
                  </label>
                  <input
                    id="parentName"
                    type="text"
                    required
                    placeholder="напр. Мария Иванова"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Role selection */}
                <div>
                  <p className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Вие сте: *
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { role: "mother", label: "Майка" },
                        { role: "father", label: "Баща" },
                        { role: "guardian", label: "Настойник" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setParentRole(item.role)}
                        className={`rounded-xl border py-2.5 text-xs font-bold uppercase transition-all ${
                          parentRole === item.role
                            ? "border-blue-500 bg-blue-600/30 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="parentPhone"
                      className="mb-1 block text-xs font-semibold text-zinc-300"
                    >
                      Телефонен номер *
                    </label>
                    <div className="relative">
                      <input
                        id="parentPhone"
                        type="tel"
                        required
                        placeholder="0888 123 456"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                      />
                      <Phone
                        size={14}
                        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="parentEmail"
                      className="mb-1 block text-xs font-semibold text-zinc-300"
                    >
                      Имейл адрес *
                    </label>
                    <div className="relative">
                      <input
                        id="parentEmail"
                        type="email"
                        required
                        placeholder="roditel@email.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                      />
                      <Mail
                        size={14}
                        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PASSWORD */}
              <div className="space-y-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-400 uppercase">
                  <KeyRound size={15} />
                  <span>2. Парола за достъп</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-xs font-semibold text-zinc-300"
                    >
                      Парола (мин. 6 знака) *
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1 block text-xs font-semibold text-zinc-300"
                    >
                      Повторете паролата *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: CHILD INFO */}
              <div className="space-y-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-400 uppercase">
                  <Users size={15} />
                  <span>3. Данни за детето</span>
                </div>

                <div>
                  <label
                    htmlFor="childFullName"
                    className="mb-1 block text-xs font-semibold text-zinc-300"
                  >
                    Име и фамилия на детето *
                  </label>
                  <input
                    id="childFullName"
                    type="text"
                    required
                    placeholder="напр. Иван Иванов"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="childBirthDate"
                    className="mb-1 block text-xs font-semibold text-zinc-300"
                  >
                    Дата на раждане на детето *
                  </label>
                  <div className="relative">
                    <input
                      id="childBirthDate"
                      type="date"
                      required
                      value={childBirthDate}
                      onChange={(e) => setChildBirthDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Използва се за сигурно разпознаване на детето в клубната
                    картотека.
                  </p>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="agreedTerms"
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="agreedTerms"
                  className="text-xs text-zinc-400 select-none leading-relaxed"
                >
                  Запознат съм, че достъпът ще бъде активиран след потвърждение
                  от треньор и че данните за контакт ще бъдат вписани в досието
                  на детето.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-1.01 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Изпращане на заявката...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake size={16} />
                    <span>Изпрати заявка за достъп</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
