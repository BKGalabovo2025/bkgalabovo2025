"use client";

import {
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  PenLine,
  Phone,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MarketingTemplate,
  MarketingTemplateCategory,
} from "@/types/marketing.types";

import { TemplateEditorDialog } from "./TemplateEditorDialog";

type TemplateCreatePayload = Omit<
  MarketingTemplate,
  "id" | "siteId" | "createdAt"
>;
type TemplateUpdatePayload = Partial<TemplateCreatePayload>;

interface Props {
  templates: MarketingTemplate[];
  onSelectTemplate: (template: MarketingTemplate) => void;
  onCreateTemplate: (data: TemplateCreatePayload) => Promise<void>;
  onUpdateTemplate: (id: string, data: TemplateUpdatePayload) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

export function MarketingTemplatesTab({
  templates,
  onSelectTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<MarketingTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "all") return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tmpl: MarketingTemplate) => {
    setEditingTemplate(tmpl);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      window.confirm(
        `Сигурни ли сте, че искате да изтриете шаблона "${title}"?`
      )
    ) {
      try {
        await onDeleteTemplate(id);
        toast.success("Шаблонът беше изтрит успешно!");
      } catch {
        toast.error("Възникна грешка при изтриването.");
      }
    }
  };

  const handleSave = async (
    data: Omit<MarketingTemplate, "id" | "siteId" | "createdAt">
  ) => {
    if (editingTemplate) {
      await onUpdateTemplate(editingTemplate.id, data);
      toast.success("Шаблонът беше обновен успешно!");
    } else {
      await onCreateTemplate(data);
      toast.success("Новият шаблон беше създаден успешно!");
    }
  };

  const getCategoryLabel = (cat: MarketingTemplateCategory) => {
    switch (cat) {
      case "camp":
        return "🏕️ Лагери";
      case "tournament":
        return "🏸 Турнири";
      case "recovery":
        return "🧖‍♂️ Възстановяване";
      case "procedures":
        return "💆‍♀️ Процедури";
      case "payment":
        return "💳 Такси & Пакети";
      case "schedule":
        return "⏰ График & Часове";
      case "feedback":
        return "💬 Анкети & Отзиви";
      default:
        return "🌟 Общи";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileText className="size-4.5" />
            </div>
            <h2 className="text-lg font-black text-zinc-950 dark:text-white">
              Библиотека с шаблони
            </h2>
            <Badge
              variant="outline"
              className="rounded-full border-indigo-200 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {templates.length} шаблона
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Готови съобщения за лагери, турнири, възстановяване, напомняния за
            такси и анкети
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-indigo-700"
        >
          <Plus className="mr-1.5 size-4" />
          Нов шаблон
        </Button>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "🌟 Всички" },
          { id: "recovery", label: "🧖‍♂️ Възстановяване" },
          { id: "procedures", label: "💆‍♀️ Процедури" },
          { id: "camp", label: "🏕️ Лагери" },
          { id: "tournament", label: "🏸 Турнири" },
          { id: "payment", label: "💳 Такси & Пакети" },
          { id: "schedule", label: "⏰ График" },
          { id: "feedback", label: "💬 Анкети & Отзиви" },
          { id: "general", label: "📌 Общи" },
        ].map((cat) => (
          <Button
            key={cat.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? "bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((tmpl) => (
          <Card
            key={tmpl.id}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="space-y-3">
              {/* Card Header: Channel Badge & Category */}
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 rounded-lg border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tmpl.channel === "whatsapp" && (
                    <MessageCircle className="size-3 text-emerald-600" />
                  )}
                  {tmpl.channel === "viber" && (
                    <Phone className="size-3 text-purple-600" />
                  )}
                  {tmpl.channel === "sms" && (
                    <MessageSquare className="size-3 text-blue-600" />
                  )}
                  {tmpl.channel === "email" && (
                    <Mail className="size-3 text-rose-600" />
                  )}
                  <span>{tmpl.channel}</span>
                </Badge>

                <span className="text-[11px] font-semibold text-zinc-400">
                  {getCategoryLabel(tmpl.category)}
                </span>
              </div>

              {/* Title & Subject */}
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  {tmpl.title}
                </h3>
                {tmpl.subject && (
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Тема: {tmpl.subject}
                  </p>
                )}
              </div>

              {/* Message Text Preview */}
              <p className="line-clamp-4 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                {tmpl.messageText}
              </p>

              {/* Variables Chips */}
              {tmpl.variables && tmpl.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tmpl.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="rounded-md px-1.5 py-0 text-[9px] font-bold text-indigo-700 dark:text-indigo-300"
                    >
                      <Tag className="mr-0.5 size-2.5" />
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Button
                type="button"
                onClick={() => onSelectTemplate(tmpl)}
                className="h-8 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                <Sparkles className="mr-1.5 size-3" />
                Зареди в редактора
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(tmpl)}
                  className="size-8 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  title="Редактирай"
                >
                  <PenLine className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tmpl.id, tmpl.title)}
                  className="size-8 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  title="Изтрий"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Editor Modal */}
      <TemplateEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
      />
    </div>
  );
}
