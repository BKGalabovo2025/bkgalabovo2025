/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Activity,
  Package,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Zap,
  Clock,
  Users,
  Calendar,
} from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Eye } from "lucide-react";

type CatalogTab = "trainings" | "general" | "products" | "recovery";

interface PublicCatalogTabsProps {
  trainings: any[];
  generalServices: any[];
  products: any[];
  recoveryServices?: any[];
  allowedTabs?: CatalogTab[];
}

export default function PublicCatalogTabs({
  trainings,
  generalServices,
  products,
  recoveryServices = [],
  allowedTabs = ["trainings", "general", "products", "recovery"],
}: PublicCatalogTabsProps) {
  const [activeTab, setActiveTab] = useState<CatalogTab>(
    allowedTabs[0] || "trainings"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Determine active dataset
  const activeDataset = useMemo(() => {
    switch (activeTab) {
      case "trainings":
        return trainings;
      case "general":
        return generalServices;
      case "products":
        return products;
      case "recovery":
        return recoveryServices;
    }
  }, [activeTab, trainings, generalServices, products, recoveryServices]);

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    if (!activeDataset) return ["all"];
    const cats = new Set<string>();
    activeDataset.forEach((item) => {
      if (item.category) {
        cats.add(item.category);
      } else if (item.type) {
        cats.add(item.type);
      }
    });
    return ["all", ...Array.from(cats)];
  }, [activeDataset]);

  // Filter items by search query and category
  const filteredItems = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const itemCat = item.category || item.type || "";
      const matchesCategory =
        selectedCategory === "all" || itemCat === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeDataset, searchQuery, selectedCategory]);

  // Reset filters when tab changes
  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="space-y-8">
      {/* Search and Navigation Bar */}
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-md md:flex-row">
        {/* Tabs switcher */}
        <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-1 lg:flex lg:w-auto lg:items-center">
          {allowedTabs.includes("trainings") && (
            <button
              onClick={() => handleTabChange("trainings")}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 sm:flex-row sm:gap-2 sm:px-6 sm:py-3 sm:text-xs ${
                activeTab === "trainings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
              }`}
            >
              <Trophy size={16} className="sm:size-4" />
              Тренировки
            </button>
          )}
          {allowedTabs.includes("general") && (
            <button
              onClick={() => handleTabChange("general")}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 sm:flex-row sm:gap-2 sm:px-6 sm:py-3 sm:text-xs ${
                activeTab === "general"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
              }`}
            >
              <Activity size={16} className="sm:size-4" />
              Клубни Услуги
            </button>
          )}
          {allowedTabs.includes("products") && (
            <button
              onClick={() => handleTabChange("products")}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 sm:flex-row sm:gap-2 sm:px-6 sm:py-3 sm:text-xs ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
              }`}
            >
              <Package size={16} className="sm:size-4" />
              Магазин
            </button>
          )}
          {allowedTabs.includes("recovery") && (
            <button
              onClick={() => handleTabChange("recovery")}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 sm:flex-row sm:gap-2 sm:px-6 sm:py-3 sm:text-xs ${
                activeTab === "recovery"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
              }`}
            >
              <Zap size={16} className="sm:size-4" />
              Възстановяване
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="mr-2 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
            Категория:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-all ${
                selectedCategory === cat
                  ? "border-white bg-white text-zinc-950"
                  : "border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {cat === "all" ? "Всички" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Catalog Grid View */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <CatalogCard key={item.id} item={item} tab={activeTab} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/10 py-20 text-zinc-400">
          <ShoppingBag
            className="mb-3 size-10 text-zinc-700"
            strokeWidth={1.5}
          />
          <p className="text-sm font-light">Няма намерени артикули.</p>
        </div>
      )}
    </div>
  );
}

function CatalogCard({ item, tab }: { item: any; tab: CatalogTab }) {
  const images = useMemo(() => {
    if (!item.imageUrl) {
      // Default fallback images for specific zones
      const hasPelvis =
        item.name?.toLowerCase().includes("таз") ||
        item.zones?.includes("ТАЗ") ||
        item.zones === "ТАЗ";
      const hasArms =
        item.name?.toLowerCase().includes("ръце") ||
        item.name?.toLowerCase().includes("ръка") ||
        item.zones?.includes("РЪЦЕ") ||
        item.zones === "РЪЦЕ";
      const hasLegs =
        item.name?.toLowerCase().includes("крака") ||
        item.name?.toLowerCase().includes("крак") ||
        item.zones?.includes("КРАКА") ||
        item.zones === "КРАКА";

      if (hasPelvis) return ["/zones/pelvis.webp"];
      if (hasArms) return ["/zones/arm.png"];
      if (hasLegs) return ["/zones/legs.webp"];

      return [];
    }
    return item.imageUrl.split(",").filter(Boolean);
  }, [item.imageUrl, item.name, item.zones]);

  const displayMode = item.imageDisplayMode || "collage";
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-rotate for carousel
  React.useEffect(() => {
    if (displayMode !== "carousel" || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayMode, images.length]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getZonesDisplayText = () => {
    if (!item.zones) return null;
    if (Array.isArray(item.zones)) {
      if (item.zones.length === 3)
        return `Зона по избор (${item.zones.join(", ")})`;
      return `Зони: ${item.zones.join(", ")}`;
    }
    return `Зони: ${item.zones}`;
  };

  // Badges logic depending on the item type
  const renderBadges = () => {
    if (tab === "products") {
      const isOutOfStock = item.stock <= 0;
      const isLowStock =
        item.stock > 0 && item.stock <= (item.restockThreshold || 5);

      if (isOutOfStock) {
        return (
          <Badge className="border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-rose-400 uppercase shadow-none">
            Изчерпан
          </Badge>
        );
      }
      if (isLowStock) {
        return (
          <Badge className="border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-amber-400 uppercase shadow-none">
            Ограничен ({item.stock} бр.)
          </Badge>
        );
      }
      return (
        <Badge className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-emerald-400 uppercase shadow-none">
          В наличност
        </Badge>
      );
    }

    // For training / services
    const category = item.category || item.type || "";
    if (category) {
      return (
        <Badge className="border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-blue-400 uppercase shadow-none">
          {category}
        </Badge>
      );
    }

    return null;
  };

  const getTabIcon = (currentTab: string) => {
    if (currentTab === "trainings")
      return <Trophy className="size-12 opacity-35" strokeWidth={1} />;
    if (currentTab === "general")
      return <Activity className="size-12 opacity-35" strokeWidth={1} />;
    if (currentTab === "recovery")
      return <Zap className="size-12 opacity-35" strokeWidth={1} />;
    return <ShoppingBag className="size-12 opacity-35" strokeWidth={1} />;
  };

  const getTabLabel = (currentTab: string) => {
    if (currentTab === "trainings") return "Тренировка";
    if (currentTab === "general") return "Услуга";
    if (currentTab === "recovery") return "Възстановяване";
    return "Магазин";
  };

  const renderImages = () => {
    if (images.length === 0) {
      return (
        <div className="flex size-full flex-col items-center justify-center bg-zinc-900/40 text-zinc-700">
          {getTabIcon(tab)}
          <span className="mt-3 text-[9px] font-semibold tracking-widest uppercase opacity-40">
            Няма снимка
          </span>
        </div>
      );
    }

    if (displayMode === "collage") {
      return (
        <div className="flex size-full">
          {images.map((imgUrl: string, idx: number) => (
            <div
              key={imgUrl}
              className="relative h-full overflow-hidden"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={imgUrl}
                alt={`${item.name} - ${idx + 1}`}
                fill
                priority={true}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {idx > 0 && (
                <div className="absolute inset-y-0 left-0 z-10 w-px bg-white/20" />
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
        <Image
          src={images[activeImgIndex]}
          alt={item.name}
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={true}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          fill
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute top-1/2 left-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-zinc-800"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImg}
              className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-zinc-800"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImgIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <BentoCard className="group relative flex h-full min-h-105 flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900 shadow-none transition-all duration-500 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-blue-900/5">
      {/* Product Image section with navigation */}
      <div className="relative flex h-56 w-full shrink-0 items-center justify-center overflow-hidden border-b border-zinc-800/60 bg-zinc-950">
        {renderImages()}

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10">{renderBadges()}</div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {(item.category || item.sessionType) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {item.category && (
                <span className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                  {item.category}
                </span>
              )}
              {item.sessionType && (
                <span className="rounded-md bg-cyan-900/30 px-2 py-0.5 text-[9px] font-black tracking-widest text-cyan-500 uppercase">
                  {item.sessionType}
                </span>
              )}
            </div>
          )}
          <h2 className="flex min-h-10 items-center text-base leading-snug font-semibold text-white transition-colors duration-300 group-hover:text-blue-400">
            {item.name}
          </h2>
          <p className="mt-3 line-clamp-3 min-h-14 text-xs leading-relaxed font-light text-zinc-400">
            {item.description || "Няма предоставено описание за този артикул."}
          </p>

          {/* Zones */}
          {item.zones && (
            <div className="flex flex-wrap gap-2 pt-3">
              {(() => {
                const zText = getZonesDisplayText();
                if (!zText) return null;
                return (
                  <span className="rounded-full border border-cyan-900/50 bg-cyan-950/40 px-3 py-1 text-[10px] font-medium tracking-wider text-cyan-400 uppercase">
                    {zText}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Features */}
          <div className="mt-4 space-y-3 border-t border-zinc-800/50 pt-4">
            {(item.duration || item.durationMinutes) && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Clock className="size-4 text-zinc-500" strokeWidth={1.5} />
                <span>{item.duration || item.durationMinutes} минути</span>
              </div>
            )}
            {item.athleteCount && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Users className="size-4 text-zinc-500" strokeWidth={1.5} />
                <span>{item.athleteCount} спортисти</span>
              </div>
            )}
            {(item.numberOfDays || 1) >= 1 && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Calendar className="size-4 text-zinc-500" strokeWidth={1.5} />
                <span>
                  {item.numberOfDays || 1} дни / {item.proceduresPerDay || 1}{" "}
                  процедури на ден
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pricing & Details bar */}
        <div className="mt-6 flex items-end justify-between border-t border-zinc-800/80 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold tracking-widest text-zinc-400 uppercase">
              Цена
            </span>
            <span className="text-xl font-medium tracking-tight text-white">
              {item.price > 0 ? `${item.price.toFixed(2)} EUR` : "По заявка"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex size-7 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
              title="Детайли"
            >
              <Eye size={14} />
            </button>
            <Badge className="flex items-center gap-1 border border-zinc-800/60 bg-zinc-950 px-2.5 py-1 text-[8px] font-medium tracking-wider text-zinc-400 uppercase shadow-none">
              {getTabLabel(tab)}
            </Badge>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="overflow-hidden border-zinc-800 bg-zinc-950 p-0 sm:max-w-150">
          <div className="relative h-64 w-full bg-black">
            {images.length > 0 ? (
              <Image
                src={images[0]}
                alt={item.name}
                fill
                className="object-cover opacity-80"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-zinc-900/40 text-zinc-700">
                <span className="text-[10px] font-semibold tracking-widest uppercase">
                  Няма снимка
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">{renderBadges()}</div>
          </div>

          <div className="relative -mt-16 p-6 md:p-8">
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="mb-2 text-2xl leading-tight font-bold text-white">
                  {item.name}
                </DialogTitle>
                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="text-xl font-medium tracking-tight text-blue-400">
                    {item.price > 0
                      ? item.price.toFixed(2) + " EUR"
                      : "По заявка"}
                  </div>
                  {(() => {
                    const pricePart =
                      item.price > 0
                        ? " (" + item.price.toFixed(2) + " EUR)"
                        : "";
                    const waMsg = encodeURIComponent(
                      "Здравейте, интересувам се от: " +
                        item.name +
                        pricePart +
                        ". Моля, свържете се с мен за уточняване на час."
                    );
                    return (
                      <a
                        href={"https://wa.me/359899829923?text=" + waMsg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Запиши се / Заяви
                      </a>
                    );
                  })()}
                </div>
              </DialogHeader>
            </div>

            <div className="custom-scrollbar max-h-75 space-y-6 overflow-y-auto pr-2">
              {/* Additional Metadata */}
              {(item.duration ||
                item.durationMinutes ||
                item.zones ||
                item.athleteCount ||
                (item.numberOfDays || 1) >= 1) && (
                <div className="flex flex-wrap gap-2">
                  {(item.duration || item.durationMinutes) && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                    >
                      Продължителност: {item.duration || item.durationMinutes}{" "}
                      мин
                    </Badge>
                  )}
                  {item.athleteCount && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                    >
                      Капацитет: {item.athleteCount} спортисти
                    </Badge>
                  )}
                  {(item.numberOfDays || 1) >= 1 && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                    >
                      {item.numberOfDays || 1} дни /{" "}
                      {item.proceduresPerDay || 1} процедури на ден
                    </Badge>
                  )}
                  {item.zones && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                    >
                      {getZonesDisplayText()}
                    </Badge>
                  )}
                </div>
              )}

              {/* Resources */}
              {item.requiredResources && (
                <div className="mt-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
                  <h4 className="mb-3 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Ресурси
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {(item.requiredResources.compressors ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        {item.requiredResources.compressors} компресора
                      </div>
                    )}
                    {(item.requiredResources.attachments?.arms ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="size-1.5 rounded-full bg-blue-400" />
                        {item.requiredResources.attachments?.arms} РЪЦЕ
                      </div>
                    )}
                    {(item.requiredResources.attachments?.legs ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="size-1.5 rounded-full bg-cyan-400" />
                        {item.requiredResources.attachments?.legs} КРАКА
                      </div>
                    )}
                    {(item.requiredResources.attachments?.hips ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="size-1.5 rounded-full bg-purple-400" />
                        {item.requiredResources.attachments?.hips} ТАЗ
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogDescription className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                {item.description ||
                  "Няма предоставено описание за този артикул."}
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BentoCard>
  );
}
