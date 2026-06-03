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
  const [imageUrl, setImageUrl] = useState(
    (initialData as any)?.imageUrl || ""
  );
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

  const handleZoneToggle = (zone: string) => {
    setZones((prev) => {
      const isChecking = !prev.includes(zone);
      const newZones = isChecking
        ? [...prev, zone]
        : prev.filter((z) => z !== zone);

      if (isChecking) {
        // Multiplied by athleteCount but capped by inventory
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
        setResCompressors(
          Math.min(athleteCount, siteInventory?.compressors || 10)
        );
      } else {
        if (zone === "КРАКА") setResLegs(0);
        if (zone === "РЪЦЕ") setResArms(0);
        if (zone === "ТАЗ") setResHips(0);

        const remainingZones = newZones.length;
        if (remainingZones === 0) setResCompressors(0);
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

  const handleResourceChange = (field: string, value: number) => {
    if (field === "legs") {
      setResLegs(value);
      if (value > 0 && !zones.includes("КРАКА"))
        setZones((p) => [...p, "КРАКА"]);
      else if (value === 0 && zones.includes("КРАКА"))
        setZones((p) => p.filter((z) => z !== "КРАКА"));
    }
    if (field === "arms") {
      setResArms(value);
      if (value > 0 && !zones.includes("РЪЦЕ")) setZones((p) => [...p, "РЪЦЕ"]);
      else if (value === 0 && zones.includes("РЪЦЕ"))
        setZones((p) => p.filter((z) => z !== "РЪЦЕ"));
    }
    if (field === "hips") {
      setResHips(value);
      if (value > 0 && !zones.includes("ТАЗ")) setZones((p) => [...p, "ТАЗ"]);
      else if (value === 0 && zones.includes("ТАЗ"))
        setZones((p) => p.filter((z) => z !== "ТАЗ"));
    }
    if (field === "compressors") setResCompressors(value);
  };

  return (
    <form
      action={onSubmit}
      className="space-y-8 pb-12 animate-in fade-in duration-500"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Info className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Основна информация
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-zinc-500 font-medium ml-1"
                >
                  Име на процедурата
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  defaultValue={initialData?.name}
                  placeholder="напр. Криотерапия - Цяло тяло"
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all text-lg"
                  required
                />
                {errors?.name && (
                  <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-left-1">
                    {errors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-500 font-medium ml-1">
                  Категория
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${category === cat ? "bg-zinc-950 text-white border-zinc-950" : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-300"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors?.category && (
                  <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-left-1">
                    {errors.category[0]}
                  </p>
                )}
              </div>

              {category === "VIP СЕСИИ" && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    💎 VIP Режим
                  </p>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    Специални условия: Сесията е разделена на сегменти (15 мин
                    Загрявка + 30 мин Възстановяване). Включва 2 сесии на ден на
                    спортист.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-zinc-500 font-medium ml-1"
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
                    className="rounded-2xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all resize-none p-4"
                  />
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-lg border border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {sessionType}
                  </div>
                </div>
                {errors?.description && (
                  <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-left-1">
                    {errors.description[0]}
                  </p>
                )}
              </div>
            </div>
          </BentoCard>

          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
                <MapPin className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Зони и ресурси
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 font-medium ml-1">
                  Зони за ползване
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SUPPORTED_ZONES.map((zone) => (
                    <div
                      key={zone}
                      onClick={() => handleZoneToggle(zone)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${zones.includes(zone) ? "bg-cyan-600 text-white border-cyan-600" : "bg-zinc-50 border-zinc-100 text-zinc-700 hover:bg-zinc-100"}`}
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
                  <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-left-1">
                    {errors.zones[0]}
                  </p>
                )}
                {/* Hidden input to pass zones to FormData */}
                <input type="hidden" name="zones" value={zones.join(",")} />
              </div>

              <div className="space-y-6 pt-6 border-t border-zinc-50">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-zinc-500 font-medium ml-1">
                    Необходими ресурси за сесията
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="text-[10px] text-zinc-300 uppercase whitespace-nowrap">
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
                      <span className="text-[10px] text-zinc-300 uppercase whitespace-nowrap">
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
                      <span className="text-[10px] text-zinc-300 uppercase whitespace-nowrap">
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
                      <span className="text-[10px] text-zinc-300 uppercase whitespace-nowrap">
                        от {siteInventory?.attachments?.hips || "?"} налични
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100/50">
                  Тези ресурси ще се блокират автоматично при резервация.
                  Уверете се, че съответстват на избраните зони.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Camera className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Изображения (Банер)
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "/zones/arm.png",
                  "/zones/legs.webp",
                  "/zones/pelvis.webp",
                ].map((path) => {
                  const isSelected = imageUrl.includes(path);
                  return (
                    <div
                      key={path}
                      onClick={() => {
                        setImageUrl((prev: string) => {
                          const list = prev
                            ? prev.split(",").filter(Boolean)
                            : [];
                          if (list.includes(path)) {
                            return list
                              .filter((p: string) => p !== path)
                              .join(",");
                          } else {
                            return [...list, path].join(",");
                          }
                        });
                      }}
                      className={`relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
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
                        <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {imageUrl ? (
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Избрани снимки (
                      {imageUrl.split(",").filter(Boolean).length})
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageUrl("")}
                      className="text-xs font-medium text-red-650 hover:bg-red-50 hover:text-red-700 h-8 px-3 rounded-lg"
                    >
                      Премахни всички
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {imageUrl
                      .split(",")
                      .filter(Boolean)
                      .map((path: string, index: number, arr: string[]) => (
                        <div
                          key={path}
                          className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 group shadow-sm"
                        >
                          <Image
                            src={path}
                            alt={`Preview ${index + 1}`}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const nextList = arr.filter(
                                  (p: string) => p !== path
                                );
                                setImageUrl(nextList.join(","));
                              }}
                              className="h-8 w-8 rounded-full"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* Display Mode Toggle */}
              {imageUrl && imageUrl.split(",").filter(Boolean).length > 1 && (
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Режим на показване
                  </p>
                  <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setImageDisplayMode("collage")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        imageDisplayMode === "collage"
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      Колаж (Обединени)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageDisplayMode("carousel")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        imageDisplayMode === "carousel"
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
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
          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">Параметри</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="text-zinc-500 font-medium ml-1"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    €
                  </span>
                </div>
                {errors?.price && (
                  <p className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-left-1">
                    {errors.price[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-500 font-medium ml-1">
                  Продължителност
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationChange(mins)}
                      className={`h-12 rounded-xl text-xs font-bold border transition-all ${duration === mins ? "bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-200" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-300"}`}
                    >
                      {mins} мин
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                <div className="space-y-2">
                  <Label
                    htmlFor="athleteCountInput"
                    className="text-[10px] text-zinc-400 uppercase tracking-widest"
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
                    className="text-[10px] text-zinc-400 uppercase tracking-widest"
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
                  className="text-[10px] text-zinc-400 uppercase tracking-widest"
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
              className="h-14 rounded-3xl border-zinc-100 text-zinc-500 hover:bg-zinc-50 transition-all"
            >
              <X className="mr-2 h-4 w-4" /> Отказ
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
      className="h-16 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all text-sm uppercase tracking-widest font-medium"
    >
      {pending ? (
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
      ) : (
        <Save className="mr-3 h-5 w-5" strokeWidth={1.5} />
      )}
      {isEdit ? "Запази промените" : "Създай процедура"}
    </Button>
  );
}
