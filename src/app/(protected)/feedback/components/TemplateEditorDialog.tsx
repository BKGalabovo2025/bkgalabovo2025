"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackService } from "@/services/feedback-service";
import {
  FeedbackEventType,
  FeedbackSurveyTemplate,
  SurveyQuestion,
  SurveyQuestionType,
} from "@/types/feedback.types";

interface TemplateEditorDialogProps {
  template: FeedbackSurveyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  onSaved: () => void;
}

export function TemplateEditorDialog({
  template,
  open,
  onOpenChange,
  siteId,
  onSaved,
}: TemplateEditorDialogProps) {
  const isEditing = Boolean(template?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<FeedbackEventType>("camp");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state properly whenever template or open prop changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setDescription(template.description || "");
        setEventType(template.eventType || "camp");
        setQuestions(
          template.questions && template.questions.length > 0
            ? JSON.parse(JSON.stringify(template.questions))
            : [
                {
                  id: `q_${uuidv4().slice(0, 8)}`,
                  type: "rating",
                  label: "Обща оценка",
                  required: true,
                  category: "general",
                },
              ]
        );
      } else {
        setName("");
        setDescription("");
        setEventType("camp");
        setQuestions([
          {
            id: `q_${uuidv4().slice(0, 8)}`,
            type: "rating",
            label: "Обща оценка на събитието",
            required: true,
            category: "general",
          },
        ]);
      }
    }
  }, [open, template]);

  const handleAddQuestion = () => {
    const newQ: SurveyQuestion = {
      id: `q_${uuidv4().slice(0, 8)}`,
      type: "rating",
      label: "Нов въпрос за оценка",
      required: true,
      category: "general",
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (
    idx: number,
    field: keyof SurveyQuestion,
    value: string | boolean | string[]
  ) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Моля, въведете име на шаблона");
      return;
    }
    if (questions.length === 0) {
      toast.error("Шаблонът трябва да съдържа поне един въпрос");
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.saveTemplate(
        siteId,
        {
          name: name.trim(),
          description: description.trim(),
          eventType,
          questions,
          isDefault: template?.isDefault || false,
        },
        template?.id
      );

      toast.success(
        isEditing
          ? "Шаблонът е обновен успешно!"
          : "Новият шаблон е запазен успешно!"
      );
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при запазването");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-zinc-100 bg-gradient-to-br from-indigo-50/70 via-white to-zinc-50/70 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-zinc-900">
            <Sparkles className="size-5 text-indigo-600" />
            {isEditing
              ? "Редактиране на Шаблон за анкета"
              : "Нов Шаблон за анкета"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Конфигурирайте въпросите, които родителите или състезателите ще
            попълват.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-180px)] p-6">
          <div className="space-y-6">
            {/* Meta info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-zinc-700">
                  Име на шаблона *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр. Летен Лагер - Пълна анкета"
                  className="rounded-xl border-zinc-200 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-zinc-700">
                  Описание на шаблона
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="напр. Оценка на лагера: тренировки, организация, храна..."
                  className="rounded-xl border-zinc-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">
                  Тип събитие по подразбиране
                </Label>
                <Select
                  value={eventType}
                  onValueChange={(val) =>
                    setEventType(val as FeedbackEventType)
                  }
                >
                  <SelectTrigger className="rounded-xl border-zinc-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camp">🏕️ Лагер</SelectItem>
                    <SelectItem value="competition">🏸 Състезание</SelectItem>
                    <SelectItem value="training">⚡ Тренировки</SelectItem>
                    <SelectItem value="general">🌟 Общ отзив</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions List Builder */}
            <div className="space-y-3 border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold tracking-wider text-zinc-800 uppercase">
                  Въпроси в анкетата ({questions.length})
                </h4>
                <Button
                  onClick={handleAddQuestion}
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="mr-1 size-3.5" />
                  Добави въпрос
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-600">
                        {idx + 1}
                      </span>

                      <div className="flex-1 space-y-2">
                        <Input
                          value={q.label}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, "label", e.target.value)
                          }
                          placeholder="Текст на въпроса..."
                          className="rounded-xl border-zinc-200 bg-white text-xs font-medium"
                        />

                        <Input
                          value={q.description || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Допълнително пояснение (по избор)..."
                          className="rounded-xl border-zinc-200 bg-white text-[11px] text-zinc-500"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="size-8 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/60 pt-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] text-zinc-500">
                          Тип:
                        </Label>
                        <Select
                          value={q.type}
                          onValueChange={(val) =>
                            handleUpdateQuestion(
                              idx,
                              "type",
                              val as SurveyQuestionType
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-40 rounded-lg border-zinc-200 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rating">
                              ⭐ Рейтинг (1-5 звезди)
                            </SelectItem>
                            <SelectItem value="text">
                              📝 Свободен текст
                            </SelectItem>
                            <SelectItem value="boolean">
                              ✓ / ✕ Да или Не
                            </SelectItem>
                            <SelectItem value="select">
                              📋 Избор от списък
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`req_${idx}`}
                          checked={q.required}
                          onCheckedChange={(c) =>
                            handleUpdateQuestion(idx, "required", Boolean(c))
                          }
                        />
                        <Label
                          htmlFor={`req_${idx}`}
                          className="cursor-pointer text-xs font-semibold text-zinc-600"
                        >
                          Задължителен
                        </Label>
                      </div>
                    </div>

                    {/* Options for Select type */}
                    {q.type === "select" && (
                      <div className="space-y-1 pt-2">
                        <Label className="text-[11px] text-zinc-500">
                          Опции за избор (разделени със запетая):
                        </Label>
                        <Input
                          value={(q.options || []).join(", ")}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              idx,
                              "options",
                              e.target.value.split(",").map((s) => s.trim())
                            )
                          }
                          placeholder="напр. Категорично да, По-скоро да, Не"
                          className="rounded-xl border-zinc-200 bg-white text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-zinc-100 bg-zinc-50 p-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Отказ
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Запази шаблона
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
