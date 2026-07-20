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
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-3xl backdrop-blur-md">
        {/* Tabs switcher */}
        <div className="grid grid-cols-2 lg:flex lg:items-center p-1 bg-zinc-950/80 border border-zinc-800/50 rounded-2xl w-full lg:w-auto gap-1">
          {allowedTabs.includes("trainings") && (
            <button
              onClick={() => handleTabChange("trainings")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 w-full text-center ${
                activeTab === "trainings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Trophy size={16} className="sm:w-4 sm:h-4" />
              Тренировки
            </button>
          )}
          {allowedTabs.includes("general") && (
            <button
              onClick={() => handleTabChange("general")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 w-full text-center ${
                activeTab === "general"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Activity size={16} className="sm:w-4 sm:h-4" />
              Клубни Услуги
            </button>
          )}
          {allowedTabs.includes("products") && (
            <button
              onClick={() => handleTabChange("products")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 w-full text-center ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Package size={16} className="sm:w-4 sm:h-4" />
              Магазин
            </button>
          )}
          {allowedTabs.includes("recovery") && (
            <button
              onClick={() => handleTabChange("recovery")}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 w-full text-center ${
                activeTab === "recovery"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Zap size={16} className="sm:w-4 sm:h-4" />
              Възстановяване
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 items-center px-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mr-2">
            Категория:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                selectedCategory === cat
                  ? "bg-white text-zinc-950 border-white"
                  : "bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700"
              }`}
            >
              {cat === "all" ? "Всички" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Catalog Grid View */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <CatalogCard key={item.id} item={item} tab={activeTab} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
          <ShoppingBag
            className="h-10 w-10 text-zinc-700 mb-3"
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
    return item.imageUrl.split(",").filter(Boolean).map((url: string) => {
      let validUrl = url;
      if (validUrl.includes("\\public\\")) {
        validUrl = "/" + validUrl.split("\\public\\")[1].replace(/\\/g, "/");
      } else if (validUrl.includes("/public/")) {
        validUrl = "/" + validUrl.split("/public/")[1];
      }
      return validUrl;
    }).filter((url: string) => url.startsWith("/") || url.startsWith("http") || url.startsWith("data:"));
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
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-none text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border">
            Изчерпан
          </Badge>
        );
      }
      if (isLowStock) {
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-none text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border">
            Ограничен ({item.stock} бр.)
          </Badge>
        );
      }
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border">
          В наличност
        </Badge>
      );
    }

    // For training / services
    const category = item.category || item.type || "";
    if (category) {
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-none text-[9px] uppercase tracking-wider font-semibold px-2.5 py-0.5 border">
          {category}
        </Badge>
      );
    }

    return null;
  };

  const getTabIcon = (currentTab: string) => {
    if (currentTab === "trainings")
      return <Trophy className="h-12 w-12 opacity-35" strokeWidth={1} />;
    if (currentTab === "general")
      return <Activity className="h-12 w-12 opacity-35" strokeWidth={1} />;
    if (currentTab === "recovery")
      return <Zap className="h-12 w-12 opacity-35" strokeWidth={1} />;
    return <ShoppingBag className="h-12 w-12 opacity-35" strokeWidth={1} />;
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40 text-zinc-700">
          {getTabIcon(tab)}
          <span className="text-[9px] font-semibold uppercase tracking-widest opacity-40 mt-3">
            Няма снимка
          </span>
        </div>
      );
    }

    if (displayMode === "collage") {
      return (
        <div className="flex w-full h-full">
          {images.map((imgUrl: string, idx: number) => (
            <div
              key={imgUrl}
              className="h-full relative overflow-hidden"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={imgUrl}
                alt={`${item.name} - ${idx + 1}`}
                fill
                priority={true}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {idx > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/20 z-10" />
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
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          fill
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-zinc-900/80 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-zinc-800"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-zinc-900/80 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-zinc-800"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImgIndex === i ? "bg-white w-4" : "bg-white/40 w-1.5"
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
    <BentoCard className="group relative overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-none hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 rounded-3xl flex flex-col h-full min-h-[420px]">
      {/* Product Image section with navigation */}
      <div className="relative h-56 w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/60 shrink-0">
        {renderImages()}

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10">{renderBadges()}</div>
      </div>

      {/* Product Content Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {(item.category || item.sessionType) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.category && (
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
              )}
              {item.sessionType && (
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-900/30 px-2 py-0.5 rounded-md">
                  {item.sessionType}
                </span>
              )}
            </div>
          )}
          <h2 className="text-base font-semibold leading-snug text-white group-hover:text-blue-400 transition-colors duration-300 min-h-10 flex items-center">
            {item.name}
          </h2>
          <p className="text-zinc-400 text-xs font-light leading-relaxed mt-3 line-clamp-3 min-h-14">
            {item.description || "Няма предоставено описание за този артикул."}
          </p>

          {/* Zones */}
          {item.zones && (
            <div className="flex flex-wrap gap-2 pt-3">
              {(() => {
                const zText = getZonesDisplayText();
                if (!zText) return null;
                return (
                  <span className="px-3 py-1 bg-cyan-950/40 border border-cyan-900/50 rounded-full text-[10px] uppercase tracking-wider text-cyan-400 font-medium">
                    {zText}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 pt-4 mt-4 border-t border-zinc-800/50">
            {(item.duration || item.durationMinutes) && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Clock className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <span>{item.duration || item.durationMinutes} минути</span>
              </div>
            )}
            {item.athleteCount && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Users className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <span>{item.athleteCount} спортисти</span>
              </div>
            )}
            {(item.numberOfDays || 1) >= 1 && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Calendar className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <span>
                  {item.numberOfDays || 1} дни / {item.proceduresPerDay || 1}{" "}
                  процедури на ден
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pricing & Details bar */}
        <div className="pt-5 border-t border-zinc-800/80 mt-6 flex justify-between items-end">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
              Цена
            </span>
            <span className="text-xl font-medium tracking-tight text-white">
              {item.price > 0 ? `${item.price.toFixed(2)} EUR` : "По заявка"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/20"
              title="Детайли"
            >
              <Eye size={14} />
            </button>
            <Badge className="bg-zinc-950 text-zinc-400 border-zinc-800/60 shadow-none font-medium text-[8px] uppercase tracking-wider px-2.5 py-1 flex items-center gap-1 border">
              {getTabLabel(tab)}
            </Badge>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
          <div className="relative h-64 w-full bg-black">
            {images.length > 0 ? (
              <Image
                src={images[0]}
                alt={item.name}
                fill
                className="object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900/40 text-zinc-700">
                <span className="text-[10px] uppercase tracking-widest font-semibold">
                  Няма снимка
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">{renderBadges()}</div>
          </div>

          <div className="p-6 md:p-8 relative -mt-16">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl mb-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white mb-2 leading-tight">
                  {item.name}
                </DialogTitle>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
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
                        className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-green-600/20"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
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

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
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
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 rounded-md text-xs px-3 py-1"
                    >
                      Продължителност: {item.duration || item.durationMinutes}{" "}
                      мин
                    </Badge>
                  )}
                  {item.athleteCount && (
                    <Badge
                      variant="outline"
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 rounded-md text-xs px-3 py-1"
                    >
                      Капацитет: {item.athleteCount} спортисти
                    </Badge>
                  )}
                  {(item.numberOfDays || 1) >= 1 && (
                    <Badge
                      variant="outline"
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 rounded-md text-xs px-3 py-1"
                    >
                      {item.numberOfDays || 1} дни /{" "}
                      {item.proceduresPerDay || 1} процедури на ден
                    </Badge>
                  )}
                  {item.zones && (
                    <Badge
                      variant="outline"
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 rounded-md text-xs px-3 py-1"
                    >
                      {getZonesDisplayText()}
                    </Badge>
                  )}
                </div>
              )}

              {/* Resources */}
              {item.requiredResources && (
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 mt-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">
                    Ресурси
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {(item.requiredResources.compressors ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {item.requiredResources.compressors} компресора
                      </div>
                    )}
                    {(item.requiredResources.attachments?.arms ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {item.requiredResources.attachments?.arms} РЪЦЕ
                      </div>
                    )}
                    {(item.requiredResources.attachments?.legs ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {item.requiredResources.attachments?.legs} КРАКА
                      </div>
                    )}
                    {(item.requiredResources.attachments?.hips ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {item.requiredResources.attachments?.hips} ТАЗ
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogDescription className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
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
