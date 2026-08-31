"use client";

import { Check, FileText, Loader2, Sparkles, Tag } from "lucide-react";
import React, { useEffect, useState } from "react";

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
  MarketingChannel,
  MarketingTemplate,
  MarketingTemplateCategory,
} from "@/types/marketing.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MarketingTemplate | null;
  onSave: (
    data: Omit<MarketingTemplate, "id" | "siteId" | "createdAt">
  ) => Promise<void>;
}

const AVAILABLE_VARIABLES = [
  { tag: "{ИМЕ}", label: "Име на получател" },
  { tag: "{ДЕТЕ}", label: "Име на дете" },
  { tag: "{СЪБИТИЕ}", label: "Име на събитие" },
  { tag: "{ДАТА}", label: "Дата" },
  { tag: "{ЧАС}", label: "Час" },
  { tag: "{ЛОКАЦИЯ}", label: "Зала / Локация" },
  { tag: "{ЛИНК}", label: "Линк" },
  { tag: "{ЛИНК_АНКЕТА}", label: "Линк за анкета" },
];

export function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<MarketingTemplateCategory>("general");
  const [channel, setChannel] = useState<MarketingChannel>("whatsapp");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setCategory(template.category);
      setChannel(template.channel);
      setSubject(template.subject || "");
      setMessageText(template.messageText);
    } else {
      setTitle("");
      setCategory("general");
      setChannel("whatsapp");
      setSubject("");
      setMessageText("");
    }
  }, [template, open]);

  const insertVariable = (tag: string) => {
    setMessageText(
      (prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + tag
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !messageText.trim()) return;

    setIsSaving(true);
    try {
      // Find used variables
      const usedVars = AVAILABLE_VARIABLES.filter((v) =>
        messageText.includes(v.tag)
      ).map((v) => v.tag);

      await onSave({
        title: title.trim(),
        category,
        channel,
        subject: subject.trim(),
        messageText: messageText.trim(),
        variables: usedVars,
        isDefault: template?.isDefault || false,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileText className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-zinc-950 dark:text-white">
                  {template
                    ? "Редактиране на шаблон"
                    : "Нов шаблон за съобщение"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Конфигурирайте заглавие, категория и динамични променливи
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Заглавие на шаблона *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="напр. 🏕️ Покана за Летен Лагер"
                className="h-10 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            {/* Category & Channel Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Категория
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) =>
                    setCategory(v as MarketingTemplateCategory)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="general">🌟 Общи</SelectItem>
                    <SelectItem value="recovery">🧖‍♂️ Възстановяване</SelectItem>
                    <SelectItem value="procedures">
                      💆‍♀️ Процедури & Терапии
                    </SelectItem>
                    <SelectItem value="camp">🏕️ Лагери</SelectItem>
                    <SelectItem value="tournament">🏸 Турнири</SelectItem>
                    <SelectItem value="payment">💳 Такси & Пакети</SelectItem>
                    <SelectItem value="schedule">⏰ График & Часове</SelectItem>
                    <SelectItem value="feedback">💬 Анкети & Отзиви</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Препоръчителен канал
                </Label>
                <Select
                  value={channel}
                  onValueChange={(v) => setChannel(v as MarketingChannel)}
                >
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="viber">📱 Viber</SelectItem>
                    <SelectItem value="sms">✉️ SMS</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject (if Email or General) */}
            {channel === "email" && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Тема на имейла (Subject)
                </Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="напр. Важно известие от БК Гълъбово"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Dynamic Variable Chips Bar */}
            <div className="space-y-1.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-950 dark:bg-indigo-950/20">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                Вмъкни динамична променлива с един клик:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200/80 bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-2xs transition-all hover:scale-105 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
                  >
                    <Tag className="size-2.5 text-indigo-500" />
                    <span>{v.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Text */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Текст на съобщението *
              </Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Здравейте, {ИМЕ}! ..."
                rows={5}
                className="rounded-2xl p-3 text-xs leading-relaxed"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl text-xs font-bold"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !title.trim() || !messageText.trim()}
              className="rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  Запази шаблона
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
