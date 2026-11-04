"use client";

import { ArrowLeft, Loader2, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
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
import {
  createGeneralServiceAction,
  updateGeneralServiceAction,
} from "@/lib/actions/general-services-server";
import { useAppStore } from "@/store/use-app-store";
import { GeneralService } from "@/types";

interface ClubServiceFormViewProps {
  mode: "add" | "edit";
  initialService?: GeneralService | null;
}

export function ClubServiceFormView({
  mode,
  initialService,
}: ClubServiceFormViewProps) {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(initialService?.name || "");
  const [description, setDescription] = useState(
    initialService?.description || ""
  );
  const [price, setPrice] = useState(
    initialService?.price ? String(initialService.price) : ""
  );
  const [pricingUnit, setPricingUnit] = useState<
    "fixed" | "per_hour" | "per_session"
  >(initialService?.pricingUnit || "fixed");
  const [performerName, setPerformerName] = useState(
    initialService?.performerName || ""
  );
  const [performerType, setPerformerType] = useState<"internal" | "external">(
    initialService?.performerType || "internal"
  );
  const [imageUrl, setImageUrl] = useState(initialService?.imageUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Името на услугата е задължително.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Моля, въведете валидна неотрицателна цена.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "edit" && initialService?.id) {
        const result = await updateGeneralServiceAction(initialService.id, {
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          pricingUnit,
          performerName: performerName.trim(),
          performerType,
          imageUrl: imageUrl || undefined,
        });

        if (result.success) {
          toast.success("Клубната услуга е обновена успешно!");
          router.push("/catalogs/club-services");
          router.refresh();
        } else {
          toast.error(result.error || "Грешка при обновяване на услугата.");
        }
      } else {
        const result = await createGeneralServiceAction({
          siteId: activeBranch || "bkgalabovo",
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          currency: "EUR",
          pricingUnit,
          performerName: performerName.trim(),
          performerType,
          imageUrl: imageUrl || undefined,
        });

        if (result.success) {
          toast.success("Новата клубна услуга е добавена!");
          router.push("/catalogs/club-services");
          router.refresh();
        } else {
          toast.error(result.error || "Грешка при създаване на услугата.");
        }
      }
    } catch {
      toast.error("Възникна непредвидена грешка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "add"
      ? "Нова клубна услуга"
      : `Редактиране: ${initialService?.name || "Услуга"}`;
  const subtitle =
    mode === "add"
      ? "Добавяне на наем на шкафче, ракета, наплитане или клубен консуматив."
      : "Промяна на тарифа, тип тарифиране (фиксирана, на час, на сесия) или изпълнител.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Header / Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <Link href="/catalogs/club-services">
              <ArrowLeft className="mr-1.5 size-4" />
              <span>Назад към клубни услуги</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
              {title}
            </h1>
            <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <BentoCard className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">
              Наименование на услугата
            </Label>
            <Input
              required
              placeholder="напр. Наем на ракета Yonex, Наплитане на ракета, Шкафче..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Цена (EUR / лв.)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="напр. 5.00"
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Тип тарифиране</Label>
              <Select
                value={pricingUnit}
                onValueChange={(v: "fixed" | "per_hour" | "per_session") =>
                  setPricingUnit(v)
                }
              >
                <SelectTrigger className="mt-1 rounded-xl text-xs">
                  <SelectValue placeholder="Изберете тип" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="fixed">Фиксирана цена</SelectItem>
                  <SelectItem value="per_hour">На час</SelectItem>
                  <SelectItem value="per_session">На сесия</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">
                Изпълнител / Отговорник
              </Label>
              <Input
                placeholder="напр. Треньор, Клуб, Външен майстор"
                value={performerName}
                onChange={(e) => setPerformerName(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Тип изпълнител</Label>
              <Select
                value={performerType}
                onValueChange={(v: "internal" | "external") =>
                  setPerformerType(v)
                }
              >
                <SelectTrigger className="mt-1 rounded-xl text-xs">
                  <SelectValue placeholder="Изберете тип" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="internal">Вътрешен (Клубът)</SelectItem>
                  <SelectItem value="external">
                    Външен доставчик / партньор
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Описание (по избор)</Label>
            <Textarea
              rows={3}
              placeholder="Детайли за услугата, правила за ползване, условия..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Снимка на услугата</Label>
            <div className="mt-1.5">
              <UniversalMediaUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/catalogs/club-services")}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  <span>Запазване...</span>
                </>
              ) : (
                <>
                  <Wrench size={14} className="mr-1.5" />
                  <span>
                    {mode === "add" ? "Създай услуга" : "Запази промените"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </BentoCard>
    </div>
  );
}
