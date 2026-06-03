"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Activity,
  Package,
  Search,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Eye } from "lucide-react";

interface PublicCatalogTabsProps {
  trainings: any[];
  generalServices: any[];
  products: any[];
  recoveryServices?: any[];
  allowedTabs?: ("trainings" | "general" | "products" | "recovery")[];
}

export default function PublicCatalogTabs({
  trainings,
  generalServices,
  products,
  recoveryServices = [],
  allowedTabs = ["trainings", "general", "products", "recovery"],
}: PublicCatalogTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "trainings" | "general" | "products" | "recovery"
  >(allowedTabs[0] || "trainings");
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
  const handleTabChange = (
    tab: "trainings" | "general" | "products" | "recovery"
  ) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="space-y-8">
      {/* Search and Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-3xl backdrop-blur-md">
        {/* Tabs switcher */}
        <div className="flex items-center p-1 bg-zinc-950/80 border border-zinc-800/50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {allowedTabs.includes("trainings") && (
            <button
              onClick={() => handleTabChange("trainings")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap w-full md:w-auto ${
                activeTab === "trainings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Trophy size={14} />
              Тренировки
            </button>
          )}
          {allowedTabs.includes("general") && (
            <button
              onClick={() => handleTabChange("general")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap w-full md:w-auto ${
                activeTab === "general"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Activity size={14} />
              Клубни Услуги
            </button>
          )}
          {allowedTabs.includes("products") && (
            <button
              onClick={() => handleTabChange("products")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap w-full md:w-auto ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Package size={14} />
              Магазин & Наличност
            </button>
          )}
          {allowedTabs.includes("recovery") && (
            <button
              onClick={() => handleTabChange("recovery")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap w-full md:w-auto ${
                activeTab === "recovery"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap size={14} />
              Възстановяване
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по име..."
            className="w-full pl-11 pr-4 py-3 bg-zinc-950 border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-12 shadow-inner border"
          />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 items-center px-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mr-2">
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
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
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

function CatalogCard({
  item,
  tab,
}: {
  item: any;
  tab: "trainings" | "general" | "products" | "recovery";
}) {
  const images = useMemo(() => {
    if (!item.imageUrl) return [];
    return item.imageUrl.split(",").filter(Boolean);
  }, [item.imageUrl]);

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

  return (
    <BentoCard className="group relative overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-none hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 rounded-3xl flex flex-col h-full min-h-[420px]">
      {/* Product Image section with navigation */}
      <div className="relative h-56 w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/60 shrink-0">
        {images.length > 0 ? (
          displayMode === "collage" ? (
            <div className="flex w-full h-full">
              {images.map((imgUrl: string, idx: number) => (
                <div
                  key={imgUrl}
                  className="h-full relative overflow-hidden"
                  style={{ width: `${100 / images.length}%` }}
                >
                  <Image
                    src={imgUrl}
                    alt={`${item.name} - ${idx + 1}`}
                    fill
                    sizes="(max-w-768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {idx > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-white/20 z-10" />
                  )}
                </div>
              ))}
            </div>
          ) : (
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
                          activeImgIndex === i
                            ? "bg-white w-4"
                            : "bg-white/40 w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/40 text-zinc-700">
            {tab === "trainings" ? (
              <Trophy className="h-12 w-12 opacity-35" strokeWidth={1} />
            ) : tab === "general" ? (
              <Activity className="h-12 w-12 opacity-35" strokeWidth={1} />
            ) : tab === "recovery" ? (
              <Zap className="h-12 w-12 opacity-35" strokeWidth={1} />
            ) : (
              <ShoppingBag className="h-12 w-12 opacity-35" strokeWidth={1} />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-widest opacity-40 mt-3">
              Няма снимка
            </span>
          </div>
        )}

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10">{renderBadges()}</div>
      </div>

      {/* Product Content Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold leading-snug text-white group-hover:text-blue-400 transition-colors duration-300 min-h-10 flex items-center">
            {item.name}
          </h3>
          <p className="text-zinc-500 text-xs font-light leading-relaxed mt-3 line-clamp-3 min-h-14">
            {item.description || "Няма предоставено описание за този артикул."}
          </p>
        </div>

        {/* Bottom Pricing & Details bar */}
        <div className="pt-5 border-t border-zinc-800/80 mt-6 flex justify-between items-end">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">
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
              {tab === "trainings"
                ? "Тренировка"
                : tab === "general"
                  ? "Услуга"
                  : tab === "recovery"
                    ? "Възстановяване"
                    : "Магазин"}
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
                <div className="text-xl font-medium tracking-tight text-blue-400">
                  {item.price > 0
                    ? `${item.price.toFixed(2)} EUR`
                    : "По заявка"}
                </div>
              </DialogHeader>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
