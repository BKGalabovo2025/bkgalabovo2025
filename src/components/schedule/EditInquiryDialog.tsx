"use client";

import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  EventInquiry,
  InquirySkillLevel,
  InquiryStatus,
  InquiryTarget,
} from "@/types/inquiry.types";

interface EditInquiryDialogProps {
  inquiry: EventInquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: EventInquiry) => void;
  idToken?: string | null;
}

export function EditInquiryDialog({
  inquiry,
  isOpen,
  onClose,
  onSaved,
  idToken,
}: EditInquiryDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EventInquiry>>({});

  useEffect(() => {
    if (inquiry) {
      setFormData({
        status: inquiry.status || "new",
        name: inquiry.name || "",
        phone: inquiry.phone || "",
        eventTitle: inquiry.eventTitle || inquiry.procedureName || "",
        procedureName: inquiry.procedureName || inquiry.eventTitle || "",
        preferredZone: inquiry.preferredZone || "",
        preferredTimeSlot: inquiry.preferredTimeSlot || "",
        goal: inquiry.goal || "",
        eventDate: inquiry.eventDate || "",
        eventTime: inquiry.eventTime || "",
        target: inquiry.target || "self",
        childAge: inquiry.childAge || "",
        level: inquiry.level || "beginner",
        notes: inquiry.notes || "",
      });
    }
  }, [inquiry]);

  if (!inquiry) return null;

  const isRecovery = inquiry.siteId === "recoveryzone";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.id || !idToken) return;

    if (!formData.name?.trim()) {
      toast.error("Моля, въведете име на клиента/кандидата.");
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error("Моля, въведете телефонен номер.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: inquiry.id,
        status: formData.status,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        eventTitle: (formData.eventTitle || "").trim(),
        procedureName: (formData.procedureName || "").trim() || null,
        preferredZone: (formData.preferredZone || "").trim() || null,
        preferredTimeSlot: (formData.preferredTimeSlot || "").trim() || null,
        goal: (formData.goal || "").trim() || null,
        eventDate: (formData.eventDate || "").trim() || null,
        eventTime: (formData.eventTime || "").trim() || null,
        target: formData.target || null,
        childAge: (formData.childAge || "").trim() || null,
        level: formData.level || null,
        notes: (formData.notes || "").trim() || null,
      };

      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Запитването беше обновено успешно.");
        onSaved({
          ...inquiry,
          ...payload,
          status: payload.status as InquiryStatus,
        });
        onClose();
      } else {
        toast.error(data.error || "Грешка при обновяване на запитването.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Възникна системна грешка при запазване.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Редактиране на запитване
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Редактирайте статуса, контактната информация или бележките към това
            запитване.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Status selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-inq-status"
              className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-400"
            >
              Статус на запитването
            </Label>
            <Select
              value={formData.status || "new"}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  status: val as InquiryStatus,
                }))
              }
            >
              <SelectTrigger
                id="edit-inq-status"
                name="edit-inq-status"
                className="h-10 text-xs"
              >
                <SelectValue placeholder="Изберете статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  🔵 Ново (Чака първи контакт / обаждане)
                </SelectItem>
                <SelectItem value="contacted">
                  🟡 Свързан (Проведен е разговор с клиента)
                </SelectItem>
                <SelectItem value="enrolled">
                  🟢 Записан (Потвърден час / участие)
                </SelectItem>
                <SelectItem value="archived">
                  ⚪ Архив (Приключило / отложено запитване)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-inq-name"
                className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                Име и фамилия
              </Label>
              <Input
                id="edit-inq-name"
                name="edit-inq-name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-inq-phone"
                className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                Телефон за връзка
              </Label>
              <Input
                id="edit-inq-phone"
                name="edit-inq-phone"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          {/* Event / Procedure Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-inq-event-title"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              {isRecovery ? "Процедура / Услуга" : "Събитие / Тренировка"}
            </Label>
            <Input
              id="edit-inq-event-title"
              name="edit-inq-event-title"
              value={formData.eventTitle || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  eventTitle: e.target.value,
                  procedureName: e.target.value,
                }))
              }
              className="h-9 text-xs"
              required
            />
          </div>

          {isRecovery ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Preferred Zone */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-inq-zone"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  Зона / Приставка
                </Label>
                <Input
                  id="edit-inq-zone"
                  name="edit-inq-zone"
                  placeholder="напр. Крака, Таз, Ръце"
                  value={formData.preferredZone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredZone: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              {/* Time slot */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-inq-time-slot"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  Удобно време / Час
                </Label>
                <Input
                  id="edit-inq-time-slot"
                  name="edit-inq-time-slot"
                  placeholder="напр. След 17:30 ч."
                  value={formData.preferredTimeSlot || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredTimeSlot: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              {/* Goal */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="edit-inq-goal"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  Цел на посещението
                </Label>
                <Input
                  id="edit-inq-goal"
                  name="edit-inq-goal"
                  placeholder="напр. Възстановяване след мач, тежест в краката"
                  value={formData.goal || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, goal: e.target.value }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Target */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-inq-target"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  За кого
                </Label>
                <Select
                  value={formData.target || "self"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      target: val as InquiryTarget,
                    }))
                  }
                >
                  <SelectTrigger
                    id="edit-inq-target"
                    name="edit-inq-target"
                    className="h-9 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">За мен (възрастен)</SelectItem>
                    <SelectItem value="child">За дете</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-inq-level"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                  Ниво на подготовка
                </Label>
                <Select
                  value={formData.level || "beginner"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      level: val as InquirySkillLevel,
                    }))
                  }
                >
                  <SelectTrigger
                    id="edit-inq-level"
                    name="edit-inq-level"
                    className="h-9 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Начинаещ</SelectItem>
                    <SelectItem value="intermediate">Средно ниво</SelectItem>
                    <SelectItem value="advanced">Напреднал</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target === "child" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="edit-inq-child-age"
                    className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
                  >
                    Възраст на детето
                  </Label>
                  <Input
                    id="edit-inq-child-age"
                    name="edit-inq-child-age"
                    placeholder="напр. 10 г."
                    value={formData.childAge || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        childAge: e.target.value,
                      }))
                    }
                    className="h-9 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-inq-notes"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400"
            >
              Бележка / Въпрос от клиента или вътрешен коментар
            </Label>
            <Textarea
              id="edit-inq-notes"
              name="edit-inq-notes"
              rows={3}
              placeholder="Въведете допълнителни детайли, бележки или уговорки..."
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
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
              className="bg-primary text-xs font-bold"
            >
              {isSaving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Запази промените
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
