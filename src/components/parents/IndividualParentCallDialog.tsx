"use client";

import { Check, Copy, Loader2, Phone, PhoneCall } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logParentCallAction } from "@/lib/actions/parent-portal";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import { ParentUser } from "@/types/parent-portal.types";

interface Props {
  parent: ParentUser | null;
  childrenList: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CALL_OUTCOMES = [
  "Успешен разговор — потвърдено присъствие на тренировка",
  "Не вдига — да се позвъни отново по-късно",
  "Обсъдена такса / абонамент — поет ангажимент за плащане",
  "Извинено отсъствие / Болно дете",
  "Въпрос относно документ или медицинско свидетелство",
  "Зает в момента — насрочено повторно обаждане",
  "Друго",
];

export function IndividualParentCallDialog({
  parent,
  childrenList,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>(CALL_OUTCOMES[0]);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState(false);

  if (!parent) return null;

  const handleCopyPhone = () => {
    if (parent.phone) {
      navigator.clipboard.writeText(parent.phone);
      setHasCopied(true);
      toast.success("Телефонният номер е копиран.");
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const selectedChild =
    selectedChildId !== "all"
      ? childrenList.find((c) => c.id === selectedChildId)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await logParentCallAction({
        parentId: parent.id,
        parentName: parent.name,
        parentPhone: parent.phone,
        memberId: selectedChild?.id || null,
        memberName: selectedChild?.name || null,
        outcome,
        notes: notes.trim(),
      });

      if (!res.success) {
        toast.error(
          res.error || "Грешка при записване на проведения разговор."
        );
      } else {
        toast.success(
          `Разговорът с ${parent.name} беше успешно записан в досието.`
        );
        setNotes("");
        onSuccess?.();
        onClose();
      }
    } catch {
      toast.error("Системна грешка при запис на обаждането.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md max-h-[92dvh] flex flex-col p-0 overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <DialogHeader className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 pr-10 sm:pr-12 text-left dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <PhoneCall className="size-5 shrink-0" />
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                Запис на разговор с родител
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              Индивидуален лог за разговор с{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {parent.name}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 sm:space-y-4 text-xs">
            {/* Contact info bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Телефон за връзка:
                </div>
                <div className="font-mono text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                  {formatPhoneDisplay(parent.phone)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPhone}
                  className="h-8 rounded-lg text-xs"
                >
                  {hasCopied ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                </Button>
                <Button
                  type="button"
                  asChild
                  size="sm"
                  className="h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  <a href={`tel:${parent.phone}`}>
                    <Phone size={12} className="mr-1" />
                    Набери
                  </a>
                </Button>
              </div>
            </div>

            {/* Child selector if parent has linked children */}
            {childrenList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Относно състезател / дете:
                </Label>
                <Select
                  value={selectedChildId}
                  onValueChange={setSelectedChildId}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs w-full">
                    <SelectValue placeholder="Изберете състезател" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Всички деца / Общ разговор
                    </SelectItem>
                    {childrenList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        👤 {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Outcome selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Резултат от обаждането:
              </Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="h-9 rounded-xl text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_OUTCOMES.map((oc) => (
                    <SelectItem key={oc} value={oc}>
                      {oc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Детайлни бележки от разговора:
              </Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="напр. Родителят потвърди, че ще дойде на тренировка в сряда. Дължимата такса ще бъде преведена по банка..."
                className="min-h-20 sm:min-h-24 rounded-xl text-xs resize-y w-full leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-zinc-100 bg-zinc-50/50 p-3 sm:p-4 sm:px-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 dark:border-zinc-800 dark:bg-zinc-900/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto rounded-xl text-xs cursor-pointer"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 text-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="mr-1 animate-spin" />
                  Запазване...
                </>
              ) : (
                "Запиши в историята"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
