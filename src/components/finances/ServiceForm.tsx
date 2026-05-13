"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
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
import { Loader2, Save, X, Info, Users, Settings } from "lucide-react";

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
                    if (val === "Годишен абонамент")
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
