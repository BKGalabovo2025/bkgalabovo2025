"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EventInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id?: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    type?: string;
  } | null;
  clubPhone?: string;
}

export function EventInquiryDialog({
  isOpen,
  onClose,
  event,
  clubPhone = "+359 899 82 99 23",
}: EventInquiryDialogProps) {
  const [mode, setMode] = useState<"form" | "phone">("form");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [target, setTarget] = useState<"self" | "child">("self");
  const [childAge, setChildAge] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const rawPhone = clubPhone.replace(/\s+/g, "");

  const eventDateStr = new Date(event.startTime).toLocaleDateString("bg-BG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const eventTimeStr = `${new Date(event.startTime).toLocaleTimeString(
    "bg-BG",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )} - ${new Date(event.endTime).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  })} ч.`;

  const resetForm = () => {
    setName("");
    setPhone("");
    setTarget("self");
    setChildAge("");
    setLevel("beginner");
    setNotes("");
    setIsSuccess(false);
    setErrorMessage(null);
    setMode("form");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Моля, въведете Вашето име и фамилия.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage("Моля, въведете коректен телефон за връзка.");
      return;
    }
    if (target === "child" && !childAge.trim()) {
      setErrorMessage("Моля, посочете възрастта на детето.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          target,
          childAge: target === "child" ? childAge.trim() : null,
          level,
          notes: notes.trim() || null,
          eventId: event.id || null,
          eventTitle: event.title,
          eventDate: eventDateStr,
          eventTime: eventTimeStr,
          eventLocation: event.location || 'Спортна зала „Енергетик"',
          siteId: "bkgalabovo",
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error || "Грешка при изпращането.");
      }

      setIsSuccess(true);
      toast.success("Запитването беше изпратено успешно!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Възникна грешка при изпращане.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-500/30 bg-zinc-950 p-0 text-white shadow-2xl backdrop-blur-2xl sm:max-w-xl">
        {/* Header */}
        <div className="relative shrink-0 border-b border-zinc-800/80 bg-zinc-900/60 p-5 pr-14 pb-3 sm:p-6 sm:pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold tracking-widest text-blue-400 uppercase">
                Записване & Контакт
              </span>
            </div>
            <DialogTitle className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
              ЗАПИТВАНЕ за: {event.title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-zinc-400">
              Свържете се с клуба за записване, свободни места или въпроси.
            </DialogDescription>
          </DialogHeader>

          {/* Event Context Info Box */}
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/60 p-3 text-xs text-zinc-300">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 font-medium text-white">
                <Calendar size={13} className="text-blue-400" />
                <span className="capitalize">{eventDateStr}</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Clock size={13} className="text-blue-400" />
                <span>{eventTimeStr}</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <MapPin size={13} className="text-blue-400" />
                <span>{event.location || 'Спортна зала „Енергетик"'}</span>
              </span>
            </div>
          </div>

          {/* Option Selector: Form vs Direct Call */}
          {!isSuccess && (
            <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setMode("form")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                  mode === "form"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <MessageSquare size={14} />
                <span>Форма за запитване</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                  mode === "phone"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Phone size={14} />
                <span>Обади се по телефон</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  Благодарим ви! Запитването е прието.
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
                  Ще се свържем с вас на посочения телефон за потвърждение и
                  детайли.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="h-11 rounded-xl bg-zinc-800 px-8 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-zinc-700"
                  >
                    Затвори
                  </Button>
                </div>
              </motion.div>
            ) : // eslint-disable-next-line sonarjs/no-nested-conditional
            mode === "phone" ? (
              /* PHONE CALL MODE */
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-6 text-center"
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Phone size={30} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  Директна телефонна връзка с треньора
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-xs text-zinc-400">
                  Можете да се обадите директно за въпроси относно събитието,
                  график или записване.
                </p>

                <div className="mt-6">
                  <a
                    href={`tel:${rawPhone}`}
                    className="inline-flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-6 py-3.5 text-lg font-black tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-102 hover:bg-emerald-500/25"
                  >
                    <Phone size={18} />
                    <span>{clubPhone}</span>
                  </a>
                </div>

                <p className="mt-4 text-[11px] text-zinc-500">
                  Работно време на залата и треньорите: Понеделник – Неделя
                </p>

                <div className="mt-8 border-t border-zinc-800/80 pt-5">
                  <button
                    type="button"
                    onClick={() => setMode("form")}
                    className="text-xs font-medium text-blue-400 transition-colors hover:underline"
                  >
                    ← Предпочитате да оставите запитване писмено?
                  </button>
                </div>
              </motion.div>
            ) : (
              /* INQUIRY FORM MODE */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                      {errorMessage}
                    </div>
                  )}

                  {/* Name and Phone in 2 cols */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                        <User size={13} className="text-blue-400" />
                        <span>
                          Име и Фамилия <span className="text-rose-400">*</span>
                        </span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Напр. Иван Иванов"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-10 rounded-xl border-zinc-800 bg-zinc-900/90 text-sm text-white focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                        <Phone size={13} className="text-blue-400" />
                        <span>
                          Телефон за връзка{" "}
                          <span className="text-rose-400">*</span>
                        </span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="Напр. 0899 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="h-10 rounded-xl border-zinc-800 bg-zinc-900/90 text-sm text-white focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Target (Self vs Child) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      За кого е ЗАПИТВАНЕТО?{" "}
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTarget("self")}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition-all ${
                          target === "self"
                            ? "border-blue-500 bg-blue-500/15 text-blue-300"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-sm">🔘</span>
                        <span>За мен (възрастен)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTarget("child")}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition-all ${
                          target === "child"
                            ? "border-blue-500 bg-blue-500/15 text-blue-300"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-sm">🔘</span>
                        <span>За дете</span>
                      </button>
                    </div>

                    {/* Child Age input (shown only when 'child' is selected) */}
                    {target === "child" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-1.5"
                      >
                        <Input
                          type="text"
                          placeholder="Въведете възраст на детето (напр. 9 г.)"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          required={target === "child"}
                          className="h-10 rounded-xl border-blue-500/40 bg-blue-950/20 text-sm text-white focus:border-blue-500"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Skill level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Ниво на игра:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "beginner", label: "Начинаещ" },
                        { key: "intermediate", label: "Средно" },
                        { key: "advanced", label: "Напреднал" },
                      ].map((lvl) => (
                        <button
                          key={lvl.key}
                          type="button"
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onClick={() => setLevel(lvl.key as any)}
                          className={`rounded-xl border py-1.5 text-xs font-medium transition-all ${
                            level === lvl.key
                              ? "border-blue-500 bg-blue-500/20 font-bold text-white"
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes / Questions */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Бележка / Въпрос (по желание):
                    </label>
                    <Textarea
                      placeholder="Имате ли въпроси за екипировка, график или друго..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="rounded-xl border-zinc-800 bg-zinc-900/90 text-sm text-white focus:border-blue-500"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Изпращане...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Изпрати</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
