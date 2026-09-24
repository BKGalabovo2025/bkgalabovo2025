"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Loader2,
  Phone,
  Send,
  Sparkles,
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

export interface RecoveryProcedureInfo {
  title: string;
  category?: string;
  duration?: string;
  price?: string;
  preferredZone?: string;
}

const DEFAULT_CONTRAINDICATIONS = [
  "Остро възпаление на дълбоките вени (Тромбоза) или съмнение за такова",
  "Инфекциозни заболявания на кожата или открити рани в третираната зона",
  "Сърдечна недостатъчност (белодробен оток или конгестивна)",
  "Наличие на тумори в третираната зона или съмнение за такива",
  "Остра коремна инфекция или бременност (само за приставката за таз)",
  "Електронен имплант в тялото (пейсмейкър)",
  "Лимфедем (за приставката за ръце) — препоръчителна е консултация с лекар",
  "Всяко друго състояние, при което повишеният венозен или лимфен поток е нежелан",
];

interface RecoveryInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  procedure?: RecoveryProcedureInfo | null;
  phone?: string;
  contraindications?: string[];
}

export const recoveryCatalogGroups = [
  {
    group: "ЕДИНИЧНИ СЕСИИ",
    items: ["Зона „Крака“", "Зона „Таз“", "Зона „Ръце“"],
  },
  {
    group: "КОМБИНИРАНИ СЕСИИ",
    items: ["Комбинирана сесия: Ръце + Таз", "Комбинирана сесия: Ръце + Крака"],
  },
  {
    group: "VIP СЕСИИ",
    items: ["Ексклузивно предложение (Двудневен VIP пакет за двама)"],
  },
  {
    group: "ТУРНИРНИ СЕСИИ",
    items: [
      "Двудневен турнирен пакет (1 състезател)",
      "Тридневен турнирен пакет (1 състезател)",
      "Двудневен турнирен пакет (2 състезатели)",
      "Тридневен турнирен пакет (2 състезатели)",
    ],
  },
];

const proceduresList = recoveryCatalogGroups.flatMap((g) => g.items);

const goalsList = [
  { id: "sports", label: "Спортно възстановяване" },
  { id: "fatigue", label: "Релакс" },
  { id: "pain", label: "Скованост / болка / отток / тежест в мускулите" },
  { id: "trial", label: "Пробна сесия / Първо посещение" },
];

const timeSlots = [
  "Сутрин (09:00 - 12:00 ч.)",
  "Обяд (12:00 - 15:00 ч.)",
  "Следобед (15:00 - 18:00 ч.)",
  "Вечер (18:00 - 21:00 ч.)",
];

// eslint-disable-next-line sonarjs/cognitive-complexity
export function RecoveryInquiryDialog({
  isOpen,
  onClose,
  procedure,
  phone = "+359 899 82 99 23",
  contraindications,
}: RecoveryInquiryDialogProps) {
  // Use admin-configured contraindications if provided and non-empty, otherwise fall back to defaults
  const resolvedContraindications =
    contraindications && contraindications.length > 0
      ? contraindications
      : DEFAULT_CONTRAINDICATIONS;
  const [mode, setMode] = useState<"form" | "phone">("form");

  // Form fields
  const [name, setName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(
    procedure?.title || proceduresList[0]
  );
  const [selectedGoal, setSelectedGoal] = useState(goalsList[0].label);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlots[2]);
  const [notes, setNotes] = useState("");
  const [contraindicationsAcknowledged, setContraindicationsAcknowledged] =
    useState(false);
  const [showContraindications, setShowContraindications] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync procedure when dialog opens with a specific procedure
  React.useEffect(() => {
    if (procedure?.title) {
      const match = proceduresList.find(
        (p) =>
          p.toLowerCase().includes(procedure.title.toLowerCase()) ||
          procedure.title.toLowerCase().includes(p.toLowerCase()) ||
          (procedure.preferredZone &&
            p.toLowerCase().includes(procedure.preferredZone.toLowerCase()))
      );
      setSelectedProcedure(match || procedure.title);
    }
  }, [procedure]);

  const rawPhone = phone.replace(/\s+/g, "");

  const resetForm = () => {
    setName("");
    setClientPhone("");
    setSelectedGoal(goalsList[0].label);
    setSelectedTimeSlot(timeSlots[2]);
    setNotes("");
    setContraindicationsAcknowledged(false);
    setShowContraindications(false);
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

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Моля, въведете име и фамилия.");
      return;
    }

    if (!clientPhone.trim() || clientPhone.trim().length < 6) {
      setErrorMessage("Моля, въведете валиден телефонен номер.");
      return;
    }

    if (!contraindicationsAcknowledged) {
      setErrorMessage(
        "Моля, потвърдете, че сте запознати с противопоказанията."
      );
      setShowContraindications(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        phone: clientPhone.trim(),
        eventTitle: selectedProcedure,
        procedureName: selectedProcedure,
        preferredZone: procedure?.preferredZone || null,
        goal: selectedGoal,
        preferredTimeSlot: selectedTimeSlot,
        notes: notes.trim() || null,
        siteId: "recoveryzone",
        eventLocation: "Спортна зала „Енергетик“ - Recovery Zone by ZM",
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Грешка при изпращане на запитването.");
      }

      setIsSuccess(true);
      toast.success("Запитването е изпратено успешно!");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : null;
      setErrorMessage(
        msg ||
          "Възникна системна грешка. Моля, опитайте отново или се обадете по телефона."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-zinc-950 p-0 text-white shadow-2xl backdrop-blur-2xl sm:max-w-xl">
        {/* Header decoration */}
        <div className="relative shrink-0 bg-linear-to-br from-emerald-950/80 via-zinc-950 to-zinc-950 p-5 pr-14 pb-3 sm:p-6 sm:pb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              <Sparkles size={12} />
              RECOVERY ZONE BY ZM
            </span>
          </div>

          <DialogHeader className="mt-2.5 text-left">
            <DialogTitle className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Запитване за Сесия
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Изберете удобен начин за запазване на час и информация.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          {!isSuccess && (
            <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900/90 p-1">
              <button
                type="button"
                onClick={() => setMode("form")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold tracking-wide transition-all ${
                  mode === "form"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <HeartPulse size={14} />
                Форма за запитване
              </button>
              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold tracking-wide transition-all ${
                  mode === "phone"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Phone size={14} />
                Обади се по телефона
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-3 sm:px-6 sm:py-4">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="my-6 flex flex-col items-center py-6 text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  Запитването е прието успешно!
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-300">
                  Благодарим ви, <strong>{name}</strong>! Екипът на Recovery
                  Zone by ZM ще се свърже с вас на телефон{" "}
                  <strong className="text-emerald-400">{clientPhone}</strong> за
                  потвърждение на точния час за:
                </p>
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-bold text-emerald-300">
                  {selectedProcedure}
                </div>
                <Button
                  onClick={handleClose}
                  className="mt-6 h-11 w-full rounded-xl bg-emerald-500 font-bold text-white transition-all hover:bg-emerald-600"
                >
                  Затвори прозореца
                </Button>
              </motion.div>
            ) : // eslint-disable-next-line sonarjs/no-nested-conditional
            mode === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="my-4 space-y-4 text-center"
              >
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Директна връзка с Recovery Zone by ZM
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-400">
                    Обадете ни се за незабавна информация, проверка на свободни
                    часове или записване.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="text-xs text-zinc-400">
                    Телефон за контакт:
                  </div>
                  <a
                    href={`tel:${rawPhone}`}
                    className="mt-1 block text-2xl font-black tracking-wider text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    {phone}
                  </a>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    Работно време: Понеделник - Неделя (с предварително
                    записване)
                  </div>
                </div>

                <a
                  href={`tel:${rawPhone}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                >
                  <Phone size={16} />
                  Набери сега ({phone})
                </a>

                <button
                  type="button"
                  onClick={() => setMode("form")}
                  className="text-xs text-zinc-400 underline hover:text-white"
                >
                  Или попълнете формата за запитване
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-3.5 py-1"
              >
                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {errorMessage}
                  </div>
                )}

                {/* Procedure Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Изберете сесия / зона
                  </label>
                  <select
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {recoveryCatalogGroups.map((group) => (
                      <optgroup
                        key={group.group}
                        label={group.group}
                        className="bg-zinc-950 font-bold text-emerald-400"
                      >
                        {group.items.map((item) => (
                          <option
                            key={item}
                            value={item}
                            className="bg-zinc-900 font-normal text-white"
                          >
                            {item}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Name & Phone in 2-col on sm */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Име и Фамилия <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative mt-1">
                      <User
                        size={15}
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        type="text"
                        required
                        placeholder="напр. Иван Иванов"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 rounded-xl border-zinc-800 bg-zinc-900 pl-10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Телефон за връзка <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Phone
                        size={15}
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        type="tel"
                        required
                        placeholder="напр. 0899 123 456"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="h-10 rounded-xl border-zinc-800 bg-zinc-900 pl-10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Goal Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Основна цел на посещението
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {goalsList.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGoal(g.label)}
                        className={`rounded-xl border px-3 py-1.5 text-left text-[11px] font-medium transition-all ${
                          selectedGoal === g.label
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Предпочитан часови диапазон
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`rounded-xl border px-3 py-1.5 text-center text-[11px] font-medium transition-all ${
                          selectedTimeSlot === slot
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contraindications */}
                <div
                  className={`rounded-xl border transition-all ${
                    contraindicationsAcknowledged
                      ? "border-emerald-700/40 bg-emerald-950/20"
                      : "border-amber-500/40 bg-amber-950/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowContraindications((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        className={
                          contraindicationsAcknowledged
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          contraindicationsAcknowledged
                            ? "text-emerald-300"
                            : "text-amber-300"
                        }`}
                      >
                        {contraindicationsAcknowledged
                          ? "✓ Запознат/а съм с противопоказанията"
                          : "Информация за противопоказания (задължително)"}
                      </span>
                    </div>
                    {showContraindications ? (
                      <ChevronUp size={14} className="shrink-0 text-zinc-400" />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="shrink-0 text-zinc-400"
                      />
                    )}
                  </button>

                  {showContraindications && (
                    <div className="border-t border-zinc-800 px-3.5 pt-2.5 pb-3">
                      <p className="mb-2 text-[11px] leading-relaxed text-zinc-300">
                        За вашата безопасност, моля консултирайте се с лекар
                        преди да използвате системите за възстановяване, ако
                        имате някое от следните състояния:
                      </p>
                      <ul className="mb-3 space-y-1">
                        {resolvedContraindications.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-1.5 text-[10.5px] text-zinc-400"
                          >
                            <span className="mt-0.5 shrink-0 text-amber-500">
                              •
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={contraindicationsAcknowledged}
                          onChange={(e) =>
                            setContraindicationsAcknowledged(e.target.checked)
                          }
                          className="mt-0.5 size-4 shrink-0 accent-emerald-500"
                        />
                        <span className="text-[11px] leading-relaxed text-zinc-300">
                          Прочетох и потвърждавам, че не страдам от нито едно от
                          изброените противопоказания.
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {contraindicationsAcknowledged && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300">
                      Допълнителен въпрос или бележка (по желание)
                    </label>
                    <Textarea
                      placeholder="Ако имате специфични въпроси, предпочитана дата или здравословни особености..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1.5 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-emerald-500 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Изпращане...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Send size={14} />
                        Изпрати запитване за час
                      </div>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
