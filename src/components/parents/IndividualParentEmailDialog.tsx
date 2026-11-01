"use client";

import { Loader2, Mail, Send, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { sendIndividualParentEmailAction } from "@/lib/actions/parent-portal";
import { ParentUser } from "@/types/parent-portal.types";

interface Props {
  parent: ParentUser | null;
  childrenList: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParentTemplateOption {
  id: string;
  title: string;
  subject: string;
  bodyTemplate: string;
}

const INDIVIDUAL_TEMPLATES: ParentTemplateOption[] = [
  {
    id: "feeReminder",
    title: "💰 Напомняне за месечна такса / абонамент",
    subject: "Напомняне за месечен абонамент в БК Гълъбово",
    bodyTemplate:
      "Здравейте, {ИМЕ_РОДИТЕЛ}!\n\nНапомняме Ви за дължимия месечен абонамент за тренировките по бадминтон на {ИМЕ_ДЕТЕ}. Моля да заплатите таксата при следващото посещение в зала „Енергетик“ или по банков път.\n\nБлагодарим Ви за коректността и подкрепата за спортното развитие на детето!\n\nС уважение,\nБадминтон Клуб Гълъбово",
  },
  {
    id: "campTournament",
    title: "🏸 Предстоящ турнир или спортен лагер",
    subject: "Информация за предстоящо събитие – БК Гълъбово",
    bodyTemplate:
      "Здравейте, {ИМЕ_РОДИТЕЛ}!\n\nИнформираме Ви за предстоящо спортно събитие/лагер, в което планираме участието на {ИМЕ_ДЕТЕ}.\n\nМоля да потвърдите участието му и да проверите дали всички необходими декларации и медицински документи са актуализирани във Вашия профил в Родителския портал.\n\nПоздрави,\nТреньорски щаб на БК Гълъбово",
  },
  {
    id: "birthday",
    title: "🎂 Честит рожден ден на състезателя",
    subject: "Честит рожден ден от БК Гълъбово! 🎉",
    bodyTemplate:
      "Честит рожден ден на {ИМЕ_ДЕТЕ}! 🎂🎉\n\nРъководството и треньорите на Бадминтон Клуб Гълъбово му/й пожелават крепко здраве, много радост, спортен дух и шампионски успехи както на корта, така и в училище! 🏆🏸",
  },
  {
    id: "medicalDoc",
    title: "📑 Липсващо или изтичащо медицинско свидетелство",
    subject: "Важно: Медицинско свидетелство за тренировки в БК Гълъбово",
    bodyTemplate:
      "Здравейте, {ИМЕ_РОДИТЕЛ}!\n\nБихме искали да Ви напомним, че за безопасното и регламентирано участие на {ИМЕ_ДЕТЕ} в тренировките и турнирите е необходимо представянето на валидно медицинско свидетелство за спорт.\n\nМожете да качите снимка на медицинското директно от Вашия Родителски портал в таб „Документи“.\n\nС уважение,\nБК Гълъбово",
  },
  {
    id: "scheduleChange",
    title: "⏰ Промяна в тренировъчен график",
    subject: "Промяна в графика на тренировките – БК Гълъбово",
    bodyTemplate:
      "Здравейте, {ИМЕ_РОДИТЕЛ}!\n\nБихме искали да Ви уведомим за промяна в тренировъчния график на {ИМЕ_ДЕТЕ}.\n\nМоля да проверите актуалния график в Родителския портал или да се свържете с дежурния треньор при въпроси.\n\nСпортни поздрави,\nБК Гълъбово",
  },
  {
    id: "custom",
    title: "✏️ Свободен текст / Индивидуална бележка",
    subject: "Съобщение от треньора – БК Гълъбово",
    bodyTemplate:
      "Здравейте, {ИМЕ_РОДИТЕЛ}!\n\nПишем Ви относно тренировките и напредъка на {ИМЕ_ДЕТЕ}...\n\nПоздрави,\nБК Гълъбово",
  },
];

export function IndividualParentEmailDialog({
  parent,
  childrenList,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>("feeReminder");
  const [subject, setSubject] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Set default child if only 1 child exists
  useEffect(() => {
    if (childrenList.length > 0) {
      setSelectedChildId(childrenList[0].id);
    } else {
      setSelectedChildId("");
    }
  }, [childrenList]);

  // Apply template with replaced dynamic variables
  const applyTemplate = (templateId: string, childId: string) => {
    const tmpl = INDIVIDUAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl || !parent) return;

    const childObj = childrenList.find((c) => c.id === childId);
    const childName = childObj ? childObj.name : "Вашето дете";

    setSubject(tmpl.subject);
    const populated = tmpl.bodyTemplate
      .replace(/{ИМЕ_РОДИТЕЛ}/g, parent.name)
      .replace(/{ИМЕ_ДЕТЕ}/g, childName);
    setMessageText(populated);
  };

  useEffect(() => {
    if (isOpen && parent) {
      applyTemplate(selectedTemplateId, selectedChildId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parent]);

  const handleTemplateChange = (newTmplId: string) => {
    setSelectedTemplateId(newTmplId);
    applyTemplate(newTmplId, selectedChildId);
  };

  const handleChildChange = (newChildId: string) => {
    setSelectedChildId(newChildId);
    applyTemplate(selectedTemplateId, newChildId);
  };

  if (!parent) return null;

  const currentChild = childrenList.find((c) => c.id === selectedChildId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent.email) {
      toast.error("Родителят няма въведен валиден имейл адрес.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Моля, въведете тема на съобщението.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Моля, въведете текст на съобщението.");
      return;
    }

    setIsSending(true);
    try {
      const templateTitle =
        INDIVIDUAL_TEMPLATES.find((t) => t.id === selectedTemplateId)?.title ||
        "Индивидуално съобщение";

      const res = await sendIndividualParentEmailAction({
        parentId: parent.id,
        parentName: parent.name,
        parentEmail: parent.email,
        memberId: currentChild?.id || null,
        memberName: currentChild?.name || null,
        subject: subject.trim(),
        messageText: messageText.trim(),
        templateTitle,
      });

      if (!res.success) {
        toast.error(res.error || "Грешка при изпращане на имейла.");
      } else {
        toast.success(
          `Имейлът до ${parent.name} беше успешно изпратен и записан в историята!`
        );
        onSuccess?.();
        onClose();
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Mail className="size-5" />
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                  Лично съобщение до родител
                </DialogTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-none text-[10px] font-bold">
                🎯 1 Получател (Без спам)
              </Badge>
            </div>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              Изпращане на официален клубен имейл до{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {parent.name}
              </strong>{" "}
              ({parent.email || "липсва имейл"})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-5 text-xs max-h-[70vh] overflow-y-auto">
            {/* Child selector if parent has linked children */}
            {childrenList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Относно състезател / дете:
                </Label>
                <Select
                  value={selectedChildId}
                  onValueChange={handleChildChange}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Изберете състезател" />
                  </SelectTrigger>
                  <SelectContent>
                    {childrenList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        👤 {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Template selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Готов шаблон за съобщение:</span>
                </Label>
              </div>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDIVIDUAL_TEMPLATES.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      {tmpl.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Тема на имейла:
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="напр. Напомняне за месечен абонамент"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Съдържание на съобщението:
                </Label>
                <span className="text-[10px] text-zinc-400">
                  Можете свободно да редактирате текста
                </span>
              </div>
              <Textarea
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Въведете Вашето съобщение тук..."
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSending}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !parent.email}
              className="rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-500 text-xs"
            >
              {isSending ? (
                <>
                  <Loader2 size={13} className="mr-1 animate-spin" />
                  Изпращане...
                </>
              ) : (
                <>
                  <Send size={12} className="mr-1" />
                  <span>Изпрати лично съобщение</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
