 
 
 
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
      className="space-y-8 pb-12 duration-500 animate-in fade-in"
    >
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
                  Име на услугата
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  placeholder="напр. Месечен абонамент - Дете"
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 text-lg transition-all focus:bg-white"
                  required
                />
                {errors?.name && (
                  <p className="ml-1 text-xs text-red-500">{errors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="ml-1 font-medium text-zinc-500"
                >
                  Описание
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description}
                  placeholder="Опишете какво включва услугата..."
                  rows={6}
                  className="resize-none rounded-2xl border-zinc-100 bg-zinc-50 p-4 transition-all focus:bg-white"
                  required
                />
                {errors?.description && (
                  <p className="ml-1 text-xs text-red-500">
                    {errors.description[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      defaultValue={initialData?.price}
                      placeholder="0.00"
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 pl-12 text-lg font-medium transition-all focus:bg-white"
                      required
                    />
                    <span className="absolute top-1/2 left-5 -translate-y-1/2 font-medium text-zinc-400">
                      €
                    </span>
                  </div>
                  {errors?.price && (
                    <p className="ml-1 text-xs text-red-500">
                      {errors.price[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="ml-1 font-medium text-zinc-500">
                    Валута
                  </Label>
                  <Input
                    name="currency"
                    value="EUR"
                    readOnly
                    className="h-14 cursor-not-allowed rounded-2xl border-zinc-100 bg-zinc-100 text-zinc-500"
                  />
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Camera className="size-5" strokeWidth={1.5} />
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

              <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Label className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Добавяне на снимка от компютъра
                  </Label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="group flex aspect-video w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-zinc-400 transition-colors hover:border-zinc-300"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mb-3 size-10 animate-spin text-amber-500" />
                        <span className="text-xs font-light text-zinc-500">
                          Качване на снимката...
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera
                          className="mb-3 size-10 text-zinc-300 transition-colors group-hover:text-zinc-500"
                          strokeWidth={1}
                        />
                        <span className="text-xs font-semibold text-zinc-600 transition-colors group-hover:text-zinc-900">
                          Качете нов файл
                        </span>
                        <span className="mt-1 text-[10px] font-light text-zinc-400">
                          (Изисква активиран Firebase Storage)
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Избор от качените в /public/планове (Мултиселекция)
                  </Label>
                  <div className="custom-scrollbar grid max-h-55 grid-cols-2 gap-3 overflow-y-auto pr-2">
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
                          className={`group relative aspect-video overflow-hidden rounded-2xl border transition-all ${
                            isSelected
                              ? "scale-102 border-zinc-950 shadow-md ring-2 ring-zinc-950"
                              : "border-zinc-100 hover:scale-102 hover:border-zinc-300"
                          }`}
                        >
                          <Image
                            src={img.path}
                            alt={img.name}
                            fill
                            sizes="120px"
                            priority
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-end bg-black/30 p-2">
                            <span className="w-full truncate text-left text-[10px] font-semibold text-white drop-shadow-sm">
                              {img.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white shadow-md">
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
                <div className="space-y-4 border-t border-zinc-100 pt-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Избрани снимки (
                      {imageUrl.split(",").filter(Boolean).length})
                    </Label>
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
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {imageUrl
                      .split(",")
                      .filter(Boolean)
                      .map((path, index, arr) => {
                        return (
                          <div
                            key={path}
                            className="group relative aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm"
                          >
                            <Image
                              src={path}
                              alt={`Preview ${index + 1}`}
                              fill
                              sizes="150px"
                              priority
                              className="object-cover"
                            />
                            <div className="absolute top-2 left-2 flex items-center justify-center rounded-md bg-zinc-950/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                              #{index + 1}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
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
                                className="size-8 rounded-full"
                              >
                                <Trash className="size-4" />
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

          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <Users className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">
                Целеви групи и тип
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="ml-1 text-xs font-medium tracking-widest text-zinc-500 uppercase">
                  Целеви групи
                </Label>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {["Деца", "Любители"].map((group) => (
                    <label
                      key={group}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100"
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
                  <p className="ml-1 text-xs text-red-500">
                    {errors.targetGroups[0]}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="ml-1 text-xs font-medium tracking-widest text-zinc-500 uppercase">
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
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${serviceType === option.value ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"}`}
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
                  <p className="ml-1 text-xs text-red-500">{errors.type[0]}</p>
                )}
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-8">
          <BentoCard className="rounded-5xl border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Settings className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-light tracking-tight">Настройки</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label className="ml-1 font-medium text-zinc-500">
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
                    <p className="ml-1 text-xs text-red-500">
                      {errors.billingPeriod[0]}
                    </p>
                  )}
                </div>

                {serviceType === "Абонамент" ||
                serviceType === "Годишен абонамент" ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
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
                            <SelectTrigger className="h-10 rounded-lg border-zinc-200 bg-white text-xs">
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

                    <div className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
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
                            <SelectTrigger className="h-10 rounded-lg border-zinc-200 bg-white text-xs">
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
                        className="ml-1 font-medium text-zinc-500"
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
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <Label
                        htmlFor="requiresBooking"
                        className="cursor-pointer font-medium"
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

                <div className="space-y-4 border-t border-zinc-100 pt-6">
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
                      <Label className="text-[10px] tracking-widest text-zinc-400 uppercase">
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
                      <Label className="text-[10px] tracking-widest text-zinc-400 uppercase">
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
              className="h-14 rounded-3xl border-zinc-100 font-light text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900"
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
      className="h-16 rounded-3xl bg-zinc-950 text-sm font-medium tracking-widest text-white uppercase shadow-2xl shadow-zinc-200 transition-all hover:bg-zinc-800"
    >
      {pending ? (
        <Loader2 className="mr-3 size-5 animate-spin" />
      ) : (
        <Save className="mr-3 size-5" strokeWidth={1.5} />
      )}
      {isEdit ? "Запази промените" : "Създай услуга"}
    </Button>
  );
}
