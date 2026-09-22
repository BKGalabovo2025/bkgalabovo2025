"use client";

import {
  CheckSquare,
  Mail,
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
  isTemplateForSender,
  MarketingRecipient,
  MarketingTemplate,
} from "@/types/marketing.types";

interface Props {
  recipients: MarketingRecipient[];
  templates: MarketingTemplate[];
  selectedTemplate?: MarketingTemplate | null;
  onSendBatch: (
    channel: "email",
    selectedRecipients: MarketingRecipient[],
    messageText: string,
    emailSubject: string
  ) => Promise<void>;
  isSending: boolean;
  idToken?: string | null;
  siteId?: string;
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
  idToken,
  siteId = "bkgalabovo",
}: Props) {
  // Sender Profile: choose between BK Galabovo or Recovery Zone
  const [senderProfile, setSenderProfile] = useState<
    "bkgalabovo" | "recoveryzone"
  >(siteId === "recoveryzone" ? "recoveryzone" : "bkgalabovo");

  // Filter templates strictly by the chosen sender profile
  const availableTemplates = useMemo(() => {
    return templates.filter((t) => isTemplateForSender(t, senderProfile));
  }, [templates, senderProfile]);

  // Content
  const [emailSubject, setEmailSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeTemplateTitle, setActiveTemplateTitle] = useState<string>("");

  const handleSenderProfileChange = (
    newSender: "bkgalabovo" | "recoveryzone"
  ) => {
    setSenderProfile(newSender);
    setActiveTemplateTitle("");
    if (newSender === "recoveryzone") {
      setEmailSubject("Известие от Recovery Zone by ZM");
      setMessageText(
        "Здравейте, {ИМЕ}!\n\nПишем Ви от центъра за възстановяване Recovery Zone by ZM във връзка с..."
      );
    } else {
      setEmailSubject("Известие от БК Гълъбово");
      setMessageText(
        "Здравейте, {ИМЕ}!\n\nПишем Ви от Бадминтон Клуб Гълъбово във връзка с..."
      );
    }
  };

  // Recipients selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState<string>("all");

  // Sync with selectedTemplate prop if changed
  React.useEffect(() => {
    if (selectedTemplate) {
      if (
        selectedTemplate.siteId === "recoveryzone" ||
        selectedTemplate.category === "recovery" ||
        selectedTemplate.category === "procedures"
      ) {
        setSenderProfile("recoveryzone");
      } else {
        setSenderProfile("bkgalabovo");
      }
      setMessageText(selectedTemplate.messageText);
      setEmailSubject(selectedTemplate.subject || selectedTemplate.title || "");
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
      if (activeSegment === "recovery" && r.siteId !== "recoveryzone")
        return false;
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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredRecipients.forEach((r) => next.add(r.id));
    setSelectedIds(next);
    toast.success(`Избрани са ${filteredRecipients.length} контакта.`);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const insertVariable = (tag: string) => {
    setMessageText((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(" ");
      return prev + (needsSpace ? " " : "") + tag;
    });
  };

  const handleTemplateChange = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setMessageText(tmpl.messageText);
      setEmailSubject(tmpl.subject || tmpl.title);
      setActiveTemplateTitle(tmpl.title);
      toast.info(`Шаблонът "${tmpl.title}" беше зареден.`);
    }
  };

  const selectedRecipients = useMemo(() => {
    return recipients.filter((r) => selectedIds.has(r.id));
  }, [recipients, selectedIds]);

  const validRecipientsWithEmail = useMemo(() => {
    return selectedRecipients.filter((r) => Boolean(r.email));
  }, [selectedRecipients]);

  const handleSendViaServer = async () => {
    if (validRecipientsWithEmail.length === 0) {
      toast.error("Моля, изберете поне един контакт с въведен имейл адрес.");
      return;
    }
    if (!emailSubject.trim()) {
      toast.error("Моля, въведете тема на имейла.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Моля, въведете текст на имейла.");
      return;
    }

    try {
      if (idToken) {
        // Direct server API send with SMTP
        const res = await fetch("/api/marketing/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            recipients: validRecipientsWithEmail.map((r) => ({
              id: r.id,
              name: r.name,
              email: r.email,
              childName: r.childName,
              phone: r.phone,
            })),
            subject: emailSubject.trim(),
            messageText: messageText.trim(),
            templateTitle: activeTemplateTitle || "Кампания",
            siteId,
            senderProfile,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          const senderLabel =
            senderProfile === "recoveryzone"
              ? "Recovery Zone by ZM"
              : "БК Гълъбово";
          toast.success(
            data.message ||
              `Успешно изпратени ${validRecipientsWithEmail.length} имейла от пощата на ${senderLabel}!`
          );
          setSelectedIds(new Set());
        } else {
          toast.error(data.error || "Грешка при изпращането на имейли.");
        }
      } else {
        // Fallback to onSendBatch
        await onSendBatch(
          "email",
          validRecipientsWithEmail,
          messageText.trim(),
          emailSubject.trim()
        );
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при изпращане на кампанията.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Audience & Recipients (5 cols) */}
      <div className="space-y-4 lg:col-span-5">
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-zinc-900 uppercase dark:text-white">
                1. Избор на получатели
              </h2>
              <p className="text-[11px] text-zinc-500">
                Изберете членове, състезатели или клиенти за имейла
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
            >
              {selectedIds.size} маркирани
            </Badge>
          </div>

          {/* Quick Segment Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "🌟 Всички" },
              { id: "parents", label: "👨‍👩‍👧 Родители" },
              { id: "athletes", label: "🏸 Състезатели" },
              { id: "recovery", label: "🌿 Recovery" },
              { id: "active", label: "🟢 Активни" },
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
              placeholder="Търсене по име, телефон или имейл..."
              className="h-9 rounded-xl pl-8 text-xs"
            />
          </div>

          {/* Selection Actions */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 text-xs dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllFiltered}
              className="h-7 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              <CheckSquare className="mr-1 size-3.5" />
              Избери филтрирани ({filteredRecipients.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              className="h-7 text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <Square className="mr-1 size-3.5" />
              Изчисти
            </Button>
          </div>

          {/* Scrollable Recipients List */}
          <ScrollArea className="h-96 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="space-y-1.5">
              {filteredRecipients.map((r) => {
                const isSelected = selectedIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? "border-blue-300 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40"
                        : "border-zinc-200/60 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="size-4 rounded text-blue-600 focus:ring-blue-500"
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
                          {r.email ? (
                            <span className="text-zinc-600 dark:text-zinc-300">
                              📧 {r.email}
                            </span>
                          ) : (
                            <span className="text-amber-500">
                              ⚠️ Няма имейл
                            </span>
                          )}
                          {r.phone && <span>📞 {r.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        r.siteId === "recoveryzone"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950"
                          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950"
                      }`}
                    >
                      {r.siteId === "recoveryzone" ? "Recovery" : "БК Гълъбово"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* RIGHT COLUMN: Message Editor & Dispatcher (7 cols) */}
      <div className="space-y-4 lg:col-span-7">
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-zinc-900 uppercase dark:text-white">
                2. Съдържание на кампанията
              </h2>
              <p className="text-[11px] text-zinc-500">
                Официален имейл с брандиран вид директно от клубния сървър
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <Mail className="size-4 text-blue-600" />
              <span>Официален SMTP имейл</span>
            </div>
          </div>

          {/* Sender Profile Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="composer-sender-profile"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Изпрати кампанията от името на: *
            </Label>
            <Select
              value={senderProfile}
              onValueChange={(v) =>
                handleSenderProfileChange(v as "bkgalabovo" | "recoveryzone")
              }
            >
              <SelectTrigger
                id="composer-sender-profile"
                className="h-10 rounded-xl text-xs font-semibold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="bkgalabovo">
                  🏸 Бадминтон Клуб Гълъбово (Клубна официална поща)
                </SelectItem>
                <SelectItem value="recoveryzone">
                  🌿 Recovery Zone by ZM (Официална поща за възстановяване)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Template Picker strictly filtered by Sender Profile */}
          {availableTemplates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Шаблони за{" "}
                  {senderProfile === "recoveryzone"
                    ? "Recovery Zone by ZM"
                    : "БК Гълъбово"}{" "}
                  ({availableTemplates.length}):
                </Label>
                <span className="text-[10px] text-zinc-400">
                  {senderProfile === "recoveryzone"
                    ? "🌿 Само за възстановяване"
                    : "🏸 Само за клубни дейности"}
                </span>
              </div>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-medium">
                  <SelectValue placeholder="-- Изберете готов шаблон --" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableTemplates.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} {tmpl.subject ? `(${tmpl.subject})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email-subject-input"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Относно / Тема на имейла *
            </Label>
            <Input
              id="email-subject-input"
              name="emailSubject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="напр. Важно известие: График за тренировки и турнири"
              className="h-10 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Variable Insertion Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500">
              <Sparkles className="size-3 text-indigo-500" />
              <span>Кликнете върху променлива, за да я добавите в текста:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  <Tag className="mr-1 size-2.5" />
                  {v.label} ({v.tag})
                </button>
              ))}
            </div>
          </div>

          {/* Email Body Textarea */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email-body-input"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Текст на съобщението *
            </Label>
            <Textarea
              id="email-body-input"
              name="messageText"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={8}
              placeholder="Здравейте, {ИМЕ}!\n\nПишем Ви с актуална информация относно предстоящото събитие..."
              className="rounded-2xl text-xs leading-relaxed"
            />
          </div>

          {/* Dispatch Action Button (ONLY Server SMTP) */}
          <div className="space-y-3 pt-3">
            <Button
              type="button"
              onClick={handleSendViaServer}
              disabled={
                validRecipientsWithEmail.length === 0 ||
                !emailSubject.trim() ||
                !messageText.trim() ||
                isSending
              }
              className={`h-12 w-full rounded-2xl text-xs font-bold text-white shadow-md transition-all ${
                senderProfile === "recoveryzone"
                  ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 dark:shadow-none"
                  : "bg-blue-600 shadow-blue-200 hover:bg-blue-700 dark:shadow-none"
              }`}
            >
              <Send className="mr-2 size-4" />
              {senderProfile === "recoveryzone"
                ? `Изпрати кампанията от пощата на Recovery Zone (${validRecipientsWithEmail.length} получатели)`
                : `Изпрати кампанията от клубната поща на БК Гълъбово (${validRecipientsWithEmail.length} получатели)`}
            </Button>

            <p className="text-center text-[11px] text-zinc-400">
              💡 Всички съобщения се изпращат с официален брандиран дизайн,
              заглавие и лого директно от официалния имейл адрес.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
