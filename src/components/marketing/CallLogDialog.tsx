"use client";

import { CheckCircle2, Loader2, PhoneCall } from "lucide-react";
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
import {
  ContactCommunicationStatus,
  MarketingRecipient,
} from "@/types/marketing.types";

interface CallLogDialogProps {
  contact: MarketingRecipient | null;
  isOpen: boolean;
  onClose: () => void;
  onLogged: (
    contactId: string,
    newStatus: ContactCommunicationStatus,
    note: string
  ) => Promise<void>;
}

const CALL_OUTCOMES = [
  "Успешен разговор — потвърдено участие / час",
  "Не вдига — да се позвъни отново по-късно",
  "Проявен интерес към възстановяване / процедури",
  "Проявен интерес към тренировки / лагер",
  "Зает в момента — насрочено повторно обаждане",
  "Отказа се — не проявява интерес в момента",
  "Друго",
];

export function CallLogDialog({
  contact,
  isOpen,
  onClose,
  onLogged,
}: CallLogDialogProps) {
  const [outcome, setOutcome] = useState<string>(CALL_OUTCOMES[0]);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] =
    useState<ContactCommunicationStatus>("contacted");
  const [isSaving, setIsSaving] = useState(false);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fullNote = notes.trim()
        ? `[${outcome}] ${notes.trim()}`
        : `[${outcome}]`;
      await onLogged(contact.id, newStatus, fullNote);
      toast.success(
        `Разговорът с ${contact.name} беше успешно записан в историята.`
      );
      setNotes("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при запазване на обаждането.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-500">
            <PhoneCall className="size-5" />
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
              Записване на проведен телефонен разговор
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Запишете резултата от проведения разговор с{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {contact.name}
            </strong>{" "}
            ({contact.phone || "без телефон"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Outcome Select */}
          <div className="space-y-1.5">
            <Label
              htmlFor="call-outcome-select"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Резултат от обаждането
            </Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger
                id="call-outcome-select"
                name="call-outcome-select"
                className="h-10 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALL_OUTCOMES.map((item) => (
                  <SelectItem key={item} value={item} className="text-xs">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Status */}
          <div className="space-y-1.5">
            <Label
              htmlFor="call-status-select"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Статус на контакта след разговора
            </Label>
            <Select
              value={newStatus}
              onValueChange={(val) =>
                setNewStatus(val as ContactCommunicationStatus)
              }
            >
              <SelectTrigger
                id="call-status-select"
                name="call-status-select"
                className="h-10 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">
                  🟡 Свързан (Успешен контакт)
                </SelectItem>
                <SelectItem value="pending">
                  🔵 За контакт (Нужно е ново обаждане)
                </SelectItem>
                <SelectItem value="archived">
                  ⚪ Архив (Приключил / отложен контакт)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="call-notes"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Допълнителни бележки / подробности
            </Label>
            <Textarea
              id="call-notes"
              name="call-notes"
              rows={3}
              placeholder="Въведете какво си казахте с клиента, свободен час, договорена цена или условия..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-3.5" />
              )}
              Запази разговора
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
