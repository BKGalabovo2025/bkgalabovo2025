/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Handshake,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sponsorService } from "@/services/sponsor-service";
import {
  getSponsorCategoryLabel,
  SponsorCategory,
  SponsorPartner,
} from "@/types/certificates";

import { SponsorWizardDialog } from "./SponsorWizardDialog";

interface SponsorsTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  sponsors: SponsorPartner[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function SponsorsTab({
  siteId,
  sponsors,
  isLoading,
  onRefresh,
}: SponsorsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorPartner | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingSponsor(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sponsor: SponsorPartner) => {
    setEditingSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (sponsor: SponsorPartner) => {
    try {
      const nextState = !sponsor.isActive;
      await sponsorService.toggleSponsorActive(sponsor.id, nextState, siteId);
      toast.success(
        nextState
          ? `"${sponsor.name}" е активиран за визуализация в документи.`
          : `"${sponsor.name}" е временно скрит от документи.`
      );
      await onRefresh();
    } catch (error) {
      console.error("Грешка при превключване на активност:", error);
      toast.error("Неуспешна промяна на статуса.");
    }
  };

  const handleDelete = async (id: string, nameToDelete: string) => {
    if (
      !confirm(`Сигурни ли сте, че искате да премахнете "${nameToDelete}"?`)
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await sponsorService.deleteSponsor(id);
      toast.success(`"${nameToDelete}" беше премахнат.`);
      await onRefresh();
    } catch (error) {
      console.error("Грешка при изтриване на спонсор:", error);
      toast.error("Възникна грешка при изтриване.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setIsSubmitting(true);
      await sponsorService.seedInitialSponsors(siteId);
      toast.success("Препоръчителните партньори бяха заредени в базата!");
      await onRefresh();
    } catch (error) {
      console.error("Грешка при зареждане на начални спонсори:", error);
      toast.error("Възникна проблем при зареждането.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeClass = (cat: SponsorCategory) => {
    switch (cat) {
      case "educational":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      case "institutional":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
      case "sports":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "gold":
        return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case "silver":
        return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "bronze":
        return "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800";
      case "partner":
      default:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Списък с официални партньори ({sponsors.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 sm:h-10 rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Обнови
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-9 sm:h-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="mr-1.5 size-4" />
            Нов партньор
          </Button>
        </div>
      </div>

      {/* 3. Sponsor Cards Grid */}
      {isLoading ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-zinc-500">
            Зареждане на партньори...
          </p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Handshake className="size-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Няма регистрирани партньори или спонсори
            </h3>
            <p className="text-xs text-zinc-500">
              Все още няма регистрирани партньори в базата. Можете да добавите
              нов или да заредите препоръчителните партньори за клуба.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              onClick={handleOpenCreate}
              className="rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus className="mr-1.5 size-4" />
              Добави първи партньор
            </Button>
            {sponsors.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={isSubmitting}
                className="rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
              >
                <Sparkles className="mr-1.5 size-3.5 text-amber-500" />
                Зареди препоръчителни спонсори
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sponsors.map((sponsor) => (
            <Card
              key={sponsor.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-200 hover:shadow-md ${
                sponsor.isActive
                  ? "border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  : "border-zinc-200/50 bg-zinc-50/70 opacity-75 dark:border-zinc-800/50 dark:bg-zinc-950"
              }`}
            >
              <div className="space-y-4 p-5">
                {/* Top Row: Category Badge & Order Badge */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-xl border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${getCategoryBadgeClass(
                      sponsor.category
                    )}`}
                    title={getSponsorCategoryLabel(sponsor.category)}
                  >
                    {sponsor.category === "institutional"
                      ? "🏛️ Институционален"
                      : getSponsorCategoryLabel(sponsor.category)}
                  </Badge>

                  <span
                    className="shrink-0 rounded-lg border border-zinc-200/60 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold whitespace-nowrap text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-400"
                    title={`Пореден номер на визуализация: ${sponsor.order || 0}`}
                  >
                    № {sponsor.order || 0}
                  </span>
                </div>

                {/* Logo Box */}
                <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  {sponsor.logoUrl ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      width={180}
                      height={90}
                      className="max-h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      style={{ width: "auto", height: "auto" }}
                      loading="eager"
                      unoptimized
                    />
                  ) : (
                    <Building2 className="size-10 text-zinc-300" />
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <h4
                    className="text-sm leading-snug font-bold text-zinc-900 dark:text-white"
                    title={sponsor.name}
                  >
                    {sponsor.name}
                  </h4>
                  {sponsor.description ? (
                    <p
                      className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
                      title={sponsor.description}
                    >
                      {sponsor.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      Няма добавено описание
                    </p>
                  )}
                </div>

                {/* Link */}
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <Globe className="size-3.5 shrink-0" />
                    <span className="max-w-50 truncate">
                      {sponsor.websiteUrl
                        .replace(/^https?:\/\/(www\.)?/, "")
                        .replace(/\/$/, "")}
                    </span>
                    <ExternalLink className="size-3 shrink-0 opacity-70" />
                  </a>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                {/* Active Toggle Switch as Interactive Pill */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(sponsor)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs transition-all ${
                    sponsor.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                      : "border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                  title={
                    sponsor.isActive
                      ? "Включен в дипломи и ваучери (кликнете за изключване)"
                      : "Изключен от визуализация (кликнете за включване)"
                  }
                >
                  {sponsor.isActive ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Активен</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3.5 text-zinc-400" />
                      <span>Скрит</span>
                    </>
                  )}
                </button>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenEdit(sponsor)}
                    className="size-8 rounded-xl border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
                    title="Редактиране на партньора"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(sponsor.id, sponsor.name)}
                    disabled={deletingId === sponsor.id}
                    className="size-8 rounded-xl border-zinc-200/80 bg-white text-red-500 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800 dark:hover:bg-red-950/50"
                    title="Изтриване на партньора"
                  >
                    {deletingId === sponsor.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Sponsor Wizard Dialog */}
      <SponsorWizardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        siteId={siteId}
        sponsorToEdit={editingSponsor}
        totalSponsorsCount={sponsors.length}
        onSaved={onRefresh}
      />
    </div>
  );
}
