/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Check, Link2, MessageSquare } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";

import { CatalogSectionId } from "@/components/catalogs/catalog-sections";
import { ProductStockBadge } from "@/components/catalogs/views/ShopCatalogView";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/currency";
import { cn, sanitizeImageUrl } from "@/lib/utils";

interface CatalogDetailModalProps {
  item: any;
  tab: CatalogSectionId;
  isOpen: boolean;
  onClose: () => void;
  onInquiry: (item: any) => void;
  isCopied?: boolean;
  onCopyLink: () => void;
  onRecoveryInquiry?: (item: any) => void;
}

const cleanUrl = (src: string) => {
  if (!src) return "";
  const sanitized = sanitizeImageUrl(src);
  if (!sanitized) return "";
  if (sanitized.includes("/планове/") && sanitized.endsWith(".png")) {
    return sanitized.replace(/\.png$/, ".webp");
  }
  if (sanitized.endsWith("/arm.png") || sanitized === "/zones/arm.png") {
    return "/zones/arm.webp";
  }
  return sanitized;
};

export function CatalogDetailModal({
  item,
  tab,
  isOpen,
  onClose,
  onInquiry,
  isCopied,
  onCopyLink,
  onRecoveryInquiry,
}: CatalogDetailModalProps) {
  const [activeImageIndex] = useState(0);

  const images = useMemo(() => {
    if (!item) return [];
    if (item.imageUrl) {
      return item.imageUrl
        .split(",")
        .map((u: string) => cleanUrl(u))
        .filter(Boolean);
    }
    if (tab === "recovery") {
      const nameLower = (item.name || "").toLowerCase();
      const hasPelvis =
        nameLower.includes("таз") || item.zones?.includes("ТАЗ");
      const hasArms =
        nameLower.includes("ръце") ||
        nameLower.includes("ръка") ||
        item.zones?.includes("РЪЦЕ");
      const hasLegs =
        nameLower.includes("крака") ||
        nameLower.includes("крак") ||
        item.zones?.includes("КРАКА");

      if (hasPelvis) return ["/zones/pelvis.webp"];
      if (hasArms) return ["/zones/arm.webp"];
      if (hasLegs) return ["/zones/legs.webp"];
    }
    return [];
  }, [item, tab]);

  if (!item) return null;

  const isRecovery = tab === "recovery";
  const hasValidPrice = typeof item.price === "number" && item.price > 0;

  const getPriceSuffix = () => {
    if (tab === "trainings") {
      const periodMap: Record<string, string> = {
        месечен: "месец",
        еднократен: "тренировка",
        тримесечен: "3 месеца",
        шестмесечен: "6 месеца",
      };
      const rawPeriod = (item.billingPeriod || "").trim().toLowerCase();
      return `/ ${periodMap[rawPeriod] || rawPeriod || "месец"}`;
    }
    if (tab === "club-services") {
      if (item.pricingUnit === "per_hour") return "/ час";
      if (item.pricingUnit === "per_session") return "/ сесия";
      return "/ наем";
    }
    if (tab === "recovery") {
      const days = item.numberOfDays || 1;
      return days > 1 ? `/ ${days} дни` : "/ процедура";
    }
    return "/ посещение";
  };

  const getPrimaryActionLabel = () => {
    if (tab === "recovery") return "Заяви час";
    if (tab === "shop") return "Запитване";
    return "Запиши се";
  };

  const categoryLabel =
    item.sessionType || item.category || item.type || "Услуга";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="public-portal-shell flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl md:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-white shadow-2xl [&>button:last-child]:top-3.5 [&>button:last-child]:right-4 [&>button:last-child]:z-20 [&>button:last-child]:flex [&>button:last-child]:size-8 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-full [&>button:last-child]:border [&>button:last-child]:border-white/15 [&>button:last-child]:bg-black/70 [&>button:last-child]:text-zinc-200 [&>button:last-child]:backdrop-blur-md [&>button:last-child]:hover:bg-black/90 [&>button:last-child]:hover:text-white">
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain min-h-0">
          {images.length > 0 ? (
            <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-zinc-900">
              {images.map((imgUrl: string, idx: number) => (
                <Image
                  key={`${imgUrl}-${idx}`}
                  src={imgUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized={
                    imgUrl.startsWith("/zones/") ||
                    imgUrl.endsWith(".webp") ||
                    imgUrl.startsWith("/api/") ||
                    imgUrl.includes("/api/upload") ||
                    imgUrl.startsWith("data:")
                  }
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    idx === activeImageIndex ? "opacity-100" : "opacity-0"
                  )}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
            </div>
          ) : null}

          <div
            className={cn("p-4 sm:p-5", images.length > 0 && "-mt-10 relative")}
          >
            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="mb-2 text-xl sm:text-2xl leading-tight font-bold text-white">
                  {item.name}
                </DialogTitle>
                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div
                    className={cn(
                      "text-xl font-bold tracking-tight",
                      isRecovery ? "text-emerald-400" : "text-blue-400"
                    )}
                  >
                    {hasValidPrice ? (
                      <>
                        <span>{formatPrice(item.price)}</span>
                        <span className="text-xs font-normal text-zinc-400 ml-1">
                          {getPriceSuffix()}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-zinc-300 italic">
                        Цена при запитване
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onCopyLink}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span>Копирано</span>
                        </>
                      ) : (
                        <>
                          <Link2 size={14} />
                          <span>Копирай линк</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (tab === "recovery" && onRecoveryInquiry) {
                          onClose();
                          onRecoveryInquiry(item);
                        } else {
                          onInquiry(item);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-bold tracking-widest text-white uppercase shadow-lg transition-colors cursor-pointer",
                        isRecovery
                          ? "bg-emerald-700 shadow-emerald-700/20 hover:bg-emerald-600"
                          : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-500"
                      )}
                    >
                      <MessageSquare size={16} />
                      <span>{getPrimaryActionLabel()}</span>
                    </button>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5">
              {/* Parameters & Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                >
                  Категория: {categoryLabel}
                </Badge>

                {(item.durationMinutes || item.duration) && (
                  <Badge
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                  >
                    Продължителност: {item.durationMinutes || item.duration}{" "}
                    мин.
                  </Badge>
                )}

                {item.athleteCount && (
                  <Badge
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                  >
                    Капацитет: {item.athleteCount}{" "}
                    {Number(item.athleteCount) === 1 ? "спортист" : "спортисти"}
                  </Badge>
                )}

                {item.zones && (
                  <Badge
                    variant="outline"
                    className="border-cyan-800 bg-cyan-950/60 px-3 py-1 text-xs text-cyan-300"
                  >
                    Зони:{" "}
                    {Array.from(
                      new Set(
                        (Array.isArray(item.zones) ? item.zones : [item.zones])
                          .map((z: unknown) => String(z ?? "").trim())
                          .filter(Boolean)
                      )
                    ).join(", ")}
                  </Badge>
                )}

                {tab === "shop" && typeof item.stock === "number" && (
                  <ProductStockBadge
                    stock={item.stock}
                    threshold={item.restockThreshold}
                  />
                )}
              </div>

              <DialogDescription className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                {item.description ||
                  "Няма допълнително описание за този артикул."}
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
