"use client";

import {
  CheckSquare,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
  Send,
  Sparkles,
  Square,
  Tag,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  MarketingRecipient,
  MarketingTemplate,
} from "@/types/marketing.types";

import { LiveDevicePreview } from "./LiveDevicePreview";
import { MassSendConfirmationDialog } from "./MassSendConfirmationDialog";

interface Props {
  recipients: MarketingRecipient[];
  templates: MarketingTemplate[];
  selectedTemplate?: MarketingTemplate | null;
  onSendBatch: (
    channel: MarketingChannel,
    selectedRecipients: MarketingRecipient[],
    messageText: string,
    emailSubject: string
  ) => Promise<void>;
  isSending: boolean;
}

const AVAILABLE_VARIABLES = [
  { tag: "{ИМЕ}", label: "Име" },
  { tag: "{ДЕТЕ}", label: "Дете" },
  { tag: "{СЪБИТИЕ}", label: "Събитие" },
  { tag: "{ДАТА}", label: "Дата" },
  { tag: "{ЧАС}", label: "Час" },
  { tag: "{ЛОКАЦИЯ}", label: "Локация" },
  { tag: "{ЛИНК_АНКЕТА}", label: "Анкета" },
];

export function MarketingComposerTab({
  recipients,
  templates,
  selectedTemplate,
  onSendBatch,
  isSending,
}: Props) {
  // 1. Channel
  const [channel, setChannel] = useState<MarketingChannel>("whatsapp");

  // 2. Content
  const [emailSubject, setEmailSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeTemplateTitle, setActiveTemplateTitle] = useState<string>("");

  // 3. Recipients selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState<string>("all");

  // 4. Confirmation Dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Sync with selectedTemplate prop if changed
  React.useEffect(() => {
    if (selectedTemplate) {
      setChannel(selectedTemplate.channel);
      setMessageText(selectedTemplate.messageText);
      setEmailSubject(selectedTemplate.subject || "");
      setActiveTemplateTitle(selectedTemplate.title);
      toast.info(
        `Шаблонът "${selectedTemplate.title}" беше зареден в редактора.`
      );
    }
  }, [selectedTemplate]);

  // Dynamic filter for recipients list
  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      // Segment filter
      if (activeSegment === "athletes" && r.role !== "athlete") return false;
      if (activeSegment === "parents" && r.role !== "parent") return false;
      if (activeSegment === "active" && r.status !== "active") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesChild = r.childName?.toLowerCase().includes(q);
        const matchesPhone = r.phone?.includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        return matchesName || matchesChild || matchesPhone || matchesEmail;
      }
      return true;
    });
  }, [recipients, activeSegment, searchQuery]);

  // Selected array
  const selectedRecipients = useMemo(() => {
    return recipients.filter((r) => selectedIds.has(r.id));
  }, [recipients, selectedIds]);

  // First selected recipient for Live Preview sample
  const sampleRecipient = selectedRecipients[0] || recipients[0] || null;

  // Toggle selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredRecipients.forEach((r) => next.add(r.id));
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setChannel(tmpl.channel);
      setMessageText(tmpl.messageText);
      setEmailSubject(tmpl.subject || "");
      setActiveTemplateTitle(tmpl.title);
    }
  };

  const insertVariable = (tag: string) => {
    setMessageText(
      (prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + tag
    );
  };

  const handleOpenSendConfirmation = () => {
    if (selectedIds.size === 0) {
      toast.warning("Моля, изберете поне един получател от списъка!");
      return;
    }
    if (!messageText.trim()) {
      toast.warning("Моля, въведете текст на съобщението!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      await onSendBatch(channel, selectedRecipients, messageText, emailSubject);
      setIsConfirmOpen(false);
    } catch {
      // Handled in parent
    }
  };

  // Launch single direct link (for individual WhatsApp chat / Email)
  const openSingleChat = (r: MarketingRecipient) => {
    const recipientName = r.name || r.parentName || "Приятел";
    const childName = r.childName || r.name;
    const personalizedText = messageText
      .replace(/{ИМЕ}/g, recipientName)
      .replace(/{ДЕТЕ}/g, childName)
      .replace(/{СЪБИТИЕ}/g, "Клубно събитие")
      .replace(/{ДАТА}/g, "15-20 юли")
      .replace(/{ЧАС}/g, "18:00 ч.")
      .replace(/{ЛОКАЦИЯ}/g, "Спортна зала Гълъбово")
      .replace(/{ЛИНК}/g, "https://bkgalabovo.bg")
      .replace(
        /{ЛИНК_АНКЕТА}/g,
        "https://bkgalabovo2025.vercel.app/feedback/sample"
      );

    if (channel === "whatsapp" || channel === "viber") {
      if (!r.phone) {
        toast.error(`Няма въведен телефон за ${r.name}`);
        return;
      }
      const cleanPhone = r.phone.replace(/\D/g, "");
      const finalPhone = cleanPhone.startsWith("0")
        ? "359" + cleanPhone.substring(1)
        : cleanPhone;
      window.open(
        `https://wa.me/${finalPhone}?text=${encodeURIComponent(personalizedText)}`,
        "_blank"
      );
    } else if (channel === "email") {
      if (!r.email) {
        toast.error(`Няма въведен имейл за ${r.name}`);
        return;
      }
      window.open(
        `mailto:${r.email}?subject=${encodeURIComponent(
          emailSubject || "Известие от БК Гълъбово"
        )}&body=${encodeURIComponent(personalizedText)}`,
        "_blank"
      );
    } else {
      toast.info("SMS съобщенията се регистрират в историята.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Composer, Channels, & Recipient Picker (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        {/* 1. Channel Selector Card */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
                1. Изберете канал за комуникация:
              </Label>
              {activeTemplateTitle && (
                <Badge
                  variant="secondary"
                  className="rounded-md text-[10px] font-bold text-indigo-700 dark:text-indigo-300"
                >
                  Шаблон: {activeTemplateTitle}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  id: "whatsapp",
                  label: "WhatsApp",
                  icon: MessageCircle,
                  color: "text-emerald-600 bg-emerald-50 border-emerald-300",
                },
                {
                  id: "viber",
                  label: "Viber",
                  icon: Phone,
                  color: "text-purple-600 bg-purple-50 border-purple-300",
                },
                {
                  id: "sms",
                  label: "SMS",
                  icon: MessageSquare,
                  color: "text-blue-600 bg-blue-50 border-blue-300",
                },
                {
                  id: "email",
                  label: "Email",
                  icon: Mail,
                  color: "text-rose-600 bg-rose-50 border-rose-300",
                },
              ].map((c) => {
                const Icon = c.icon;
                const isSelected = channel === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id as MarketingChannel)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                      isSelected
                        ? `${c.color} scale-102 shadow-xs ring-2 ring-indigo-500/20`
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* 2. Message Editor Card */}
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
              2. Текст на съобщението:
            </Label>

            {/* Quick Template Picker */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-400">
                Шаблон:
              </span>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger className="h-8 w-48 rounded-xl text-xs">
                  <SelectValue placeholder="Зареди от шаблони..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email Subject if Email */}
          {channel === "email" && (
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Тема на имейла (Subject) *
              </Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="напр. Покана за клубен турнир - БК Гълъбово"
                className="h-10 rounded-xl text-xs font-semibold"
              />
            </div>
          )}

          {/* Dynamic Variable Chips */}
          <div className="space-y-1.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-950 dark:bg-indigo-950/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              Вмъкни динамична стойност в текста:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-2xs transition-transform hover:scale-105 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
                >
                  <Tag className="size-2.5 text-indigo-500" />
                  <span>{v.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Здравейте, {ИМЕ}! ..."
              rows={6}
              className="rounded-2xl p-3.5 text-xs leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Символи: {messageText.length}</span>
              {channel === "sms" && (
                <span>
                  ~{Math.ceil(messageText.length / 160) || 1} SMS сегмента
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* 3. Recipient Selection Card */}
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
                3. Изберете получатели:
              </Label>
              <Badge className="border-indigo-200 bg-indigo-50 text-[10px] font-black text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                {selectedIds.size} от {recipients.length} избрани
              </Badge>
            </div>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllFiltered}
                className="h-7 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
              >
                <CheckSquare className="mr-1 size-3.5" />
                Избери всички филтрирани
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="h-7 text-[11px] font-bold text-zinc-400 hover:text-zinc-700"
              >
                <Square className="mr-1 size-3.5" />
                Изчисти
              </Button>
            </div>
          </div>

          {/* Quick Segment Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "🌟 Всички" },
              { id: "active", label: "🟢 Активни" },
              { id: "parents", label: "👨‍👩‍👧 Родители" },
              { id: "athletes", label: "🏸 Състезатели" },
            ].map((seg) => (
              <Button
                key={seg.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveSegment(seg.id)}
                className={`h-7 rounded-xl px-2.5 text-[11px] font-bold transition-all ${
                  activeSegment === seg.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                }`}
              >
                {seg.label}
              </Button>
            ))}
          </div>

          {/* Search bar in recipients */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търсене в списъка с членове..."
              className="h-9 rounded-xl pl-8 text-xs"
            />
          </div>

          {/* Scrollable Recipients List */}
          <ScrollArea className="h-60 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="space-y-1.5">
              {filteredRecipients.map((r) => {
                const isSelected = selectedIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/40"
                        : "border-zinc-200/60 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="size-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                          <span>{r.name}</span>
                          {r.childName && (
                            <span className="text-[11px] font-normal text-zinc-500">
                              (Родител на {r.childName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                          {r.phone && <span>📞 {r.phone}</span>}
                          {r.email && <span>📧 {r.email}</span>}
                        </div>
                      </div>
                    </label>

                    {/* Single Direct Link Launcher */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openSingleChat(r)}
                      className="h-7 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100/50"
                      title="Отвори директен чат"
                    >
                      Директен чат ↗
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Main Action Bar */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleOpenSendConfirmation}
              disabled={
                selectedIds.size === 0 || !messageText.trim() || isSending
              }
              className="h-12 w-full rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:scale-101 hover:bg-indigo-700 active:scale-98 dark:shadow-none"
            >
              <Send className="mr-2 size-4.5" />
              Изпрати кампанията ({selectedIds.size} получатели)
            </Button>
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN: Live Device Preview (5 cols) */}
      <div className="lg:col-span-5">
        <div className="sticky top-24">
          <Card className="overflow-hidden rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <LiveDevicePreview
              channel={channel}
              messageText={messageText}
              emailSubject={emailSubject}
              sampleRecipient={sampleRecipient}
            />
          </Card>
        </div>
      </div>

      {/* Mass Send Confirmation Modal */}
      <MassSendConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        channel={channel}
        recipients={selectedRecipients}
        messageText={messageText}
        emailSubject={emailSubject}
        onConfirm={handleConfirmSend}
        isSending={isSending}
      />
    </div>
  );
}
