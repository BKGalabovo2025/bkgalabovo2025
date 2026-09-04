/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Power,
  Share2,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { feedbackService } from "@/services/feedback-service";
import { ScheduleEvent } from "@/types";
import {
  FeedbackCampaign,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

import { CreateCampaignDialog } from "./CreateCampaignDialog";

interface FeedbackCampaignsTabProps {
  campaigns: FeedbackCampaign[];
  templates: FeedbackSurveyTemplate[];
  events: ScheduleEvent[];
  siteId: string;
  onRefresh: () => void;
}

export function FeedbackCampaignsTab({
  campaigns,
  templates,
  events,
  siteId,
  onRefresh,
}: FeedbackCampaignsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const standingCampaigns = campaigns.filter(
    (c) => c.isStanding || c.eventType === "general" || !c.eventId
  );

  const eventCampaigns = campaigns.filter(
    (c) => !c.isStanding && c.eventType !== "general" && Boolean(c.eventId)
  );

  const handleCopyLink = async (campaignId: string) => {
    const url = `${window.location.origin}/feedback/${campaignId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(campaignId);
    toast.success(
      "Линкът е копиран! Можете да го изпратите във Viber / WhatsApp."
    );
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleToggleStatus = async (campaign: FeedbackCampaign) => {
    const newStatus = campaign.status === "active" ? "closed" : "active";
    try {
      await feedbackService.updateCampaign(campaign.id, { status: newStatus });
      toast.success(
        newStatus === "active"
          ? "Анкетата е активирана за сайта и споделяне"
          : "Анкетата е временно спряна (скрита от сайта)"
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка");
    }
  };

  const handleCreateGeneralCampaign = async () => {
    try {
      const genTemplate =
        templates.find((t) => t.eventType === "general") || templates[0];
      if (!genTemplate) {
        toast.error("Липсва шаблон за обща анкета.");
        return;
      }
      await feedbackService.createCampaign(siteId, {
        title: "Общ отзив и впечатления за Бадминтон клуб Гълъбово",
        description:
          "Постоянна публична анкета за тренировки, треньорски подход и удовлетвореност от клуба.",
        eventType: "general",
        templateId: genTemplate.id,
        templateName: genTemplate.name,
        questions: genTemplate.questions,
        status: "active",
        targetAudience: "all",
        isStanding: true,
      });
      toast.success("Общата анкета беше активирана на публичния сайт!");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при създаване на общата анкета.");
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (
      !window.confirm(
        "Сигурни ли сте, че искате да изтриете тази кампания за анкета?"
      )
    )
      return;
    try {
      await feedbackService.deleteCampaign(campaignId);
      toast.success("Кампанията е изтрита");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Standing Club Public Surveys Section */}
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/10 text-xs font-bold text-indigo-700">
                <Globe className="mr-1 size-3.5" />
                {siteId === "recoveryzone"
                  ? "Сайт на Recovery Zone"
                  : "Публичен клубен сайт"}
              </Badge>
              <a
                href={
                  siteId === "recoveryzone"
                    ? "/recovery-zone/reviews"
                    : "/club/reviews"
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Виж в сайта
                <ExternalLink className="size-3" />
              </a>
            </div>
            <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-900">
              Постоянни публични анкети на сайта
            </h2>
            <p className="text-xs font-medium text-zinc-500">
              Всички активирани анкети тук са постоянно достъпни за попълване от
              посетителите на сайта.
            </p>
          </div>

          <Button
            onClick={handleCreateGeneralCampaign}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs hover:from-blue-500 hover:to-indigo-500"
          >
            <Sparkles className="mr-1.5 size-3.5" />+ Добави обща анкета за
            сайта
          </Button>
        </div>

        {standingCampaigns.length === 0 ? (
          <Card className="border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
            <Globe className="mx-auto mb-2 size-8 text-zinc-400" />
            <h4 className="text-sm font-bold text-zinc-800">
              Няма активирани постоянни анкети на сайта
            </h4>
            <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">
              Можете да активирате всеки един шаблон като постоянна анкета от
              таб „Шаблони“ или да натиснете бутона по-горе.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {standingCampaigns.map((sc) => {
              const isActive = sc.status === "active";
              const isCopied = copiedId === sc.id;

              return (
                <Card
                  key={sc.id}
                  className={`overflow-hidden border transition-all ${
                    isActive
                      ? "border-indigo-200 bg-gradient-to-br from-indigo-50/30 via-white to-zinc-50/50 shadow-xs"
                      : "border-zinc-200 bg-zinc-50/40 opacity-80"
                  }`}
                >
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-800">
                              <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
                              Активна на сайта
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-zinc-200 text-[10px] font-bold text-zinc-600"
                            >
                              Спряна
                            </Badge>
                          )}

                          <Badge
                            variant="outline"
                            className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase"
                          >
                            {sc.eventType === "camp"
                              ? "Лагер"
                              : sc.eventType === "competition"
                                ? "Състезание"
                                : sc.eventType === "training"
                                  ? "Тренировки"
                                  : "Общ отзив"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600">
                            <MessageSquare className="size-3 text-zinc-500" />
                            {sc.responseCount || 0} отзива
                          </span>
                          {sc.averageRating ? (
                            <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {sc.averageRating}/5
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <h3 className="text-base font-black tracking-tight text-zinc-900">
                        {sc.title}
                      </h3>

                      {sc.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                          {sc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleToggleStatus(sc)}
                          size="sm"
                          className={`rounded-xl text-xs font-bold shadow-xs transition-all ${
                            isActive
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : "bg-emerald-600 text-white hover:bg-emerald-500"
                          }`}
                        >
                          <Power className="mr-1.5 size-3.5" />
                          {isActive ? "⏸️ Спри от сайта" : "▶️ Пусни на сайта"}
                        </Button>

                        <Button
                          onClick={() => handleCopyLink(sc.id)}
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                        >
                          {isCopied ? (
                            <>
                              <Check className="mr-1.5 size-3.5 text-emerald-600" />
                              Копиран!
                            </>
                          ) : (
                            <>
                              <Share2 className="mr-1.5 size-3.5" />
                              Копирай линк
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-xl text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600"
                          title="Преглед на анкетата"
                        >
                          <a
                            href={`/feedback/${sc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sc.id)}
                          className="size-8 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Изтрий"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Top action header for Event Specific Campaigns */}
      <div className="flex flex-col items-start justify-between gap-4 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-900">
            Анкети за конкретни събития & Линкове за споделяне
          </h2>
          <p className="text-xs font-medium text-zinc-500">
            Генерирайте специални линкове за конкретни лагери, турнири или
            тренировки.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 sm:text-sm"
        >
          <Plus className="mr-1.5 size-4" />
          Нова анкета за събитие
        </Button>
      </div>

      {/* Event Campaigns list */}
      {eventCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <LinkIcon className="mx-auto mb-3 size-10 text-zinc-300" />
          <h3 className="mb-1 text-base font-bold text-zinc-900">
            Няма активни анкети за събития
          </h3>
          <p className="mx-auto mb-4 max-w-sm text-xs text-zinc-500">
            Създайте първата си анкета за лагер или събитие, за да получите
            готов линк за родителите.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-indigo-600 text-xs hover:bg-indigo-700"
          >
            Създай анкета сега
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {eventCampaigns.map((c) => {
            const isActive = c.status === "active";
            const isCopied = copiedId === c.id;

            return (
              <Card
                key={c.id}
                className="overflow-hidden border-zinc-200 shadow-2xs transition-all hover:border-indigo-200 hover:shadow-xs"
              >
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    {/* Header badges */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800 uppercase">
                            <CheckCircle2 className="mr-1 size-3" />
                            Активна анкета
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-zinc-100 text-[10px] font-bold text-zinc-600 uppercase"
                          >
                            Затворена
                          </Badge>
                        )}

                        <Badge
                          variant="outline"
                          className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase"
                        >
                          {c.eventType === "camp"
                            ? "Лагер"
                            : c.eventType === "competition"
                              ? "Състезание"
                              : c.eventType === "training"
                                ? "Тренировки"
                                : "Обща"}
                        </Badge>
                      </div>

                      {/* Response Counter & Rating */}
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600">
                          <MessageSquare className="size-3 text-zinc-500" />
                          {c.responseCount || 0} отговора
                        </span>

                        {c.averageRating ? (
                          <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {c.averageRating}/5
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-black tracking-tight text-zinc-900">
                      {c.title}
                    </h3>

                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                        {c.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-zinc-400">
                      <span>Шаблон: {c.templateName || "Стандартен"}</span>
                      <span>•</span>
                      <span>Въпроси: {c.questions?.length || 0}</span>
                      <span>•</span>
                      <span>
                        Създадена:{" "}
                        {new Date(c.createdAt).toLocaleDateString("bg-BG")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                    <Button
                      onClick={() => handleCopyLink(c.id)}
                      className={
                        isCopied
                          ? "rounded-xl bg-emerald-600 text-xs font-bold text-white"
                          : "rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                      }
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-1.5 size-3.5" />
                          Копирано!
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-1.5 size-3.5" />
                          Копирай линк
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-xl text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Отвори публичната форма"
                      >
                        <a
                          href={`/feedback/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(c)}
                        className="size-8 rounded-xl text-zinc-400 hover:text-zinc-700"
                        title={
                          isActive
                            ? "Затвори анкетата"
                            : "Активирай отново анкетата"
                        }
                      >
                        <Power
                          className={`size-4 ${
                            isActive ? "text-emerald-600" : "text-zinc-400"
                          }`}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="size-8 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Изтрий"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreateCampaignDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        siteId={siteId}
        templates={templates}
        events={events}
        onCampaignCreated={onRefresh}
      />
    </div>
  );
}
