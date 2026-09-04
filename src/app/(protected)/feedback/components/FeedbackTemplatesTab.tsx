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

function renderSiteStatusBadge(
  standingCampaign: FeedbackCampaign | undefined,
  isLiveOnSite: boolean
) {
  if (!standingCampaign) {
    return (
      <Badge
        variant="outline"
        className="border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-400"
      >
        ⚪ Не е пусната на сайта
      </Badge>
    );
  }

  if (isLiveOnSite) {
    return (
      <Badge className="border-emerald-300 bg-emerald-100 text-[11px] font-black text-emerald-800 shadow-2xs">
        <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
        🟢 Активна на сайта
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="border border-zinc-200 bg-zinc-100 text-[10px] font-bold text-zinc-500"
    >
      ⏸️ Спряна от сайта
    </Badge>
  );
}

function getEventTypeLabel(eventType: string) {
  switch (eventType) {
    case "recovery":
      return "⚡ Normatec 3 / Възстановяване";
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
    const confirmMsg =
      siteId === "recoveryzone"
        ? "Това ще възстанови стандартните шаблони за Recovery Zone by ZM. Желаете ли да продължите?"
        : "Това ще премахне дублираните шаблони и ще възстанови 4-те стандартни шаблона на клуба. Желаете ли да продължите?";
    if (!window.confirm(confirmMsg)) return;
    try {
      await feedbackService.seedDefaultTemplates(siteId, true);
      toast.success(
        siteId === "recoveryzone"
          ? "Шаблоните за Recovery Zone бяха възстановени успешно!"
          : "Шаблоните бяха изчистени и възстановени до 4 стандартни шаблона!"
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
            {siteId === "recoveryzone"
              ? "Редактирайте въпросите или създайте нови шаблони за процедури и услуги по всяко време."
              : "Редактирайте въпросите или създайте нови шаблони за различни клубни събития по всяко време."}
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

      {/* Information Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 p-4 shadow-2xs">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
          <Globe className="size-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-indigo-950">
            {siteId === "recoveryzone"
              ? "Публикуване на анкети в сайта на Recovery Zone"
              : "Публикуване на анкети на клубния сайт"}
          </h4>
          <p className="mt-0.5 text-zinc-600">
            Можете да пуснете <strong>всеки един от шаблоните</strong> по-долу
            да е постоянно достъпен на сайта (в секция{" "}
            <a
              href={
                siteId === "recoveryzone"
                  ? "/recovery-zone/reviews"
                  : "/club/reviews"
              }
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-600 underline hover:text-indigo-800"
            >
              ⭐ Отзиви
            </a>
            ). Посетителите и клиентите ще могат да го попълват по всяко време.
          </p>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {templates.map((tmpl) => {
          const standingCampaign = campaigns.find((c) => {
            if (c.templateId === tmpl.id) return true;
            if (
              c.isStanding &&
              (c.eventType === tmpl.eventType ||
                (c.templateName &&
                  tmpl.name &&
                  c.templateName
                    .toLowerCase()
                    .includes(tmpl.name.toLowerCase())) ||
                (c.title &&
                  tmpl.name &&
                  c.title.toLowerCase().includes(tmpl.name.toLowerCase())))
            ) {
              return true;
            }
            return false;
          });

          const isLiveOnSite = standingCampaign?.status === "active";

          return (
            <Card
              key={tmpl.id}
              className={`overflow-hidden transition-all ${
                isLiveOnSite
                  ? "border-emerald-300 bg-gradient-to-b from-emerald-50/20 via-white to-white shadow-xs ring-1 ring-emerald-400/30"
                  : "border-zinc-200 shadow-2xs hover:border-indigo-200 hover:shadow-xs"
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between space-y-4 p-5">
                <div>
                  {/* Status Badges Header */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase"
                      >
                        {getEventTypeLabel(tmpl.eventType)}
                      </Badge>

                      {tmpl.isDefault && (
                        <Badge
                          variant="secondary"
                          className="bg-zinc-100 text-[10px] text-zinc-600"
                        >
                          Стандартен
                        </Badge>
                      )}
                    </div>

                    {/* Prominent Site Status Badge */}
                    {renderSiteStatusBadge(standingCampaign, isLiveOnSite)}
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

                {/* Card Action Footer */}
                <div className="space-y-2 border-t border-zinc-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Primary Standing Control Button */}
                    {standingCampaign ? (
                      <Button
                        onClick={() => handleToggleStanding(standingCampaign)}
                        size="sm"
                        className={`rounded-xl text-xs font-bold transition-all ${
                          isLiveOnSite
                            ? "bg-emerald-600 text-white shadow-xs hover:bg-amber-600"
                            : "border border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        <Power className="mr-1.5 size-3.5" />
                        {isLiveOnSite
                          ? "🟢 Пусната на сайта (Спри)"
                          : "▶️ Пусни отново на сайта"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCreateStanding(tmpl)}
                        size="sm"
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs hover:from-blue-500 hover:to-indigo-500"
                      >
                        <Globe className="mr-1.5 size-3.5" />
                        🌐 Пусни на сайта
                      </Button>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleEdit(tmpl)}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                      >
                        <Pencil className="mr-1.5 size-3.5 text-indigo-600" />
                        Редактирай
                      </Button>

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
                  </div>
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
