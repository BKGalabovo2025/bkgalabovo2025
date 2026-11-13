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
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  CATALOG_SECTIONS,
  CatalogSectionId,
} from "@/components/catalogs/catalog-sections";
import { ProductStockBadge } from "@/components/catalogs/views/ShopCatalogView";
import { Badge } from "@/components/ui/badge";

const CatalogInquiryDialog = dynamic(
  () =>
    import("@/components/club/CatalogInquiryDialog").then(
      (m) => m.CatalogInquiryDialog
    ),
  { ssr: false }
);

const RecoveryInquiryDialog = dynamic(
  () =>
    import("@/components/recovery/RecoveryInquiryDialog").then(
      (m) => m.RecoveryInquiryDialog
    ),
  { ssr: false }
);
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
import type { SiteSchedule } from "@/types/site.types";

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
  phone?: string;
  contraindications?: string[];
  schedule?: string | SiteSchedule | null;
  eventLocation?: string;
}

const cleanUrl = (src: string) => {
  if (!src) return "";
  const sanitized = sanitizeImageUrl(src);
  if (!sanitized) return "";
  if (sanitized.includes("/планове/") && sanitized.endsWith(".png")) {
    return sanitized.replace(/\.png$/, ".webp");
  }
  return sanitized;
};

function CatalogUrlSync({ onUrlSync }: { onUrlSync: () => void }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    onUrlSync();
  }, [searchKey, onUrlSync]);

  return null;
}

const normalizeTabId = (
  tab: CatalogSectionId | "general" | "products"
): CatalogSectionId => {
  if (tab === "general") return "club-services";
  if (tab === "products") return "shop";
  return tab;
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
  phone,
  contraindications,
  schedule,
  eventLocation,
}: PublicCatalogTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Consolidate prop aliases
  const actualTrainings = trainings;
  const actualClubServices =
    clubServices.length > 0 ? clubServices : generalServices;
  const actualRecovery =
    recoveryServices.length > 0 ? recoveryServices : recovery;
  const actualShop = shop.length > 0 ? shop : products;

  const normalizedAllowedTabs = useMemo(
    () => allowedTabs?.map(normalizeTabId),
    [allowedTabs]
  );

  const [activeTab, setActiveTab] = useState<CatalogSectionId>(() =>
    allowedTabs?.[0] ? normalizeTabId(allowedTabs[0]) : "trainings"
  );

  useEffect(() => {
    if (
      normalizedAllowedTabs &&
      normalizedAllowedTabs.length > 0 &&
      !normalizedAllowedTabs.includes(activeTab)
    ) {
      setActiveTab(normalizedAllowedTabs[0]);
    }
  }, [normalizedAllowedTabs, activeTab]);

  const isRecoveryTheme =
    (normalizedAllowedTabs?.length === 1 &&
      normalizedAllowedTabs[0] === "recovery") ||
    activeTab === "recovery";
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [openModalItemId, setOpenModalItemId] = useState<string | null>(null);
  const [openInquiryItemId, setOpenInquiryItemId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const allItemsWithTab = useMemo(() => {
    const entries: Array<{ item: any; tab: CatalogSectionId }> = [];
    const addItems = (items: any[], tab: CatalogSectionId) => {
      if (normalizedAllowedTabs && !normalizedAllowedTabs.includes(tab)) return;
      items.forEach((item) => {
        if (item?.id) entries.push({ item, tab });
      });
    };
    addItems(actualTrainings, "trainings");
    addItems(actualClubServices, "club-services");
    addItems(actualRecovery, "recovery");
    addItems(actualShop, "shop");
    return entries;
  }, [
    actualTrainings,
    actualClubServices,
    actualRecovery,
    actualShop,
    normalizedAllowedTabs,
  ]);

  const replaceUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      const nextUrl = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(window.history.state, "", nextUrl);
    },
    []
  );

  const syncFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const categoryParam = (params.get("category") ||
      params.get("section") ||
      "") as PublicCatalogTab;
    const itemParam = params.get("item");
    const inquireParam = params.get("inquire");

    if (categoryParam) {
      let resolvedTab: CatalogSectionId | null = null;
      if (categoryParam === "club-services" || categoryParam === "general") {
        resolvedTab = "club-services";
      } else if (categoryParam === "recovery") {
        resolvedTab = "recovery";
      } else if (categoryParam === "shop" || categoryParam === "products") {
        resolvedTab = "shop";
      } else if (categoryParam === "trainings") {
        resolvedTab = "trainings";
      }
      if (
        resolvedTab &&
        (!normalizedAllowedTabs || normalizedAllowedTabs.includes(resolvedTab))
      ) {
        setActiveTab(resolvedTab);
      }
    }

    if (inquireParam) {
      const matched = allItemsWithTab.find(
        (entry) => entry.item.id === inquireParam
      );
      if (matched) {
        setActiveTab(matched.tab);
        setSearchQuery("");
        setSelectedCategory("all");
        setSelectedItemId(matched.item.id);
        setOpenInquiryItemId(matched.item.id);
        setOpenModalItemId(null);
        return;
      }
    }

    if (itemParam) {
      const matched = allItemsWithTab.find(
        (entry) => entry.item.id === itemParam
      );
      if (matched) {
        setActiveTab(matched.tab);
        setSearchQuery("");
        setSelectedCategory("all");
        setSelectedItemId(matched.item.id);
        setOpenModalItemId(matched.item.id);
        setOpenInquiryItemId(null);
        setTimeout(() => {
          const el = document.getElementById(`item-${itemParam}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
        return;
      }
      setSelectedItemId(itemParam);
    } else {
      setSelectedItemId(null);
    }

    setOpenModalItemId(null);
    setOpenInquiryItemId(null);
  }, [allItemsWithTab, normalizedAllowedTabs]);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [syncFromUrl]);

  // Update URL helper without full page reloads
  const updateTabInUrl = (newTab: CatalogSectionId) => {
    const currentSearch =
      typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    params.set("category", newTab);
    params.delete("item"); // reset targeted item when switching tabs
    params.delete("inquire");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleTabChange = (tabId: CatalogSectionId) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setSelectedCategory("all");
    setOpenModalItemId(null);
    setOpenInquiryItemId(null);
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
      <Suspense fallback={null}>
        <CatalogUrlSync onUrlSync={syncFromUrl} />
      </Suspense>
      {/* Golden Hybrid 4-Section Navigation Bar */}
      <nav
        aria-label="Навигация в клубни каталози"
        className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/70"
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
                  ? isRecoveryTheme
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/30"
                    : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-zinc-400 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-white"
                    : isRecoveryTheme
                      ? "text-zinc-400 group-hover:text-emerald-400"
                      : "text-zinc-400 group-hover:text-blue-400"
                )}
              />
              <span>{section.label}</span>
              {typeof count === "number" && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
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
            className={cn(
              "h-9 rounded-xl border-zinc-800 bg-zinc-900/60 pl-9 pr-8 text-xs text-white placeholder:text-zinc-500",
              isRecoveryTheme
                ? "focus-visible:ring-emerald-500"
                : "focus-visible:ring-blue-500"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
              title="Изчисти търсенето"
              aria-label="Изчисти търсенето"
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
                    ? isRecoveryTheme
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-xs"
                      : "border-blue-500 bg-blue-500/20 text-blue-300 shadow-xs"
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
              isSelected={selectedItemId === item.id}
              isModalOpen={openModalItemId === item.id}
              onModalOpenChange={(open) => {
                if (open) {
                  setOpenModalItemId(item.id);
                  setOpenInquiryItemId(null);
                  replaceUrlParams({ item: item.id, inquire: null });
                } else {
                  setOpenModalItemId(null);
                  replaceUrlParams({ item: null });
                }
              }}
              isInquiryOpen={openInquiryItemId === item.id}
              onInquiryOpenChange={(open) => {
                if (open) {
                  setOpenInquiryItemId(item.id);
                  setOpenModalItemId(null);
                  replaceUrlParams({ inquire: item.id, item: null });
                } else {
                  setOpenInquiryItemId(null);
                  replaceUrlParams({ inquire: null });
                }
              }}
              isCopied={copiedItemId === item.id}
              onCopyLink={() => handleCopyLink(item)}
              onRecoveryInquiry={onRecoveryInquiry}
              phone={phone}
              contraindications={contraindications}
              procedures={actualRecovery}
              schedule={schedule}
              eventLocation={eventLocation}
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
  isModalOpen,
  onModalOpenChange,
  isInquiryOpen,
  onInquiryOpenChange,
  isCopied,
  onCopyLink,
  onRecoveryInquiry,
  phone,
  contraindications,
  procedures,
  schedule,
  eventLocation,
}: {
  item: any;
  index?: number;
  tab: CatalogSectionId;
  isSelected?: boolean;
  isModalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
  isInquiryOpen: boolean;
  onInquiryOpenChange: (open: boolean) => void;
  isCopied?: boolean;
  onCopyLink: () => void;
  onRecoveryInquiry?: (item: any) => void;
  phone?: string;
  contraindications?: string[];
  procedures?: Record<string, unknown>[];
  schedule?: string | SiteSchedule | null;
  eventLocation?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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
  const [isHovered, setIsHovered] = useState(false);

  // Carousel cycle on hover if multiple images
  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

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
      const periodMap: Record<string, string> = {
        месечен: "месец",
        годишен: "година",
        седмичен: "седмица",
        дневен: "ден",
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

  const hasValidPrice = typeof item.price === "number" && item.price > 0;
  const isRecovery = tab === "recovery";

  // Primary action button label
  const getPrimaryActionLabel = () => {
    if (tab === "recovery") return "Заяви час";
    if (tab === "shop") return "Запитване";
    return "Запиши се";
  };

  return (
    <BentoCard
      id={`item-${item.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImageIndex(0);
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-zinc-900/90 p-0 shadow-xs transition-colors duration-200 hover:border-zinc-700 hover:shadow-md",
        isSelected
          ? isRecovery
            ? "border-emerald-500 ring-2 ring-emerald-500/60 shadow-lg bg-emerald-950/20"
            : "border-blue-500 ring-2 ring-blue-500/60 shadow-lg bg-blue-950/20"
          : "border-zinc-800/80"
      )}
    >
      {/* Top Media Banner or Sleek Compact Header */}
      {images.length > 0 && images[activeImageIndex] ? (
        <div className="relative h-36 sm:h-40 w-full overflow-hidden border-b border-zinc-800/60 bg-zinc-950">
          <Image
            key={images[activeImageIndex]}
            src={images[activeImageIndex]}
            alt={`${item.name} - ${activeImageIndex + 1}`}
            priority={index === 0 && activeImageIndex === 0}
            decoding={index === 0 ? "sync" : "async"}
            fill
            unoptimized={
              images[activeImageIndex].endsWith(".webp") ||
              images[activeImageIndex].includes("/планове/") ||
              images[activeImageIndex].startsWith("/api/") ||
              images[activeImageIndex].includes("/api/upload") ||
              images[activeImageIndex].startsWith("data:")
            }
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 250px"
            className="absolute inset-0 object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />

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
            <h2
              className={cn(
                "text-sm font-bold text-white transition-colors sm:text-base leading-snug",
                isRecovery
                  ? "group-hover:text-emerald-400"
                  : "group-hover:text-blue-400"
              )}
            >
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
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer",
                    isRecovery
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-blue-400 hover:text-blue-300"
                  )}
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
              {Array.from<string>(
                new Set<string>(
                  (Array.isArray(item.zones) ? item.zones : [item.zones])
                    .map((z: unknown) => String(z ?? "").trim())
                    .filter(Boolean)
                )
              ).map((zone: string, zoneIdx: number) => (
                <span
                  key={`${zone}-${zoneIdx}`}
                  className="rounded-full border border-cyan-800/50 bg-cyan-950/40 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-cyan-300 uppercase"
                >
                  {zone}
                </span>
              ))}
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
              {hasValidPrice ? (
                <>
                  <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {formatPrice(item.price)}
                  </span>
                  <span className="ml-1 text-[11px] font-medium text-zinc-400">
                    {getPriceSuffix()}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-zinc-300 italic sm:text-base">
                  Цена при запитване
                </span>
              )}
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
                  onInquiryOpenChange(true);
                }
              }}
              className={cn(
                "h-8.5 rounded-xl text-[11px] font-semibold tracking-wide text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                isRecovery
                  ? "bg-emerald-700 hover:bg-emerald-600"
                  : "bg-blue-600 hover:bg-blue-500"
              )}
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
              onClick={() => onModalOpenChange(true)}
              className="h-8.5 rounded-xl border-zinc-700 bg-zinc-800/80 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} />
              <span>Детайли</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed Modal Dialog */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={onModalOpenChange}>
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
                              onModalOpenChange(false);
                              onRecoveryInquiry(item);
                            } else {
                              onInquiryOpenChange(true);
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
                        Капацитет: {item.athleteCount}{" "}
                        {Number(item.athleteCount) === 1
                          ? "спортист"
                          : "спортисти"}
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
                            (Array.isArray(item.zones)
                              ? item.zones
                              : [item.zones]
                            )
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
      )}

      {/* Public Inquiry Dialog */}
      {isInquiryOpen &&
        (tab === "recovery" ? (
          <RecoveryInquiryDialog
            isOpen={isInquiryOpen}
            onClose={() => onInquiryOpenChange(false)}
            phone={phone}
            contraindications={contraindications}
            procedures={procedures}
            schedule={schedule}
            eventLocation={eventLocation}
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
            onClose={() => onInquiryOpenChange(false)}
            item={item}
            tab={tab}
            lang="bg"
          />
        ))}
    </BentoCard>
  );
}
