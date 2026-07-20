/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import Image from "next/image";
import { ClubService } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Loader2,
  Save,
  X,
  Info,
  Activity,
  MapPin,
  Camera,
  Trash,
  Check,
} from "lucide-react";

interface RecoverySessionFormProps {
  initialData?: Partial<ClubService>;
  siteInventory?: {
    compressors: number;
    attachments: {
      arms: number;
      legs: number;
      hips: number;
    };
  };
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  errors?: Record<string, string[] | undefined>;
}

export function RecoverySessionForm({
  initialData,
  siteInventory,
  onSubmit,
  onCancel,
  errors,
}: RecoverySessionFormProps) {
  const [imageUrl, setImageUrl] = useState(() => {
    const raw = (initialData as any)?.imageUrl || "";
    return raw
      .split(",")
      .filter(Boolean)
      .map((img: string) =>
        img.startsWith("/") && !img.startsWith("/zones") ? `/zones${img}` : img
      )
      .join(",");
  });
  const [imageDisplayMode, setImageDisplayMode] = useState<
    "collage" | "carousel"
  >((initialData as any)?.imageDisplayMode || "collage");

  // Supported zones in all caps to match UI
  const SUPPORTED_ZONES = ["РЪЦЕ", "КРАКА", "ТАЗ"];

  // Filter initial zones to only include supported ones and normalize case
  const initialZones = (initialData?.zones || [])
    .map((z) => z.toUpperCase())
    .filter((z) => SUPPORTED_ZONES.includes(z));

  const CATEGORIES = [
    "ЕДИНИЧНИ СЕСИИ",
    "КОМБИНИРАНИ СЕСИИ",
    "ТУРНИРНИ СЕСИИ",
    "VIP СЕСИИ",
  ];
  const SESSION_TYPES: Record<number, string> = {
    15: "ЗАГРЯВКА",
    30: "ВЪЗСТАНОВЯВАНЕ",
    45: "PRO RECOVERY",
  };

  const [category, setCategory] = useState(
    initialData?.category || "ЕДИНИЧНИ СЕСИИ"
  );
  const [sessionType, setSessionType] = useState(
    initialData?.sessionType || "ВЪЗСТАНОВЯВАНЕ"
  );
  const [duration, setDuration] = useState(initialData?.durationMinutes || 30);
  const [zones, setZones] = useState<string[]>(initialZones);
  const [athleteCount, setAthleteCount] = useState(
    initialData?.athleteCount || 1
  );
  const [numberOfDays, setNumberOfDays] = useState(
    initialData?.numberOfDays || 1
  );
  const [proceduresPerDay, setProceduresPerDay] = useState(
    initialData?.proceduresPerDay || 1
  );

  const [resCompressors, setResCompressors] = useState(
    initialData?.requiredResources?.compressors || 0
  );
  const [resLegs, setResLegs] = useState(
    initialData?.requiredResources?.attachments?.legs || 0
  );
  const [resArms, setResArms] = useState(
    initialData?.requiredResources?.attachments?.arms || 0
  );
  const [resHips, setResHips] = useState(
    initialData?.requiredResources?.attachments?.hips || 0
  );

  // Auto-logic for Session Type based on Duration
  const handleDurationChange = (mins: number) => {
    setDuration(mins);

    // ONLY VIP has special naming for 45 mins
    if (mins === 45 && category === "VIP СЕСИИ") {
      setSessionType("VIP ПРОТОКОЛ");
    } else if (SESSION_TYPES[mins]) {
      setSessionType(SESSION_TYPES[mins]);
    }
  };

  // Special VIP logic
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (cat === "VIP СЕСИИ") {
      setProceduresPerDay(2); // VIP has 2 sessions per day
      setAthleteCount(2); // Usually for 2 athletes as per description
      setDuration(45);
      setSessionType("VIP ПРОТОКОЛ");
    } else {
      // Reset special session types if moving away from VIP
      if (duration === 45) {
        setSessionType("PRO RECOVERY");
      } else if (SESSION_TYPES[duration]) {
        setSessionType(SESSION_TYPES[duration]);
      }
    }
  };

  const updateResourcesOnZoneCheck = (zone: string) => {
    if (zone === "КРАКА")
      setResLegs(
        Math.min(athleteCount, siteInventory?.attachments?.legs || 10)
      );
    if (zone === "РЪЦЕ")
      setResArms(
        Math.min(athleteCount, siteInventory?.attachments?.arms || 10)
      );
    if (zone === "ТАЗ")
      setResHips(
        Math.min(athleteCount, siteInventory?.attachments?.hips || 10)
      );
    setResCompressors(Math.min(athleteCount, siteInventory?.compressors || 10));
  };

  const updateResourcesOnZoneUncheck = (zone: string, newZones: string[]) => {
    if (zone === "КРАКА") setResLegs(0);
    if (zone === "РЪЦЕ") setResArms(0);
    if (zone === "ТАЗ") setResHips(0);

    if (newZones.length === 0) setResCompressors(0);
  };

  const handleZoneToggle = (zone: string) => {
    setZones((prev) => {
      const isChecking = !prev.includes(zone);
      const newZones = isChecking
        ? [...prev, zone]
        : prev.filter((z) => z !== zone);

      if (isChecking) {
        updateResourcesOnZoneCheck(zone);
      } else {
        updateResourcesOnZoneUncheck(zone, newZones);
      }

      return newZones;
    });
  };

  const handleAthleteCountChange = (count: number) => {
    setAthleteCount(count);
    // Re-scale currently active zones
    if (zones.includes("КРАКА"))
      setResLegs(Math.min(count, siteInventory?.attachments?.legs || 10));
    if (zones.includes("РЪЦЕ"))
      setResArms(Math.min(count, siteInventory?.attachments?.arms || 10));
    if (zones.includes("ТАЗ"))
      setResHips(Math.min(count, siteInventory?.attachments?.hips || 10));
    if (zones.length > 0)
      setResCompressors(Math.min(count, siteInventory?.compressors || 10));
  };

  const syncZoneWithResource = (zone: string, count: number) => {
    setZones((prev) => {
      if (count > 0 && !prev.includes(zone)) return [...prev, zone];
      if (count === 0 && prev.includes(zone))
        return prev.filter((z) => z !== zone);
      return prev;
    });
  };

  const handleResourceChange = (field: string, value: number) => {
    if (field === "legs") {
      setResLegs(value);
      syncZoneWithResource("КРАКА", value);
    }
    if (field === "arms") {
      setResArms(value);
      syncZoneWithResource("РЪЦЕ", value);
    }
    if (field === "hips") {
      setResHips(value);
      syncZoneWithResource("ТАЗ", value);
    }
    if (field === "compressors") setResCompressors(value);
  };

  const handleImageToggle = (path: string) => {
    setImageUrl((prev: string) => {
      const list = prev ? prev.split(",").filter(Boolean) : [];
      if (list.includes(path)) {
        return list.filter((p: string) => p !== path).join(",");
      } else {
        return [...list, path].join(",");
      }
    });
  };

  const handleImageRemove = (pathToRemove: string, currentArr: string[]) => {
    const nextList = currentArr.filter((p: string) => p !== pathToRemove);
    setImageUrl(nextList.join(","));
  };

  return (
    <form
      action={onSubmit}
      className="space-y-8 pb-12 duration-500 animate-in fade-in"
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="sessionType" value={sessionType} />
      <input type="hidden" name="duration" value={duration} />
      <input type="hidden" name="athleteCount" value={athleteCount} />
      <input type="hidden" name="numberOfDays" value={numberOfDays} />
      <input type="hidden" name="proceduresPerDay" value={proceduresPerDay} />
      <input type="hidden" name="zones" value={zones.join(",")} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="imageDisplayMode" value={imageDisplayMode} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Basic Info */}
        <div className="space-y-8 lg:col-span-2">
          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Info className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Основна информация
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="ml-1 font-medium text-zinc-500"
                >
                  Име на процедурата
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  defaultValue={initialData?.name}
                  placeholder="напр. Криотерапия - Цяло тяло"
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 text-lg transition-all focus:bg-white"
                  required
                />
                {errors?.name && (
                  <p className="mt-1 ml-1 text-xs text-red-500 animate-in slide-in-from-left-1">
                    {errors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <p className="ml-1 text-sm font-medium text-zinc-500">
                  Категория
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`h-12 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all ${category === cat ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-300"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors?.category && (
                  <p className="mt-1 ml-1 text-xs text-red-500 animate-in slide-in-from-left-1">
                    {errors.category[0]}
                  </p>
                )}
              </div>

              {category === "VIP СЕСИИ" && (
                <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                    💎 VIP Режим
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-600">
                    Специални условия: Сесията е разделена на сегменти (15 мин
                    Загрявка + 30 мин Възстановяване). Включва 2 сесии на ден на
                    спортист.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="ml-1 font-medium text-zinc-500"
                >
                  Описание
                </Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={initialData?.description}
                    placeholder="Опишете процедурата и ползите от нея..."
                    rows={4}
                    className="resize-none rounded-2xl border-zinc-100 bg-zinc-50 p-4 transition-all focus:bg-white"
                  />
                  <div className="absolute right-4 bottom-4 rounded-lg border border-zinc-100 bg-white/50 px-3 py-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase backdrop-blur-sm">
                    {sessionType}
                  </div>
                </div>
                {errors?.description && (
                  <p className="mt-1 ml-1 text-xs text-red-500 animate-in slide-in-from-left-1">
                    {errors.description[0]}
                  </p>
                )}
              </div>
            </div>
          </BentoCard>

          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                <MapPin className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Зони и ресурси
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <p className="ml-1 text-sm font-medium text-zinc-500">
                  Зони за ползване
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {SUPPORTED_ZONES.map((zone) => (
                    <div
                      key={zone}
                      onClick={() => handleZoneToggle(zone)}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${zones.includes(zone) ? "border-cyan-600 bg-cyan-600 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      <Checkbox
                        checked={zones.includes(zone)}
                        className={zones.includes(zone) ? "border-white" : ""}
                      />
                      <span className="text-xs font-medium">{zone}</span>
                    </div>
                  ))}
                </div>
                {errors?.zones && (
                  <p className="mt-1 ml-1 text-xs text-red-500 animate-in slide-in-from-left-1">
                    {errors.zones[0]}
                  </p>
                )}
                {/* Hidden input to pass zones to FormData */}
                <input type="hidden" name="zones" value={zones.join(",")} />
              </div>

              <div className="space-y-6 border-t border-zinc-50 pt-6">
                <div className="flex items-center gap-2">
                  <p className="ml-1 text-sm font-medium text-zinc-500">
                    Необходими ресурси за сесията
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="req_compressors"
                      className="text-xs text-zinc-400"
                    >
                      Компресори
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="req_compressors"
                        name="req_compressors"
                        type="number"
                        min="0"
                        max={siteInventory?.compressors || 10}
                        value={resCompressors}
                        onChange={(e) =>
                          handleResourceChange(
                            "compressors",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                      <span className="text-[10px] whitespace-nowrap text-zinc-300 uppercase">
                        от {siteInventory?.compressors || "?"} налични
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req_legs" className="text-xs text-zinc-400">
                      Маншети за КРАКА
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="req_legs"
                        name="req_legs"
                        type="number"
                        min="0"
                        max={siteInventory?.attachments?.legs || 10}
                        value={resLegs}
                        onChange={(e) =>
                          handleResourceChange(
                            "legs",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                      <span className="text-[10px] whitespace-nowrap text-zinc-300 uppercase">
                        от {siteInventory?.attachments?.legs || "?"} налични
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req_arms" className="text-xs text-zinc-400">
                      Маншети за РЪЦЕ
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="req_arms"
                        name="req_arms"
                        type="number"
                        min="0"
                        max={siteInventory?.attachments?.arms || 10}
                        value={resArms}
                        onChange={(e) =>
                          handleResourceChange(
                            "arms",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                      <span className="text-[10px] whitespace-nowrap text-zinc-300 uppercase">
                        от {siteInventory?.attachments?.arms || "?"} налични
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req_hips" className="text-xs text-zinc-400">
                      Маншети за ТАЗ
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="req_hips"
                        name="req_hips"
                        type="number"
                        min="0"
                        max={siteInventory?.attachments?.hips || 10}
                        value={resHips}
                        onChange={(e) =>
                          handleResourceChange(
                            "hips",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-12 rounded-xl bg-zinc-50"
                      />
                      <span className="text-[10px] whitespace-nowrap text-zinc-300 uppercase">
                        от {siteInventory?.attachments?.hips || "?"} налични
                      </span>
                    </div>
                  </div>
                </div>
                <p className="rounded-xl border border-amber-100/50 bg-amber-50 p-3 text-[11px] text-amber-600">
                  Тези ресурси ще се блокират автоматично при резервация.
                  Уверете се, че съответстват на избраните зони.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Camera className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Изображения (Банер)
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {[
                  "/zones/arm.png",
                  "/zones/legs.webp",
                  "/zones/pelvis.webp",
                ].map((path) => {
                  const isSelected = imageUrl.includes(path);
                  return (
                    <div
                      key={path}
                      onClick={() => handleImageToggle(path)}
                      className={`relative aspect-video cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-amber-500 shadow-md ring-2 ring-amber-500/20"
                          : "border-zinc-200 hover:border-amber-300"
                      }`}
                    >
                      <Image
                        src={path}
                        alt="Zone Preview"
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 rounded-full bg-amber-500 p-1 text-white shadow-sm">
                          <Check className="size-3" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {imageUrl ? (
                <div className="space-y-4 border-t border-zinc-100 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Избрани снимки (
                      {imageUrl.split(",").filter(Boolean).length})
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageUrl("")}
                      className="text-red-650 h-8 rounded-lg px-3 text-xs font-medium hover:bg-red-50 hover:text-red-700"
                    >
                      Премахни всички
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {imageUrl
                      .split(",")
                      .filter(Boolean)
                      .map((path: string, index: number, arr: string[]) => (
                        <div
                          key={path}
                          className="group relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm"
                        >
                          <Image
                            src={path}
                            alt={`Preview ${index + 1}`}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleImageRemove(path, arr)}
                              className="size-8 rounded-full"
                            >
                              <Trash className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* Display Mode Toggle */}
              {imageUrl && imageUrl.split(",").filter(Boolean).length > 1 && (
                <div className="space-y-4 border-t border-zinc-100 pt-6">
                  <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Режим на показване
                  </p>
                  <div className="flex rounded-xl border border-zinc-100 bg-zinc-50 p-1">
                    <button
                      type="button"
                      onClick={() => setImageDisplayMode("collage")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                        imageDisplayMode === "collage"
                          ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      Колаж (Обединени)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageDisplayMode("carousel")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                        imageDisplayMode === "carousel"
                          ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      Въртележка
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {imageDisplayMode === "collage"
                      ? "Снимките ще бъдат разделени на равни части и показани едновременно."
                      : "Снимките ще се сменят автоматично с възможност за ръчно прелистване."}
                  </p>
                </div>
              )}
            </div>
          </BentoCard>
        </div>

        {/* Right Column: Numbers & Settings */}
        <div className="space-y-8">
          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Activity className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">Параметри</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="ml-1 font-medium text-zinc-500"
                >
                  Цена (EUR)
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    autoComplete="off"
                    defaultValue={initialData?.price}
                    className="h-12 rounded-xl border-zinc-100 bg-zinc-50 pl-10"
                    required
                  />
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400">
                    €
                  </span>
                </div>
                {errors?.price && (
                  <p className="mt-1 ml-1 text-xs text-red-500 animate-in slide-in-from-left-1">
                    {errors.price[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <p className="ml-1 text-sm font-medium text-zinc-500">
                  Продължителност
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationChange(mins)}
                      className={`h-12 rounded-xl border text-xs font-bold transition-all ${duration === mins ? "border-cyan-600 bg-cyan-600 text-white shadow-lg shadow-cyan-200" : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-300"}`}
                    >
                      {mins} мин
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-50 pt-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="athleteCountInput"
                    className="text-[10px] tracking-widest text-zinc-400 uppercase"
                  >
                    Брой спортисти
                  </Label>
                  <Input
                    id="athleteCountInput"
                    type="number"
                    value={athleteCount}
                    onChange={(e) =>
                      handleAthleteCountChange(parseInt(e.target.value) || 1)
                    }
                    className="h-10 rounded-lg bg-zinc-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="numberOfDaysInput"
                    className="text-[10px] tracking-widest text-zinc-400 uppercase"
                  >
                    Брой дни
                  </Label>
                  <Input
                    id="numberOfDaysInput"
                    type="number"
                    value={numberOfDays}
                    onChange={(e) =>
                      setNumberOfDays(parseInt(e.target.value) || 1)
                    }
                    className="h-10 rounded-lg bg-zinc-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="proceduresPerDayInput"
                  className="text-[10px] tracking-widest text-zinc-400 uppercase"
                >
                  Процедури на ден
                </Label>
                <Input
                  id="proceduresPerDayInput"
                  type="number"
                  value={proceduresPerDay}
                  onChange={(e) =>
                    setProceduresPerDay(parseInt(e.target.value) || 1)
                  }
                  className="h-10 rounded-lg bg-zinc-50"
                />
              </div>
            </div>
          </BentoCard>

          <div className="flex flex-col gap-3">
            <SubmitButton isEdit={!!initialData?.id} />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="h-14 rounded-3xl border-zinc-100 text-zinc-500 transition-all hover:bg-zinc-50"
            >
              <X className="mr-2 size-4" /> Отказ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-16 rounded-3xl bg-zinc-950 text-sm font-medium tracking-widest text-white uppercase transition-all hover:bg-zinc-800"
    >
      {pending ? (
        <Loader2 className="mr-3 size-5 animate-spin" />
      ) : (
        <Save className="mr-3 size-5" strokeWidth={1.5} />
      )}
      {isEdit ? "Запази промените" : "Създай процедура"}
    </Button>
  );
}
