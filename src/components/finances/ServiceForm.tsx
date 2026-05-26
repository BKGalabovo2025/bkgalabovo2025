"use client";

import { useFormStatus } from "react-dom";
import { useState, useRef } from "react";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Loader2,
  Save,
  X,
  Info,
  Users,
  Settings,
  Camera,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { uploadFile } from "@/services/storage-service";
import { toast } from "sonner";

const localImages = [
  {
    name: "Абонамент - Дете",
    path: "/планове/абонамент - дете .png",
  },
  {
    name: "Абонамент - Дете (2)",
    path: "/планове/абонамент - дете  втора снимка.png",
  },
  {
    name: "Абонамент - Любител",
    path: "/планове/абонамент - любител .png",
  },
  {
    name: "Персонална - Дете",
    path: "/планове/персонална тренировка - дете .png",
  },
  {
    name: "Персонална - Любител",
    path: "/планове/персонална тренировка - любител .png",
  },
];

interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  errors?: Record<string, string[] | undefined>;
}

export function ServiceForm({
  initialData,
  onSubmit,
  onCancel,
  errors,
}: ServiceFormProps) {
  const [serviceType, setServiceType] = useState<string>(
    initialData?.type || "Абонамент"
  );
  const [grantsLicense, setGrantsLicense] = useState(
    initialData?.grantsLicense || false
  );
  const [licenseCondition, setLicenseCondition] = useState<string>(
    initialData?.licenseCondition || "After N payments"
  );
  const [grantsApparel, setGrantsApparel] = useState(
    initialData?.grantsApparel || false
  );
  const [apparelCondition, setApparelCondition] = useState<string>(
    initialData?.apparelCondition || "After N payments"
  );
  const [billingPeriod, setBillingPeriod] = useState<string>(
    initialData?.billingPeriod || "Месечен"
  );

  const { idToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  return (
    <form
      action={onSubmit}
      className="space-y-8 pb-12 animate-in fade-in duration-500"
    >
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
                  Име на услугата
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  placeholder="напр. Месечен абонамент - Дете"
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all text-lg"
                  required
                />
                {errors?.name && (
                  <p className="text-xs text-red-500 ml-1">{errors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-zinc-500 font-medium ml-1"
                >
                  Описание
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description}
                  placeholder="Опишете какво включва услугата..."
                  rows={6}
                  className="rounded-2xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all resize-none p-4"
                  required
                />
                {errors?.description && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.description[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      defaultValue={initialData?.price}
                      placeholder="0.00"
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all pl-12 text-lg font-medium"
                      required
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                      €
                    </span>
                  </div>
                  {errors?.price && (
                    <p className="text-xs text-red-500 ml-1">
                      {errors.price[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 font-medium ml-1">
                    Валута
                  </Label>
                  <Input
                    name="currency"
                    value="EUR"
                    readOnly
                    className="h-14 rounded-2xl border-zinc-100 bg-zinc-100 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Camera className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Изображения на услугата
              </h3>
            </div>

            <div className="space-y-6">
              <input type="hidden" name="imageUrl" value={imageUrl} />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !idToken) return;

                  if (!file.type.startsWith("image/")) {
                    toast.error("Грешка", {
                      description: "Моля, изберете валиден графичен файл.",
                    });
                    return;
                  }

                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("Грешка", {
                      description: "Изображението трябва да е под 2MB.",
                    });
                    return;
                  }

                  setIsUploading(true);
                  try {
                    const path = `services/${Date.now()}_${file.name}`;
                    const downloadUrl = await uploadFile(path, file, idToken);
                    setImageUrl((prev) => {
                      const list = prev ? prev.split(",").filter(Boolean) : [];
                      return [...list, downloadUrl].join(",");
                    });
                    toast.success("Успех!", {
                      description:
                        "Снимката е качена успешно и е добавена към списъка.",
                    });
                  } catch (err) {
                    console.error(err);
                    toast.error("Грешка при качване", {
                      description: (err as Error).message,
                    });
                  } finally {
                    setIsUploading(false);
                  }
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Добавяне на снимка от компютъра
                  </Label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 transition-colors flex flex-col items-center justify-center p-6 text-zinc-400 group bg-zinc-50/50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-3" />
                        <span className="text-xs font-light text-zinc-500">
                          Качване на снимката...
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera
                          className="h-10 w-10 text-zinc-300 group-hover:text-zinc-500 mb-3 transition-colors"
                          strokeWidth={1}
                        />
                        <span className="text-xs font-semibold text-zinc-600 group-hover:text-zinc-900 transition-colors">
                          Качете нов файл
                        </span>
                        <span className="text-[10px] text-zinc-400 font-light mt-1">
                          (Изисква активиран Firebase Storage)
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Избор от качените в /public/планове (Мултиселекция)
                  </Label>
                  <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {localImages.map((img) => {
                      const selectedList = imageUrl
                        ? imageUrl.split(",").filter(Boolean)
                        : [];
                      const isSelected = selectedList.includes(img.path);
                      const selectOrderIndex = selectedList.indexOf(img.path);

                      return (
                        <button
                          key={img.path}
                          type="button"
                          onClick={() => {
                            let nextList = imageUrl
                              ? imageUrl.split(",").filter(Boolean)
                              : [];
                            if (nextList.includes(img.path)) {
                              nextList = nextList.filter((p) => p !== img.path);
                            } else {
                              nextList.push(img.path);
                            }
                            setImageUrl(nextList.join(","));
                          }}
                          className={`group relative aspect-video rounded-2xl overflow-hidden border transition-all ${
                            isSelected
                              ? "border-zinc-950 ring-2 ring-zinc-950 shadow-md scale-102"
                              : "border-zinc-100 hover:border-zinc-300 hover:scale-102"
                          }`}
                        >
                          <Image
                            src={img.path}
                            alt={img.name}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                            <span className="text-[10px] font-semibold text-white truncate w-full text-left drop-shadow-sm">
                              {img.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-zinc-950 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                              {selectOrderIndex + 1}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {imageUrl ? (
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Избрани снимки (
                      {imageUrl.split(",").filter(Boolean).length})
                    </Label>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {imageUrl
                      .split(",")
                      .filter(Boolean)
                      .map((path, index, arr) => {
                        return (
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
                            <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold flex items-center justify-center">
                              #{index + 1}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  const nextList = arr.filter(
                                    (p) => p !== path
                                  );
                                  setImageUrl(nextList.join(","));
                                }}
                                className="h-8 w-8 rounded-full"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          </BentoCard>

          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Целеви групи и тип
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label className="text-zinc-500 font-medium ml-1 text-xs uppercase tracking-widest">
                  Целеви групи
                </Label>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {["Деца", "Любители"].map((group) => (
                    <label
                      key={group}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors"
                    >
                      <Checkbox
                        name="targetGroups"
                        value={group}
                        defaultChecked={initialData?.targetGroups?.includes(
                          group
                        )}
                        className="rounded-md"
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        {group}
                      </span>
                    </label>
                  ))}
                </div>
                {errors?.targetGroups && (
                  <p className="text-xs text-red-500 ml-1">
                    {errors.targetGroups[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-500 font-medium ml-1 text-xs uppercase tracking-widest">
                  Тип на услугата
                </Label>
                <input type="hidden" name="type" value={serviceType} />
                <RadioGroup
                  value={serviceType}
                  onValueChange={(val) => {
                    setServiceType(val);
                    if (val === "Годишен абонамент" || val === "Членски внос")
                      setBillingPeriod("Годишен");
                    else if (val === "Абонамент") setBillingPeriod("Месечен");
                    else if (val === "Еднократно плащане")
                      setBillingPeriod("Дневен");
                  }}
                  className="grid grid-cols-1 gap-3 pt-2"
                  required
                >
                  {[
                    { value: "Абонамент", label: "Месечен абонамент" },
                    { value: "Годишен абонамент", label: "Годишен абонамент" },
                    {
                      value: "Еднократно плащане",
                      label: "Еднократно посещение",
                    },
                    { value: "Членски внос", label: "Членски внос" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${serviceType === option.value ? "bg-zinc-950 text-white border-zinc-950" : "bg-zinc-50 border-zinc-100 text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      <RadioGroupItem
                        value={option.value}
                        className={
                          serviceType === option.value
                            ? "border-white text-white"
                            : ""
                        }
                      />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {errors?.type && (
                  <p className="text-xs text-red-500 ml-1">{errors.type[0]}</p>
                )}
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-8">
          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Settings className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">Настройки</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 font-medium ml-1">
                    Период на фактуриране
                  </Label>
                  <input
                    type="hidden"
                    name="billingPeriod"
                    value={billingPeriod || ""}
                  />
                  <Select
                    value={billingPeriod}
                    onValueChange={setBillingPeriod}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Месечен">Месечен</SelectItem>
                      <SelectItem value="Годишен">Годишен</SelectItem>
                      <SelectItem value="Дневен">Дневен</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors?.billingPeriod && (
                    <p className="text-xs text-red-500 ml-1">
                      {errors.billingPeriod[0]}
                    </p>
                  )}
                </div>

                {serviceType === "Абонамент" ||
                serviceType === "Годишен абонамент" ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="space-y-4 p-5 rounded-3xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grantsLicense" className="font-medium">
                          Дава право на картотека
                        </Label>
                        <Checkbox
                          id="grantsLicense"
                          name="grantsLicense"
                          checked={grantsLicense}
                          onCheckedChange={(c) => setGrantsLicense(c === true)}
                        />
                      </div>
                      {grantsLicense && (
                        <div className="space-y-3 pt-2 animate-in fade-in">
                          <Select
                            name="licenseCondition"
                            value={licenseCondition}
                            onValueChange={setLicenseCondition}
                          >
                            <SelectTrigger className="h-10 rounded-lg bg-white border-zinc-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Immediately">
                                Веднага
                              </SelectItem>
                              <SelectItem value="After N payments">
                                След N плащания
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {licenseCondition === "After N payments" && (
                            <div className="flex items-center gap-2">
                              <Input
                                name="licensePaymentCount"
                                type="number"
                                defaultValue={
                                  initialData?.licensePaymentCount || 1
                                }
                                className="h-10 w-20 bg-white"
                              />
                              <span className="text-xs text-zinc-500">
                                вноски
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-5 rounded-3xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grantsApparel" className="font-medium">
                          Дава право на екипировка
                        </Label>
                        <Checkbox
                          id="grantsApparel"
                          name="grantsApparel"
                          checked={grantsApparel}
                          onCheckedChange={(c) => setGrantsApparel(c === true)}
                        />
                      </div>
                      {grantsApparel && (
                        <div className="space-y-3 pt-2 animate-in fade-in">
                          <Select
                            name="apparelCondition"
                            value={apparelCondition}
                            onValueChange={setApparelCondition}
                          >
                            <SelectTrigger className="h-10 rounded-lg bg-white border-zinc-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Immediately">
                                Веднага
                              </SelectItem>
                              <SelectItem value="After N payments">
                                След N плащания
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {apparelCondition === "After N payments" && (
                            <div className="flex items-center gap-2">
                              <Input
                                name="apparelPaymentCount"
                                type="number"
                                defaultValue={
                                  initialData?.apparelPaymentCount || 6
                                }
                                className="h-10 w-20 bg-white"
                              />
                              <span className="text-xs text-zinc-500">
                                вноски
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="durationMinutes"
                        className="text-zinc-500 font-medium ml-1"
                      >
                        Продължителност (минути)
                      </Label>
                      <Input
                        id="durationMinutes"
                        name="durationMinutes"
                        type="number"
                        defaultValue={initialData?.durationMinutes || 90}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                      <Label
                        htmlFor="requiresBooking"
                        className="font-medium cursor-pointer"
                      >
                        Изисква предварителна резервация
                      </Label>
                      <Checkbox
                        id="requiresBooking"
                        name="requiresBooking"
                        defaultChecked={initialData?.requiresBooking}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isCoachLed" className="font-medium">
                      С присъствие на треньор
                    </Label>
                    <Checkbox
                      id="isCoachLed"
                      name="isCoachLed"
                      defaultChecked={initialData?.isCoachLed ?? true}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] text-zinc-400 uppercase tracking-widest">
                        Мин. участници
                      </Label>
                      <Input
                        name="minMembers"
                        type="number"
                        defaultValue={initialData?.minMembers || 1}
                        className="h-10 rounded-lg bg-zinc-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-zinc-400 uppercase tracking-widest">
                        Макс. участници
                      </Label>
                      <Input
                        name="maxMembers"
                        type="number"
                        defaultValue={initialData?.maxMembers || 1}
                        className="h-10 rounded-lg bg-zinc-50"
                      />
                    </div>
                  </div>
                </div>
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
              className="h-14 rounded-3xl border-zinc-100 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all font-light"
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
      className="h-16 rounded-3xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all text-sm uppercase tracking-widest font-medium shadow-2xl shadow-zinc-200"
    >
      {pending ? (
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
      ) : (
        <Save className="mr-3 h-5 w-5" strokeWidth={1.5} />
      )}
      {isEdit ? "Запази промените" : "Създай услуга"}
    </Button>
  );
}
