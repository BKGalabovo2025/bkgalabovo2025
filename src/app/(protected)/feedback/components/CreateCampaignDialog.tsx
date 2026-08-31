"use client";

import { Check, Copy, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
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
import { feedbackService } from "@/services/feedback-service";
import { ScheduleEvent } from "@/types";
import {
  FeedbackEventType,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  templates: FeedbackSurveyTemplate[];
  events: ScheduleEvent[];
  onCampaignCreated: () => void;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  siteId,
  templates,
  events,
  onCampaignCreated,
}: CreateCampaignDialogProps) {
  const [selectedEventType, setSelectedEventType] =
    useState<FeedbackEventType>("camp");
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<
    "parents" | "athletes" | "all"
  >("parents");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Auto-select template matching eventType when type changes
  const handleEventTypeChange = (type: FeedbackEventType) => {
    setSelectedEventType(type);
    const matchingTemplate = templates.find((t) => t.eventType === type);
    if (matchingTemplate) {
      setSelectedTemplateId(matchingTemplate.id);
    }
  };

  // When event is selected from list, auto-fill title
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId !== "none") {
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        setTitle(`Обратна връзка: ${ev.title}`);
        setDescription(
          `Моля, споделете вашите впечатления и препоръки за „${ev.title}“.`
        );
        if (ev.type === "camp") setSelectedEventType("camp");
        if (ev.type === "competition") setSelectedEventType("competition");
        if (ev.type === "training") setSelectedEventType("training");
      }
    }
  };

  const handleCreate = async () => {
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      toast.error("Моля, изберете шаблон за анкетата");
      return;
    }

    if (!title.trim()) {
      toast.error("Моля, въведете заглавие на анкетата");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedEvent =
        selectedEventId !== "none"
          ? events.find((e) => e.id === selectedEventId)
          : null;

      const campaignId = await feedbackService.createCampaign(siteId, {
        title: title.trim(),
        description: description.trim(),
        eventType: selectedEventType,
        eventId: selectedEvent ? selectedEvent.id : undefined,
        eventTitle: selectedEvent ? selectedEvent.title : undefined,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        questions: selectedTemplate.questions,
        status: "active",
        targetAudience,
      });

      const fullUrl = `${window.location.origin}/feedback/${campaignId}`;
      setCreatedLink(fullUrl);
      toast.success("Анкетата е създадена успешно!");
      onCampaignCreated();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при създаването на анкетата");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setHasCopied(true);
    toast.success(
      "Линкът е копиран! Можете да го изпратите във Viber / WhatsApp."
    );
    setTimeout(() => setHasCopied(false), 3000);
  };

  const handleClose = () => {
    setCreatedLink(null);
    setTitle("");
    setDescription("");
    setSelectedEventId("none");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-zinc-900">
            <Sparkles className="size-5 text-indigo-600" />
            Създаване на Анкета за събитие
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Генерирайте уникален публичен линк за анкета, който да изпратите на
            родителите или състезателите.
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          /* Success Screen with Copy Link */
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Check className="size-7 stroke-3" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-900">
                Анкетата е готова за споделяне!
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
                Копирайте линка по-долу и го изпратете в групата на родителите
                във Viber, WhatsApp или по имейл.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-2">
              <Input
                readOnly
                value={createdLink}
                className="border-none bg-transparent text-xs font-semibold text-indigo-900 shadow-none focus-visible:ring-0"
              />
              <Button
                onClick={copyToClipboard}
                className="shrink-0 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {hasCopied ? (
                  <>
                    <Check className="mr-1.5 size-4" />
                    Копирано!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" />
                    Копирай линк
                  </>
                )}
              </Button>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                Готово
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Creation Form */
          <div className="space-y-4 py-2">
            {/* Choose Event from calendar */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">
                Свържи със събитие от клубния график (по избор)
              </Label>
              <Select value={selectedEventId} onValueChange={handleEventSelect}>
                <SelectTrigger className="rounded-xl border-zinc-200 text-xs">
                  <SelectValue placeholder="Изберете събитие от календара..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">
                    -- Без конкретно събитие (Обща анкета) --
                  </SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title} (
                      {new Date(ev.startDate).toLocaleDateString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type & Template */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">
                  Тип на събитието
                </Label>
                <Select
                  value={selectedEventType}
                  onValueChange={(val) =>
                    handleEventTypeChange(val as FeedbackEventType)
                  }
                >
                  <SelectTrigger className="rounded-xl border-zinc-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camp">🏕️ Лагер</SelectItem>
                    <SelectItem value="competition">🏸 Състезание</SelectItem>
                    <SelectItem value="training">⚡ Тренировки</SelectItem>
                    <SelectItem value="general">🌟 Обща анкета</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">
                  Шаблон с въпроси
                </Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger className="rounded-xl border-zinc-200 text-xs">
                    <SelectValue placeholder="Изберете шаблон..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campaign Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">
                Заглавие на анкетата (видимо за родителите) *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="напр. Обратна връзка: Летен лагер Приморско 2026"
                className="rounded-xl border-zinc-200 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">
                Кратко описание / обръщение към родителите
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="напр. Скъпи родители, благодарим ви за доверието! Моля, отделете 2 минути да споделите вашите впечатления..."
                rows={3}
                className="rounded-xl border-zinc-200 text-xs"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">
                Целева аудитория
              </Label>
              <Select
                value={targetAudience}
                onValueChange={(v) =>
                  setTargetAudience(v as "parents" | "athletes" | "all")
                }
              >
                <SelectTrigger className="rounded-xl border-zinc-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parents">👨‍👩‍👧 Родители</SelectItem>
                  <SelectItem value="athletes">
                    🏸 Състезатели / Деца
                  </SelectItem>
                  <SelectItem value="all">🌐 Всички</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !title.trim() || !selectedTemplateId}
                className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <LinkIcon className="mr-1.5 size-3.5" />
                )}
                Генерирай линк за анкета
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
