import { Globe, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { feedbackService } from "@/services/feedback-service";
import {
  FeedbackCampaign,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

import { TemplateEditorDialog } from "./TemplateEditorDialog";

interface FeedbackTemplatesTabProps {
  templates: FeedbackSurveyTemplate[];
  campaigns?: FeedbackCampaign[];
  siteId: string;
  onRefresh: () => void;
}

function getEventTypeLabel(eventType: string) {
  switch (eventType) {
    case "camp":
      return "🏕️ Лагер";
    case "competition":
      return "🏸 Състезание";
    case "training":
      return "⚡ Тренировки";
    default:
      return "🌟 Обща";
  }
}

export function FeedbackTemplatesTab({
  templates,
  campaigns = [],
  siteId,
  onRefresh,
}: FeedbackTemplatesTabProps) {
  const [editingTemplate, setEditingTemplate] =
    useState<FeedbackSurveyTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleEdit = (tmpl: FeedbackSurveyTemplate) => {
    setEditingTemplate(tmpl);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleCreateStanding = async (tmpl: FeedbackSurveyTemplate) => {
    try {
      await feedbackService.createStandingCampaignFromTemplate(siteId, tmpl);
      toast.success(
        `Анкетата „${tmpl.name}“ беше пусната като постоянна на сайта!`
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при пускане на анкетата");
    }
  };

  const handleToggleStanding = async (campaign: FeedbackCampaign) => {
    const newStatus = campaign.status === "active" ? "closed" : "active";
    try {
      await feedbackService.updateCampaign(campaign.id, { status: newStatus });
      toast.success(
        newStatus === "active"
          ? "Анкетата е активирана на публичния сайт"
          : "Анкетата е временно спряна от сайта"
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка");
    }
  };

  const handleDelete = async (tmplId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този шаблон?"))
      return;
    try {
      await feedbackService.deleteTemplate(tmplId);
      toast.success("Шаблонът е изтрит");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка");
    }
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        "Това ще премахне дублираните шаблони и ще възстанови 4-те стандартни шаблона на клуба. Желаете ли да продължите?"
      )
    )
      return;
    try {
      await feedbackService.seedDefaultTemplates(siteId, true);
      toast.success(
        "Шаблоните бяха изчистени и възстановени до 4 стандартни шаблона!"
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-900">
            Шаблони на анкетите
          </h2>
          <p className="text-xs font-medium text-zinc-500">
            Редактирайте въпросите или създайте нови шаблони за различни клубни
            събития по всяко време.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Презареди стандартни
          </Button>

          <Button
            onClick={handleCreateNew}
            size="sm"
            className="rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="mr-1.5 size-3.5" />
            Нов шаблон
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.map((tmpl) => {
          const standingCampaign = campaigns.find(
            (c) =>
              (c.templateId === tmpl.id || c.title.includes(tmpl.name)) &&
              (c.isStanding || c.eventType === tmpl.eventType || !c.eventId)
          );

          return (
            <Card
              key={tmpl.id}
              className="overflow-hidden border-zinc-200 shadow-2xs transition-all hover:border-indigo-200 hover:shadow-xs"
            >
              <CardContent className="flex h-full flex-col justify-between space-y-4 p-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase"
                      >
                        {getEventTypeLabel(tmpl.eventType)}
                      </Badge>

                      {standingCampaign?.status === "active" && (
                        <Badge className="border-emerald-200 bg-emerald-100 text-[10px] font-bold text-emerald-800">
                          <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
                          Видима на сайта
                        </Badge>
                      )}
                    </div>

                    {tmpl.isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-[10px] text-zinc-600"
                      >
                        Стандартен
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-black tracking-tight text-zinc-900">
                    {tmpl.name}
                  </h3>

                  {tmpl.description && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                      {tmpl.description}
                    </p>
                  )}

                  {/* Questions Preview */}
                  <div className="mt-4 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                    <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      Въпроси в анкетата ({tmpl.questions?.length || 0}):
                    </div>

                    <ul className="space-y-1 text-xs text-zinc-700">
                      {tmpl.questions?.slice(0, 4).map((q, qIdx) => (
                        <li
                          key={q.id || qIdx}
                          className="flex items-center gap-1.5 truncate"
                        >
                          <span className="text-[10px] font-bold text-indigo-600">
                            •
                          </span>
                          <span className="truncate">{q.label}</span>
                          {q.type === "rating" && (
                            <span className="shrink-0 text-[10px] font-semibold text-amber-600">
                              (⭐ 1-5)
                            </span>
                          )}
                        </li>
                      ))}
                      {tmpl.questions?.length > 4 && (
                        <li className="text-[11px] font-medium text-zinc-400">
                          + още {tmpl.questions.length - 4} въпроса...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(tmpl)}
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      <Pencil className="mr-1.5 size-3.5 text-indigo-600" />
                      Редактирай
                    </Button>

                    {standingCampaign ? (
                      <Button
                        onClick={() => handleToggleStanding(standingCampaign)}
                        size="sm"
                        className={`rounded-xl text-[11px] font-bold transition-all ${
                          standingCampaign.status === "active"
                            ? "bg-emerald-600 text-white shadow-2xs hover:bg-amber-600"
                            : "border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        <Power className="mr-1.5 size-3" />
                        {standingCampaign.status === "active"
                          ? "🟢 Активна на сайта"
                          : "▶️ Пусни на сайта"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCreateStanding(tmpl)}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-indigo-200 bg-indigo-50/50 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white"
                      >
                        <Globe className="mr-1.5 size-3" />
                        Пусни на сайта
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tmpl.id)}
                    className="size-8 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Изтрий шаблон"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor Modal */}
      <TemplateEditorDialog
        template={editingTemplate}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        siteId={siteId}
        onSaved={onRefresh}
      />
    </div>
  );
}
