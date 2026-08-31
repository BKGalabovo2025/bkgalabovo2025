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

  const generalCampaign = campaigns.find(
    (c) => c.eventType === "general" || !c.eventId
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
      {/* 1. Standing Club Public Survey Card */}
      <Card className="overflow-hidden border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-zinc-950 p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <a
                href="/club/reviews"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-300 transition-colors hover:bg-indigo-500/40 hover:text-white"
                title="Отвори публичната страница с отзиви на клуба"
              >
                <Globe className="size-3.5" />
                Публичен сайт
                <ExternalLink className="size-3 opacity-70" />
              </a>
              {generalCampaign?.status === "active" ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/20 text-xs font-bold text-emerald-300">
                  <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
                  Активна на сайта
                </Badge>
              ) : (
                <Badge className="border-zinc-700 bg-zinc-800 text-xs text-zinc-400">
                  Спряна (Не се вижда)
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-black text-white sm:text-xl">
              Постоянна анкета за общ отзив на клуба
            </h3>
            <p className="max-w-xl text-xs leading-relaxed text-indigo-200/80 sm:text-sm">
              Когато е активна, бутонът{" "}
              <strong>„✍️ Споделете Вашия отзив“</strong> се показва автоматично
              на сайта на клуба. Всеки родител или гост може да остави отзив,
              който преминава през модерация преди да се публикува.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {generalCampaign ? (
              <>
                <Button
                  onClick={() => handleToggleStatus(generalCampaign)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all ${
                    generalCampaign.status === "active"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  <Power className="mr-1.5 size-4" />
                  {generalCampaign.status === "active"
                    ? "⏸️ Спри анкетата от сайта"
                    : "▶️ Пусни анкетата на сайта"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleCopyLink(generalCampaign.id)}
                  className="rounded-xl border-indigo-400/30 bg-indigo-900/40 text-xs font-bold text-indigo-100 hover:bg-indigo-900/80"
                >
                  {copiedId === generalCampaign.id ? (
                    <>
                      <Check className="mr-1.5 size-4 text-emerald-400" />
                      Копиран!
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-1.5 size-4" />
                      Копирай линк
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-indigo-400/30 bg-indigo-900/40 text-xs font-bold text-indigo-100 hover:bg-indigo-900/80"
                >
                  <a
                    href={`/feedback/${generalCampaign.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    Преглед
                  </a>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreateGeneralCampaign}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-blue-400 hover:to-indigo-500"
              >
                <Sparkles className="mr-1.5 size-4" />
                🚀 Активирай обща анкета за сайта сега
              </Button>
            )}
          </div>
        </div>
      </Card>

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

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
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
          {campaigns.map((c) => {
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
