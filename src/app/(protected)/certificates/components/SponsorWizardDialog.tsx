/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Globe,
  Handshake,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sponsorService } from "@/services/sponsor-service";
import {
  getSponsorCategoryLabel,
  SponsorCategory,
  SponsorPartner,
  SponsorPartnerCreateInput,
} from "@/types/certificates";

export interface SponsorWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: "bkgalabovo" | "recoveryzone";
  sponsorToEdit?: SponsorPartner | null;
  totalSponsorsCount: number;
  onSaved: () => void;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Роля & Категория",
    icon: ShieldCheck,
    desc: "Официален статут",
  },
  {
    id: 2,
    title: "Данни за Партньора",
    icon: Building2,
    desc: "Име, уебсайт и принос",
  },
  {
    id: 3,
    title: "Лого & Тест Превю",
    icon: ImageIcon,
    desc: "Проверка на контраст",
  },
  {
    id: 4,
    title: "Поредност & Запис",
    icon: CheckCircle2,
    desc: "Финално потвърждение",
  },
];

export function SponsorWizardDialog({
  isOpen,
  onClose,
  siteId,
  sponsorToEdit,
  totalSponsorsCount,
  onSaved,
}: SponsorWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<SponsorCategory>("partner");
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Reset or Populate on open
  useEffect(() => {
    if (!isOpen) return;

    if (sponsorToEdit) {
      setCategory(sponsorToEdit.category);
      setName(sponsorToEdit.name);
      setWebsiteUrl(sponsorToEdit.websiteUrl || "");
      setDescription(sponsorToEdit.description || "");
      setLogoUrl(sponsorToEdit.logoUrl);
      setOrder(sponsorToEdit.order);
      setIsActive(sponsorToEdit.isActive);
      setCurrentStep(1);
    } else {
      setCategory("partner");
      setName("");
      setWebsiteUrl("");
      setDescription("");
      setLogoUrl("");
      setOrder(totalSponsorsCount + 1);
      setIsActive(true);
      setCurrentStep(1);
    }
  }, [isOpen, sponsorToEdit, totalSponsorsCount]);

  // Validation
  const canProceedNext = () => {
    if (currentStep === 1) return Boolean(category);
    if (currentStep === 2) return name.trim().length >= 2;
    if (currentStep === 3) return Boolean(logoUrl);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 2 && name.trim().length < 2) {
      toast.error(
        "Моля, въведете име на организацията или партньора (минимум 2 символа)."
      );
      return;
    }
    if (currentStep === 3 && !logoUrl) {
      toast.error("Моля, качете графично лого за сертификатите.");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Save
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Името на партньора е задължително!");
      setCurrentStep(2);
      return;
    }
    if (!logoUrl) {
      toast.error("Логото е задължително!");
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    try {
      const payload: SponsorPartnerCreateInput = {
        name: name.trim(),
        category,
        logoUrl,
        websiteUrl: websiteUrl.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
        order,
      };

      if (sponsorToEdit) {
        await sponsorService.updateSponsor(sponsorToEdit.id, payload, siteId);
        toast.success("Данните за партньора са обновени успешно!");
      } else {
        await sponsorService.createSponsor(siteId, payload);
        toast.success("Новият спонсор/институция е добавен успешно!");
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при запис на спонсора.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] w-[95vw] max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-0 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header with Stepper */}
        <div className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/90">
          <DialogTitle className="flex items-center gap-2 text-base font-black text-zinc-900 sm:text-lg dark:text-white">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs sm:size-8">
              <Handshake className="size-3.5 sm:size-4" />
            </span>
            <span className="truncate">
              {sponsorToEdit
                ? "Редактиране на Партньор (Wizard)"
                : "Нов Спонсор / Институция (Wizard)"}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
            Стъпка по стъпка добавяне на официални спонсори с проверка на
            визуален контраст.
          </DialogDescription>

          {/* Stepper Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2 overscroll-contain">
            {WIZARD_STEPS.map((step) => {
              const isActiveStep = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all sm:px-3 sm:text-xs ${
                    isActiveStep
                      ? "bg-blue-600 text-white shadow-xs"
                      : isCompleted
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                      isActiveStep
                        ? "bg-white text-blue-600"
                        : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </span>
                  <span className="whitespace-nowrap">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6 overscroll-contain">
          {/* STEP 1: CATEGORY */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4 duration-200 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  1. Изберете Роля & Категория
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Определя приоритета на позициониране и значката за
                  сътрудничество.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setCategory("educational")}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 sm:p-3.5 ${
                    category === "educational"
                      ? "border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/30 dark:bg-blue-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
                  }`}
                >
                  <span className="shrink-0 text-2xl sm:text-3xl">🏫</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      Образователна институция
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500 leading-tight sm:text-xs">
                      Училища и детски градини (напр. Второ ОУ, ДГ „Радост“).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("institutional")}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 sm:p-3.5 ${
                    category === "institutional"
                      ? "border-sky-500 bg-sky-50/70 shadow-xs ring-2 ring-sky-500/30 dark:bg-sky-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
                  }`}
                >
                  <span className="shrink-0 text-2xl sm:text-3xl">🏛️</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      Институционален партньор
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500 leading-tight sm:text-xs">
                      Община Гълъбово, Българска Федерация Бадминтон (БФБ).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("sports")}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 sm:p-3.5 ${
                    category === "sports"
                      ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/30 dark:bg-emerald-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
                  }`}
                >
                  <span className="shrink-0 text-2xl sm:text-3xl">🏸</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      Спортен партньор
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500 leading-tight sm:text-xs">
                      Спортни брандове, екипировка и зали (напр. Babolat,
                      Yonex).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("partner")}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 sm:p-3.5 ${
                    category === "partner"
                      ? "border-purple-500 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/30 dark:bg-purple-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
                  }`}
                >
                  <span className="shrink-0 text-2xl sm:text-3xl">🤝</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      Партньор
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500 leading-tight sm:text-xs">
                      Предприятия, фирми, медии и проекти (Be Active, вестник).
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-3.5 sm:space-y-4 duration-200 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  2. Данни за Организацията
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Попълнете официалното наименование и контактни данни.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="spName" className="text-xs font-bold">
                    Име на партньора / организацията *
                  </Label>
                  <Input
                    id="spName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="напр. Второ ОУ „Христо Ботев“, Община Гълъбово или Babolat"
                    className="h-10 rounded-xl font-medium sm:h-11 text-xs sm:text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="spUrl" className="text-xs font-bold">
                    Официален уебсайт (URL)
                  </Label>
                  <Input
                    id="spUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="h-10 rounded-xl font-mono text-xs sm:h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="spDesc" className="text-xs font-bold">
                    Кратко описание на партньорството
                  </Label>
                  <Textarea
                    id="spDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Подкрепа за детско-юношеския отбор по бадминтон..."
                    className="resize-none rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOGO & CONTRAST TEST */}
          {currentStep === 3 && (
            <div className="space-y-3.5 sm:space-y-4 duration-200 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  3. Качване на Лого & Тест Превю
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Препоръчваме PNG с прозрачен фон за перфектно вписване върху
                  всякакви фонове.
                </p>
              </div>

              {/* Upload Input */}
              <UniversalMediaUpload
                label="Файл на логото *"
                storageFolder="sponsors"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url || "")}
                accept="image/*"
              />

              {/* Live Contrast Tester Box */}
              {logoUrl && (
                <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-100/70 p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center justify-between">
                    <span className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                      Интерактивен Тест на Контраста:
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Проверка на четливост
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Test 1: Light Canvas */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 shadow-2xs">
                      <div className="relative h-9 w-20 sm:h-11 sm:w-24">
                        <Image
                          src={logoUrl}
                          alt="Светъл фон тест"
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600 sm:text-[10px] dark:text-zinc-300">
                        Светла грамота
                      </span>
                    </div>

                    {/* Test 2: Luxury Dark Canvas */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-[#09090b] p-2.5 sm:p-3 shadow-2xs">
                      <div className="relative h-9 w-20 sm:h-11 sm:w-24">
                        <Image
                          src={logoUrl}
                          alt="Тъмен фон тест"
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-contain brightness-110"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 sm:text-[10px]">
                        Тъмен лукс
                      </span>
                    </div>

                    {/* Test 3: AI Certificate Footer */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-zinc-900 p-2.5 sm:p-3 shadow-2xs">
                      <div className="relative h-9 w-20 sm:h-11 sm:w-24">
                        <Image
                          src={logoUrl}
                          alt="AI платно тест"
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-contain brightness-150 grayscale filter"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-purple-300 sm:text-[10px]">
                        Футер лента
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ORDER & ACTIVATION */}
          {currentStep === 4 && (
            <div className="space-y-3.5 sm:space-y-4 duration-200 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  4. Поредност & Активация
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Определете реда на показване във футера на издаваните грамоти
                  и сертификати.
                </p>
              </div>

              {/* Summary Card */}
              <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border bg-zinc-50 p-1 sm:size-12">
                      <Image
                        src={logoUrl}
                        alt={name}
                        fill
                        sizes="48px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      {name}
                    </h4>
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      {getSponsorCategoryLabel(category)}
                    </Badge>
                  </div>
                </div>

                {websiteUrl && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-blue-600 dark:text-blue-400">
                    <Globe className="size-3 shrink-0" />
                    <span className="truncate">{websiteUrl}</span>
                  </div>
                )}
              </div>

              {/* Order and Active Switch */}
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 sm:gap-4 sm:pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="spOrder" className="text-xs font-bold">
                    Поредност (Order)
                  </Label>
                  <Input
                    id="spOrder"
                    type="number"
                    min={1}
                    max={50}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 1)}
                    className="h-10 rounded-xl font-bold sm:h-11"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-1.5">
                  <div className="flex min-h-10 sm:min-h-11 items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      Активен в студиото
                    </span>
                    <button
                      type="button"
                      id="spActive"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isActive
                          ? "bg-emerald-600"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav Controls */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-100/90 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/90">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="h-10 gap-1.5 rounded-xl px-3 text-xs font-bold sm:h-10 sm:px-4"
          >
            <ArrowLeft className="size-4" />
            Назад
          </Button>

          <span className="text-xs font-bold text-zinc-400">
            Стъпка {currentStep} от 4
          </span>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!canProceedNext()}
              className="h-10 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
            >
              Напред
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Запази Партньора
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
