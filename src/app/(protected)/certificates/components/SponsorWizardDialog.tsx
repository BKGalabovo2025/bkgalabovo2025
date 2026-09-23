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
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header with Stepper */}
        <div className="shrink-0 border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-black text-zinc-900 dark:text-white">
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Handshake className="size-4" />
            </span>
            <span>
              {sponsorToEdit
                ? "Редактиране на Партньор (Wizard)"
                : "Нов Спонсор / Институция (Wizard)"}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-zinc-500">
            Стъпка по стъпка добавяне на официални спонсори с проверка на
            визуален контраст.
          </DialogDescription>

          {/* Stepper Pills */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            {WIZARD_STEPS.map((step) => {
              const isActiveStep = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    isActiveStep
                      ? "bg-blue-600 text-white shadow-sm"
                      : isCompleted
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`flex size-4 items-center justify-center rounded-full text-[9px] font-black ${
                      isActiveStep
                        ? "bg-white text-blue-600"
                        : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="space-y-6 p-6">
          {/* STEP 1: CATEGORY */}
          {currentStep === 1 && (
            <div className="space-y-4 duration-200 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  1. Изберете Роля & Категория
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Определя приоритета на позициониране и значката за
                  сътрудничество.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory("institutional")}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    category === "institutional"
                      ? "border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <span className="mb-1 block text-2xl">🏛️</span>
                  <span className="block text-xs font-black text-zinc-900 dark:text-white">
                    Институция / Федерация
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                    Община Гълъбово, БФБ, Министерства.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("gold")}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    category === "gold"
                      ? "border-amber-500 bg-amber-50/60 shadow-sm ring-2 ring-amber-500/30 dark:bg-amber-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <span className="mb-1 block text-2xl">💎</span>
                  <span className="block text-xs font-black text-zinc-900 dark:text-white">
                    Генерален / Златен Спонсор
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                    Основни индустриални и корпоративни дарители.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("partner")}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    category === "partner"
                      ? "border-purple-500 bg-purple-50/60 shadow-sm ring-2 ring-purple-500/30 dark:bg-purple-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <span className="mb-1 block text-2xl">🤝</span>
                  <span className="block text-xs font-black text-zinc-900 dark:text-white">
                    Официален Партньор
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                    Спортни зали, оборудване и логистика.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("silver")}
                  className={`rounded-2xl border p-3.5 text-left transition-all ${
                    category === "silver"
                      ? "border-zinc-500 bg-zinc-100 shadow-sm ring-2 ring-zinc-500/30 dark:bg-zinc-800"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <span className="mb-1 block text-2xl">🏅</span>
                  <span className="block text-xs font-black text-zinc-900 dark:text-white">
                    Сребърен / Бронзов
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                    Регионални компании и локален бизнес.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-4 duration-200 animate-in fade-in">
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
                    placeholder="напр. Мини Марица-изток ЕАД или Община Гълъбово"
                    className="rounded-xl font-medium"
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
                    className="rounded-xl font-mono text-xs"
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
                    className="resize-none rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOGO & CONTRAST TEST */}
          {currentStep === 3 && (
            <div className="space-y-4 duration-200 animate-in fade-in">
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
                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <span className="block text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                    Интерактивен Тест на Контраста:
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Test 1: Light Canvas */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
                      <div className="relative h-10 w-24">
                        <Image
                          src={logoUrl}
                          alt="Светъл фон тест"
                          fill
                          sizes="96px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500">
                        Светла грамота
                      </span>
                    </div>

                    {/* Test 2: Luxury Dark Canvas */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-[#09090b] p-3 shadow-xs">
                      <div className="relative h-10 w-24">
                        <Image
                          src={logoUrl}
                          alt="Тъмен фон тест"
                          fill
                          sizes="96px"
                          className="object-contain brightness-125"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-amber-400">
                        Тъмен лукс
                      </span>
                    </div>

                    {/* Test 3: AI Certificate Footer */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-zinc-900 p-3 shadow-xs">
                      <div className="relative h-10 w-24">
                        <Image
                          src={logoUrl}
                          alt="AI платно тест"
                          fill
                          sizes="96px"
                          className="object-contain brightness-200 grayscale filter"
                          unoptimized
                        />
                      </div>
                      <span className="text-[9px] font-bold text-purple-300">
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
            <div className="space-y-4 duration-200 animate-in fade-in">
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
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border bg-zinc-50 p-1">
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
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                      {name}
                    </h4>
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      {getSponsorCategoryLabel(category)}
                    </Badge>
                  </div>
                </div>

                {websiteUrl && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-blue-600 dark:text-blue-400">
                    <Globe className="size-3" />
                    <span>{websiteUrl}</span>
                  </div>
                )}
              </div>

              {/* Order and Active Switch */}
              <div className="grid grid-cols-2 gap-4 pt-2">
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
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-1.5">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
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
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
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
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-100/80 px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="gap-1.5 rounded-xl text-xs font-bold"
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
              className="gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              Напред
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
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
