/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  Award,
  CheckCircle2,
  Eye,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { certificateTemplateService } from "@/services/certificate-template-service";
import {
  CertificateTemplate,
  getCertificateTypeLabel,
  getFrameStyleLabel,
  SponsorPartner,
  TemplateStatus,
} from "@/types/certificates";

import { CertificateDocumentPreview } from "./CertificateDocumentPreview";
import { TemplateWizardDialog } from "./TemplateWizardDialog";

interface TemplatesTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  templates: CertificateTemplate[];
  sponsors: SponsorPartner[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSelectForIssuance: (templateId: string) => void;
}

export function TemplatesTab({
  siteId,
  templates,
  sponsors,
  isLoading,
  onRefresh,
  onSelectForIssuance,
}: TemplatesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CertificateTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<CertificateTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleToggleStatus = async (template: CertificateTemplate) => {
    try {
      const nextStatus: TemplateStatus =
        template.status === "approved" ? "draft" : "approved";
      await certificateTemplateService.toggleTemplateStatus(
        template.id,
        nextStatus,
        siteId
      );
      toast.success(
        nextStatus === "approved"
          ? `Шаблонът "${template.title}" е одобрен за издаване.`
          : `Шаблонът "${template.title}" е преместен в чернови.`
      );
      await onRefresh();
    } catch (error) {
      console.error("Грешка при смяна на статус:", error);
      toast.error("Неуспешна промяна на статуса.");
    }
  };

  const handleDelete = async (id: string, nameToDelete: string) => {
    if (
      !confirm(
        `Сигурни ли сте, че искате да изтриете шаблона "${nameToDelete}"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await certificateTemplateService.deleteTemplate(id);
      toast.success(`Шаблонът "${nameToDelete}" беше изтрит.`);
      await onRefresh();
    } catch (error) {
      console.error("Грешка при изтриване на шаблон:", error);
      toast.error("Възникна грешка при изтриването.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true);
      await certificateTemplateService.seedInitialTemplates(siteId);
      toast.success("Препоръчителните клубни шаблони бяха заредени!");
      await onRefresh();
    } catch (error) {
      console.error("Грешка при зареждане на шаблони:", error);
      toast.error("Възникна грешка при инициализацията.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchesType = selectedType === "all" || tmpl.type === selectedType;
      const matchesStatus =
        selectedStatus === "all" || tmpl.status === selectedStatus;
      const matchesSearch =
        searchQuery === "" ||
        tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tmpl.description &&
          tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [templates, selectedType, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = templates.length;
    const approved = templates.filter((t) => t.status === "approved").length;
    const awards = templates.filter((t) => t.type === "award").length;
    const vouchers = templates.filter((t) => t.type === "voucher").length;
    return { total, approved, awards, vouchers };
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо шаблони
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {stats.total}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Palette className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Одобрени (Approved)
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.approved}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Грамоти за класиране
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.awards}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Award className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Подаръчни Ваучери
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.vouchers}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Ticket className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Bar and Actions */}
      <Card className="rounded-3xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Търсене на шаблон..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-2xl border-zinc-200 bg-zinc-50/50 pl-10 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "🌟 Всички" },
                { id: "award", label: "🏆 Грамоти" },
                { id: "voucher", label: "🎟️ Ваучери" },
                { id: "certificate", label: "📜 Сертификати" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedType(pill.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    selectedType === pill.id
                      ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "Всички статуси" },
                { id: "approved", label: "✅ Одобрени" },
                { id: "draft", label: "📝 Чернови" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedStatus(pill.id)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                    selectedStatus === pill.id
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-10 rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Обнови
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="h-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="mr-1.5 size-4" />
              Нов шаблон
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Templates Grid */}
      {isLoading ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-zinc-500">
            Зареждане на шаблони...
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Palette className="size-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Няма намерени шаблони
            </h3>
            <p className="text-xs text-zinc-500">
              {searchQuery || selectedType !== "all"
                ? "Опитайте с други филтри за търсене."
                : "Все още няма създадени шаблони. Можете да създадете нов или да заредите стандартния пакет шаблони за клуба."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              onClick={handleOpenCreate}
              className="rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus className="mr-1.5 size-4" />
              Създай първи шаблон
            </Button>
            <Button
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            >
              <Sparkles className="mr-1.5 size-3.5 text-amber-500" />
              Зареди начални шаблони
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTemplates.map((template) => {
            const isApproved = template.status === "approved";
            const vc = template.visualConfig;
            const isAiBackground = Boolean(vc.backgroundImageUrl);

            return (
              <Card
                key={template.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-200 hover:shadow-lg ${
                  isApproved
                    ? "border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-amber-200/60 bg-amber-50/20 dark:border-amber-900/40 dark:bg-zinc-950"
                }`}
              >
                <div className="space-y-4 p-5">
                  {/* Top Row: Type Badge + Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-xl border bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {getCertificateTypeLabel(template.type)}
                    </Badge>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(template)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                        isApproved
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                      title="Кликнете за промяна на статуса"
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span>Одобрен</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-amber-600" />
                          <span>Чернова</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real Miniature Certificate Preview */}
                  <div
                    onClick={() => setPreviewTemplate(template)}
                    className="group/preview relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-2 transition-all hover:border-blue-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                    title="Кликнете за пълен предварителен преглед на грамотата"
                  >
                    <div
                      className={`group-hover/preview:scale-1.03 pointer-events-none flex shrink-0 origin-center items-center justify-center transition-transform duration-300 select-none ${
                        vc.orientation === "landscape"
                          ? "scale-0.31 h-[565px] w-200"
                          : "scale-0.20 h-212 w-150"
                      }`}
                    >
                      <CertificateDocumentPreview
                        data={{
                          siteId,
                          type: template.type,
                          title: template.title,
                          visualConfig: template.visualConfig,
                          serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-DEMO`,
                          recipientName: "Иван Петров Димитров",
                          recipientInstitution:
                            siteId === "recoveryzone"
                              ? "Спортен клуб • гр. Гълъбово"
                              : "СУ „Васил Левски“ • гр. Гълъбово",
                          rank: "1st",
                          nomination: "Златен Медал & Спортен Дух",
                          eventTitle:
                            siteId === "recoveryzone"
                              ? "Възстановителен протокол и рехабилитация"
                              : "Общински Турнир по Бадминтон „Гълъбово 2026“",
                          eventDate: new Date().toLocaleDateString("bg-BG"),
                          eventLocation:
                            siteId === "recoveryzone"
                              ? "Recovery Zone Center, гр. Гълъбово"
                              : "Спортен Комплекс „Енергетик“, гр. Гълъбово",
                          totalSessions: template.defaultTotalSessions || 5,
                          remainingSessions: template.defaultTotalSessions || 5,
                          sponsors,
                        }}
                        className="size-full! max-w-none! shadow-none!"
                      />
                    </div>

                    {/* Frame/Style badge in top left */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                      {isAiBackground ? (
                        <>
                          <Sparkles className="size-2.5 text-purple-300" />
                          <span>AI Арт</span>
                        </>
                      ) : (
                        <span>{getFrameStyleLabel(vc.frameStyle)}</span>
                      )}
                    </div>

                    {/* Orientation badge in top right */}
                    <div className="absolute top-2 right-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                      {vc.orientation === "landscape" ? "Пейзаж" : "Портрет"}
                    </div>

                    {/* Hover Action Pill */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/preview:opacity-100">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl transition-transform group-hover/preview:scale-105">
                        <Eye className="size-3.5" />
                        <span>Преглед на живо</span>
                      </div>
                    </div>
                  </div>

                  {/* Description & Signatory info */}
                  <div className="space-y-1.5">
                    {template.description ? (
                      <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {template.description}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">
                        Няма добавено описание
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-[11px] text-zinc-500 dark:border-zinc-800/60">
                      <span>
                        Подпис: <strong>{vc.signatoryName}</strong>
                      </span>
                      {template.type === "voucher" &&
                        template.defaultTotalSessions && (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {template.defaultTotalSessions} сесии
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Footer */}
                <div className="flex flex-col gap-2.5 border-t border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSelectForIssuance(template.id)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                    >
                      <Printer className="size-3.5" />
                      Издай
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border-zinc-200 bg-white text-xs font-bold text-zinc-700 shadow-2xs hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-blue-950/50"
                      title="Виж предварителен преглед на грамотата"
                    >
                      <Eye className="size-3.5 text-blue-600 dark:text-blue-400" />
                      Преглед
                    </Button>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5 text-xs dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(template)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      title="Редактиране на шаблон"
                    >
                      <Pencil className="size-3.5 text-zinc-500" />
                      <span>Редактирай</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(template.id, template.title)}
                      disabled={deletingId === template.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                      title="Изтриване на шаблон"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span>Изтрий</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal for Selected Template */}
      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-3xl p-4 sm:p-6">
          <DialogHeader className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                >
                  {previewTemplate
                    ? getCertificateTypeLabel(previewTemplate.type)
                    : "Шаблон"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-lg px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400"
                >
                  {previewTemplate?.visualConfig.orientation === "portrait"
                    ? "Портрет (Вертикален)"
                    : "Пейзаж (Хоризонтален)"}
                </Badge>
              </div>
              <DialogTitle className="mt-1 text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                {previewTemplate?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Реалистичен предварителен преглед на документа с примерни данни
                за получател, печат и спонсори.
              </DialogDescription>
            </div>

            {previewTemplate && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const toEdit = previewTemplate;
                    setPreviewTemplate(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="rounded-xl border-zinc-200 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-800"
                >
                  <Pencil className="mr-1.5 size-3.5" />
                  Редактирай
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const id = previewTemplate.id;
                    setPreviewTemplate(null);
                    onSelectForIssuance(id);
                  }}
                  className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Printer className="mr-1.5 size-3.5" />
                  Издай с този шаблон
                </Button>
              </div>
            )}
          </DialogHeader>

          {previewTemplate && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex w-full items-center justify-center overflow-hidden">
                <CertificateDocumentPreview
                  data={{
                    siteId,
                    type: previewTemplate.type,
                    title: previewTemplate.title,
                    visualConfig: previewTemplate.visualConfig,
                    serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-DEMO`,
                    recipientName: "Иван Петров Димитров",
                    recipientInstitution:
                      siteId === "recoveryzone"
                        ? "Спортен клуб • гр. Гълъбово"
                        : "СУ „Васил Левски“ • гр. Гълъбово",
                    rank: "1st",
                    nomination: "Златен Медал & Спортен Дух",
                    eventTitle:
                      siteId === "recoveryzone"
                        ? "Възстановителен протокол и рехабилитация"
                        : "Общински Турнир по Бадминтон „Гълъбово 2026“",
                    eventDate: new Date().toLocaleDateString("bg-BG"),
                    eventLocation:
                      siteId === "recoveryzone"
                        ? "Recovery Zone Center, гр. Гълъбово"
                        : "Спортен Комплекс „Енергетик“, гр. Гълъбово",
                    totalSessions: previewTemplate.defaultTotalSessions || 5,
                    remainingSessions:
                      previewTemplate.defaultTotalSessions || 5,
                    sponsors,
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Wizard Modal */}
      <TemplateWizardDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        siteId={siteId}
        templateToEdit={editingTemplate}
        sponsors={sponsors}
        onSaved={onRefresh}
      />
    </div>
  );
}
