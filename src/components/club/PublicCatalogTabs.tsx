/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  Calendar,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Dumbbell,
  Eye,
  Link2,
  MessageSquare,
  Package,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CATALOG_SECTIONS,
  CatalogSectionId,
} from "@/components/catalogs/catalog-sections";
import { ProductStockBadge } from "@/components/catalogs/views/ShopCatalogView";
import { CatalogInquiryDialog } from "@/components/club/CatalogInquiryDialog";
import { RecoveryInquiryDialog } from "@/components/recovery/RecoveryInquiryDialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/currency";
import { cn, sanitizeImageUrl } from "@/lib/utils";

export type PublicCatalogTab =
  "trainings" | "club-services" | "recovery" | "shop" | "general" | "products";

export interface PublicCatalogTabsProps {
  trainings?: any[];
  clubServices?: any[];
  generalServices?: any[];
  recoveryServices?: any[];
  recovery?: any[];
  products?: any[];
  shop?: any[];
  allowedTabs?: (CatalogSectionId | "general" | "products")[];
  onRecoveryInquiry?: (item: any) => void;
}

const cleanUrl = (src: string) => {
  if (!src) return "";
  const sanitized = sanitizeImageUrl(src);
  return sanitized || "";
};

export default function PublicCatalogTabs({
  trainings = [],
  clubServices = [],
  generalServices = [],
  recoveryServices = [],
  recovery = [],
  products = [],
  shop = [],
  allowedTabs,
  onRecoveryInquiry,
}: PublicCatalogTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Consolidate prop aliases
  const actualTrainings = trainings;
  const actualClubServices =
    clubServices.length > 0 ? clubServices : generalServices;
  const actualRecovery =
    recoveryServices.length > 0 ? recoveryServices : recovery;
  const actualShop = shop.length > 0 ? shop : products;

  // Normalize initial tab from URL params if present
  const categoryParam = (searchParams.get("category") ||
    searchParams.get("section") ||
    "") as PublicCatalogTab;
  const initialTab: CatalogSectionId = useMemo(() => {
    if (categoryParam === "club-services" || categoryParam === "general")
      return "club-services";
    if (categoryParam === "recovery") return "recovery";
    if (categoryParam === "shop" || categoryParam === "products") return "shop";
    if (categoryParam === "trainings") return "trainings";
    return "trainings";
  }, [categoryParam]);

  const [activeTab, setActiveTab] = useState<CatalogSectionId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Sync tab with URL if external navigation occurs
  useEffect(() => {
    if (categoryParam) {
      if (
        (categoryParam === "club-services" || categoryParam === "general") &&
        activeTab !== "club-services"
      ) {
        setActiveTab("club-services");
      } else if (categoryParam === "recovery" && activeTab !== "recovery") {
        setActiveTab("recovery");
      } else if (
        (categoryParam === "shop" || categoryParam === "products") &&
        activeTab !== "shop"
      ) {
        setActiveTab("shop");
      } else if (categoryParam === "trainings" && activeTab !== "trainings") {
        setActiveTab("trainings");
      }
    }
  }, [categoryParam, activeTab]);

  // Deep-link scroll into view when item param is present
  const itemParam = searchParams.get("item");
  useEffect(() => {
    if (itemParam) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`item-${itemParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [itemParam, activeTab]);

  // Update URL helper without full page reloads
  const updateTabInUrl = (newTab: CatalogSectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", newTab);
    params.delete("item"); // reset targeted item when switching tabs
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleTabChange = (tabId: CatalogSectionId) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setSelectedCategory("all");
    updateTabInUrl(tabId);
  };

  // Determine active dataset
  const activeDataset = useMemo(() => {
    switch (activeTab) {
      case "trainings":
        return actualTrainings;
      case "club-services":
        return actualClubServices;
      case "recovery":
        return actualRecovery;
      case "shop":
        return actualShop;
    }
  }, [
    activeTab,
    actualTrainings,
    actualClubServices,
    actualRecovery,
    actualShop,
  ]);

  // Extract counts for each section
  const sectionCounts = useMemo(() => {
    return {
      trainings: actualTrainings.length,
      "club-services": actualClubServices.length,
      recovery: actualRecovery.length,
      shop: actualShop.length,
    };
  }, [actualTrainings, actualClubServices, actualRecovery, actualShop]);

  // Extract unique categories for active tab filtering
  const categories = useMemo(() => {
    if (!activeDataset) return ["all"];
    const cats = new Set<string>();
    activeDataset.forEach((item) => {
      const cat = item.category || item.type || item.sessionType;
      if (cat && typeof cat === "string" && cat.trim()) {
        cats.add(cat.trim());
      }
    });
    return ["all", ...Array.from(cats)];
  }, [activeDataset]);

  // Filter items by search query and category
  const filteredItems = useMemo(() => {
    if (!activeDataset) return [];
    const q = searchQuery.toLowerCase().trim();

    const filtered = activeDataset.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const cat = (
        item.category ||
        item.type ||
        item.sessionType ||
        ""
      ).toLowerCase();

      const matchesSearch =
        !q || name.includes(q) || desc.includes(q) || cat.includes(q);

      const itemCat = item.category || item.type || item.sessionType || "";
      const matchesCategory =
        selectedCategory === "all" || itemCat === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const catA = (a.category || a.type || "").toLowerCase();
      const catB = (b.category || b.type || "").toLowerCase();
      if (catA < catB) return -1;
      if (catA > catB) return 1;

      const priceA = typeof a.price === "number" ? a.price : 0;
      const priceB = typeof b.price === "number" ? b.price : 0;
      return priceA - priceB;
    });
  }, [activeDataset, searchQuery, selectedCategory]);

  const handleCopyLink = (item: any) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?category=${activeTab}&item=${item.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedItemId(item.id);
          toast.success(`Директният линк за "${item.name}" е копиран!`);
          setTimeout(() => setCopiedItemId(null), 2500);
        })
        .catch(() => {
          toast.error("Неуспешно копиране на линк.");
        });
    } else {
      setCopiedItemId(item.id);
      toast.success(`Линк: ${url}`);
      setTimeout(() => setCopiedItemId(null), 2500);
    }
  };

  const visibleSections = useMemo(() => {
    if (!allowedTabs) return CATALOG_SECTIONS;
    const normalizedAllowed = allowedTabs.map((t) => {
      if (t === "general") return "club-services";
      if (t === "products") return "shop";
      return t;
    });
    return CATALOG_SECTIONS.filter((s) => normalizedAllowed.includes(s.id));
  }, [allowedTabs]);

  return (
    <div className="space-y-5">
      {/* Golden Hybrid 4-Section Navigation Bar */}
      <nav
        aria-label="Навигация в клубни каталози"
        className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-1.5 backdrop-blur-md"
      >
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeTab === section.id;
          const count = sectionCounts[section.id];

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleTabChange(section.id)}
              aria-current={isActive ? "page" : undefined}
              title={section.tooltip}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 sm:shrink",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-white"
                    : "text-zinc-400 group-hover:text-blue-400"
                )}
              />
              <span>{section.label}</span>
              {typeof count === "number" && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            placeholder="Търсене по име, описание или категория..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl border-zinc-800 bg-zinc-900/60 pl-9 pr-8 text-xs text-white placeholder:text-zinc-500 focus-visible:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
              title="Изчисти търсенето"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        {categories.length > 2 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase shrink-0">
              Категория:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-xs"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                )}
              >
                {cat === "all" ? "Всички" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Grid View */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, itemIdx) => (
            <PublicCatalogCard
              key={item.id}
              item={item}
              index={itemIdx}
              tab={activeTab}
              isSelected={itemParam === item.id}
              isCopied={copiedItemId === item.id}
              onCopyLink={() => handleCopyLink(item)}
              onRecoveryInquiry={onRecoveryInquiry}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-16 text-center text-zinc-400">
          <Package className="mb-2.5 size-9 text-zinc-600" strokeWidth={1.5} />
          <p className="text-sm font-medium text-zinc-300">
            Няма намерени артикули в този каталог.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Опитайте с друго търсене или изчистете избраната категория.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Golden Hybrid Public Catalog Card
// ---------------------------------------------------------------------------
function PublicCatalogCard({
  item,
  index = 0,
  tab,
  isSelected,
  isCopied,
  onCopyLink,
  onRecoveryInquiry,
}: {
  item: any;
  index?: number;
  tab: CatalogSectionId;
  isSelected?: boolean;
  isCopied?: boolean;
  onCopyLink: () => void;
  onRecoveryInquiry?: (item: any) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  // Extract images and zone fallbacks
  const images = useMemo(() => {
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
      if (hasArms) return ["/zones/arm.png"];
      if (hasLegs) return ["/zones/legs.webp"];
    }
    return [];
  }, [item.imageUrl, item.name, item.zones, tab]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Carousel cycle if multiple images
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const hasLongDesc = (item.description?.length || 0) > 110;
  const isSubscription = [
    "Абонамент",
    "Годишен абонамент",
    "Членски внос",
  ].includes(item.type);

  // Type styling badge
  const getTypeBadge = () => {
    if (tab === "shop") {
      return {
        label: item.category || "Стока",
        bg: "border-purple-500/30 bg-purple-500/10 text-purple-300",
        icon: <Package className="size-3 text-purple-400 shrink-0" />,
      };
    }

    if (tab === "club-services") {
      const pricingUnit = item.pricingUnit;
      const unitLabel =
        pricingUnit === "per_hour"
          ? "На час"
          : pricingUnit === "per_session"
            ? "На сесия"
            : item.category || "Услуга";
      return {
        label: unitLabel,
        bg: "border-blue-500/30 bg-blue-500/10 text-blue-300",
        icon: <Wrench className="size-3 text-blue-400 shrink-0" />,
      };
    }

    if (tab === "recovery") {
      return {
        label: item.sessionType || item.category || "Възстановяване",
        bg: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        icon: <Zap className="size-3 text-cyan-400 shrink-0" />,
      };
    }

    // Default: trainings
    switch (item.type) {
      case "Членски внос":
        return {
          label: item.type,
          bg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          icon: <UserCheck className="size-3 text-emerald-400 shrink-0" />,
        };
      case "Годишен абонамент":
        return {
          label: item.type,
          bg: "border-purple-500/30 bg-purple-500/10 text-purple-300",
          icon: <Sparkles className="size-3 text-purple-400 shrink-0" />,
        };
      case "Абонамент":
        return {
          label: item.type,
          bg: "border-blue-500/30 bg-blue-500/10 text-blue-300",
          icon: <Calendar className="size-3 text-blue-400 shrink-0" />,
        };
      case "Еднократно плащане":
        return {
          label: item.type,
          bg: "border-amber-500/30 bg-amber-500/10 text-amber-300",
          icon: <Zap className="size-3 text-amber-400 shrink-0" />,
        };
      default:
        return {
          label: item.type || item.category || "Тренировка",
          bg: "border-zinc-700 bg-zinc-800 text-zinc-300",
          icon: <Dumbbell className="size-3 text-zinc-400 shrink-0" />,
        };
    }
  };

  const typeBadge = getTypeBadge();

  // Price formatting suffix
  const getPriceSuffix = () => {
    if (tab === "shop") return "";
    if (isSubscription) {
      return `/ ${item.billingPeriod?.toLowerCase().replace("ен", "ца") || "месец"}`;
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

  // Primary action button label
  const getPrimaryActionLabel = () => {
    if (tab === "recovery") return "Заяви час";
    if (tab === "shop") return "Запитване";
    return "Запиши се";
  };

  return (
    <BentoCard
      id={`item-${item.id}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-zinc-900/90 p-0 shadow-xs transition-all duration-300 hover:border-zinc-700 hover:shadow-md",
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/60 shadow-lg bg-blue-950/20"
          : "border-zinc-800/80"
      )}
    >
      {/* Top Media Banner or Sleek Compact Header */}
      {images.length > 0 ? (
        <div className="relative h-36 sm:h-40 w-full overflow-hidden border-b border-zinc-800/60 bg-zinc-950">
          {images.map((imgUrl: string, idx: number) => (
            <Image
              key={imgUrl}
              src={imgUrl}
              alt={`${item.name} - ${idx + 1}`}
              priority={index < 2 && idx === 0}
              fill
              unoptimized={
                imgUrl.startsWith("/api/") ||
                imgUrl.includes("/api/upload") ||
                imgUrl.startsWith("data:")
              }
              sizes="(max-width: 768px) 100vw, 33vw"
              className={cn(
                "absolute inset-0 object-contain p-2 transition-all duration-700 group-hover:scale-105",
                idx === activeImageIndex
                  ? "z-0 scale-100 opacity-100"
                  : "-z-10 scale-95 opacity-0"
              )}
            />
          ))}

          {/* Type Badge & Stock on Image */}
          <div className="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md shadow-2xs",
                typeBadge.bg
              )}
            >
              {typeBadge.icon}
              <span>{typeBadge.label}</span>
            </span>

            {tab === "shop" && typeof item.stock === "number" && (
              <ProductStockBadge
                stock={item.stock}
                threshold={item.restockThreshold}
              />
            )}
          </div>

          {/* Quick Copy Link Button */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 shadow-2xs backdrop-blur-md transition-all hover:bg-zinc-800 hover:text-white cursor-pointer"
              title={`Копирай директен линк към ${item.name}`}
              aria-label={`Копирай директен линк към ${item.name}`}
            >
              {isCopied ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Link2 size={13} />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Compact 38px Header when NO Image */
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                typeBadge.bg
              )}
            >
              {typeBadge.icon}
              <span>{typeBadge.label}</span>
            </span>

            {tab === "shop" && typeof item.stock === "number" && (
              <ProductStockBadge
                stock={item.stock}
                threshold={item.restockThreshold}
              />
            )}
          </div>

          {/* Quick Copy Link Button */}
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-2xs transition-all hover:border-zinc-700 hover:text-white cursor-pointer"
            title={`Копирай директен линк към ${item.name}`}
            aria-label={`Копирай директен линк към ${item.name}`}
          >
            {isCopied ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Link2 size={13} />
            )}
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="space-y-2.5">
          {/* Title - Fully readable without clipping */}
          <div>
            <h2 className="text-sm font-bold text-white transition-colors group-hover:text-blue-400 sm:text-base leading-snug">
              {item.name}
            </h2>

            {/* Target Groups / Category tags */}
            {item.targetGroups && item.targetGroups.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {item.targetGroups.map((group: string) => (
                  <span
                    key={group}
                    className="rounded-md border border-zinc-800 bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-zinc-400 uppercase"
                  >
                    {group}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description - readable without truncation, expandable if very long */}
          {item.description && (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-xs leading-relaxed text-zinc-300",
                  !isExpanded && hasLongDesc && "line-clamp-3"
                )}
              >
                {item.description}
              </p>
              {hasLongDesc && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  <span>
                    {isExpanded ? "Свий описанието" : "Виж цялото описание"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Recovery Zones if present */}
          {item.zones && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(Array.isArray(item.zones) ? item.zones : [item.zones]).map(
                (zone: string) => (
                  <span
                    key={zone}
                    className="rounded-full border border-cyan-800/50 bg-cyan-950/40 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-cyan-300 uppercase"
                  >
                    {zone}
                  </span>
                )
              )}
            </div>
          )}

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-zinc-800/80 pt-2.5 text-[11px] text-zinc-400">
            {/* Duration */}
            {item.durationMinutes || item.duration ? (
              <div className="flex items-center gap-1.5">
                <Clock
                  className="size-3 shrink-0 text-zinc-500"
                  strokeWidth={1.5}
                />
                <span>{item.durationMinutes || item.duration} мин.</span>
              </div>
            ) : null}

            {/* Athlete capacity */}
            {item.athleteCount ? (
              <div className="flex items-center gap-1.5">
                <Users
                  className="size-3 shrink-0 text-zinc-500"
                  strokeWidth={1.5}
                />
                <span>
                  {item.athleteCount}{" "}
                  {item.athleteCount > 1 ? "спортисти" : "спортист"}
                </span>
              </div>
            ) : null}

            {/* Subscription Period */}
            {isSubscription && (
              <div className="flex items-center gap-1.5">
                <CreditCard
                  className="size-3 shrink-0 text-zinc-500"
                  strokeWidth={1.5}
                />
                <span className="truncate">
                  {item.billingPeriod || "Месечен"} период
                </span>
              </div>
            )}

            {/* Recovery Days */}
            {tab === "recovery" && (
              <div className="flex items-center gap-1.5">
                <Calendar
                  className="size-3 shrink-0 text-zinc-500"
                  strokeWidth={1.5}
                />
                <span>
                  {item.numberOfDays || 1} дни / {item.proceduresPerDay || 1}{" "}
                  проц./ден
                </span>
              </div>
            )}

            {/* Court / Club Service unit */}
            {tab === "club-services" && item.pricingUnit && (
              <div className="flex items-center gap-1.5">
                <Wrench
                  className="size-3 shrink-0 text-zinc-500"
                  strokeWidth={1.5}
                />
                <span>
                  {item.pricingUnit === "per_hour" ? "На час" : "Фиксирана"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area: Price and Actions */}
        <div className="mt-3.5 border-t border-zinc-800/80 pt-3">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {typeof item.price === "number" && item.price > 0
                  ? formatPrice(item.price)
                  : "0,00 €"}
              </span>
              <span className="ml-1 text-[11px] font-medium text-zinc-400">
                {getPriceSuffix()}
              </span>
            </div>
          </div>

          {/* Action Buttons: 1-click Inquiry + Details Modal */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                if (tab === "recovery" && onRecoveryInquiry) {
                  onRecoveryInquiry(item);
                } else {
                  setIsInquiryOpen(true);
                }
              }}
              className="h-8.5 rounded-xl bg-blue-600 text-[11px] font-semibold tracking-wide text-white shadow-xs transition-colors hover:bg-blue-500 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {tab === "recovery" ? (
                <CalendarCheck size={13} />
              ) : (
                <MessageSquare size={13} />
              )}
              <span>{getPrimaryActionLabel()}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-8.5 rounded-xl border-zinc-700 bg-zinc-800/80 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} />
              <span>Детайли</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl md:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-white shadow-2xl [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 [&>button:last-child]:text-zinc-400 [&>button:last-child]:hover:text-white [&>button:last-child]:z-10">
          <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain min-h-0">
            {images.length > 0 ? (
              <div className="relative h-48 sm:h-56 w-full bg-black">
                {images.map((imgUrl: string, idx: number) => (
                  <Image
                    key={imgUrl}
                    src={imgUrl}
                    alt={item.name}
                    fill
                    unoptimized={
                      imgUrl.startsWith("/api/") ||
                      imgUrl.includes("/api/upload") ||
                      imgUrl.startsWith("data:")
                    }
                    className={cn(
                      "object-contain p-2 transition-opacity duration-500",
                      idx === activeImageIndex ? "opacity-100" : "opacity-0"
                    )}
                  />
                ))}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
              </div>
            ) : null}

            <div
              className={cn(
                "p-4 sm:p-5",
                images.length > 0 && "-mt-10 relative"
              )}
            >
              <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="mb-2 text-xl sm:text-2xl leading-tight font-bold text-white">
                    {item.name}
                  </DialogTitle>
                  <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="text-xl font-bold tracking-tight text-blue-400">
                      <span>
                        {typeof item.price === "number" && item.price > 0
                          ? formatPrice(item.price)
                          : "0,00 €"}
                      </span>
                      <span className="text-xs font-normal text-zinc-400 ml-1">
                        {getPriceSuffix()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        if (tab === "recovery" && onRecoveryInquiry) {
                          onRecoveryInquiry(item);
                        } else {
                          setIsInquiryOpen(true);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>{getPrimaryActionLabel()}</span>
                    </button>
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
                    Категория: {typeBadge.label}
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
                      Капацитет: {item.athleteCount} спортисти
                    </Badge>
                  )}

                  {item.zones && (
                    <Badge
                      variant="outline"
                      className="border-cyan-800 bg-cyan-950/60 px-3 py-1 text-xs text-cyan-300"
                    >
                      Зони:{" "}
                      {Array.isArray(item.zones)
                        ? item.zones.join(", ")
                        : item.zones}
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

      {/* Public Inquiry Dialog */}
      {tab === "recovery" ? (
        <RecoveryInquiryDialog
          isOpen={isInquiryOpen}
          onClose={() => setIsInquiryOpen(false)}
          procedure={{
            title: item.name || "Възстановителна процедура",
            category: item.sessionType || item.category,
            duration: String(item.durationMinutes || item.duration || ""),
            price:
              typeof item.price === "number" ? formatPrice(item.price) : "",
            preferredZone: Array.isArray(item.zones)
              ? item.zones[0]
              : item.zones || undefined,
          }}
        />
      ) : (
        <CatalogInquiryDialog
          isOpen={isInquiryOpen}
          onClose={() => setIsInquiryOpen(false)}
          item={item}
          tab={tab}
          lang="bg"
        />
      )}
    </BentoCard>
  );
}
