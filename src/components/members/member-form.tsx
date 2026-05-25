"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MemberSchema, Member } from "@/types/member.types";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { Save, X, ArrowRight, ArrowLeft, User, Phone, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/use-app-store";

const MemberFormSchema = MemberSchema.omit({
  id: true,
  name: true,
  registrationDate: true,
  updatedAt: true,
});
type MemberFormValues = z.infer<typeof MemberFormSchema>;

interface MemberFormProps {
  onSave: (data: MemberFormValues) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<Member>;
}

export const MemberForm = ({
  onSave,
  onClose,
  initialData,
}: MemberFormProps) => {
  const [step, setStep] = useState(1);
  const { activeBranch } = useAppStore();
  
  // Safely convert dateOfBirth to string for Zod validation
  const safeInitialData = { ...initialData } as any;
  if (
    safeInitialData.dateOfBirth &&
    typeof safeInitialData.dateOfBirth !== "string"
  ) {
    if (typeof safeInitialData.dateOfBirth?.toDate === "function") {
      safeInitialData.dateOfBirth = safeInitialData.dateOfBirth
        .toDate()
        .toISOString()
        .split("T")[0];
    } else if (safeInitialData.dateOfBirth instanceof Date) {
      safeInitialData.dateOfBirth = safeInitialData.dateOfBirth
        .toISOString()
        .split("T")[0];
    } else {
      safeInitialData.dateOfBirth = String(safeInitialData.dateOfBirth);
    }
  }

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberFormSchema),
    defaultValues: {
      siteId: activeBranch,
      firstName: "",
      middleName: "",
      lastName: "",
      educationInstitution: "",
      dateOfBirth: undefined,
      gender: "male",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      apparelSize: "",
      status: "active",
      notes: "",
      familyId: undefined,
      skillLevel: undefined,
      hasSignedDeclaration: false,
      hasMedicalCertificate: false,
      isLicensed: false,
      ...safeInitialData,
    },
  });

  const {
    formState: { isSubmitting },
    trigger,
  } = form;

  const handleNextStep = async () => {
    let isValid = false;
    
    if (step === 1) {
      isValid = await trigger(["firstName", "middleName", "lastName", "dateOfBirth", "gender"]);
    } else if (step === 2) {
      isValid = await trigger(["phone", "email", "address", "emergencyContactName", "emergencyContactPhone"]);
    }
    
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: MemberFormValues) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form
        aria-label="member-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {/* STEP PROGRESS BAR */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-zinc-950 dark:bg-zinc-50 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 space-y-6 sm:space-y-8 min-h-[400px]">
          {/* СТЪПКА 1: Основна информация */}
          {step === 1 && (
            <BentoCard className="p-5 sm:p-8 border-zinc-100 shadow-none rounded-3xl sm:rounded-4xl animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <h3 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Стъпка 1: Основна информация
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <FormField
                  name="firstName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Име *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="lastName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Фамилия *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="middleName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Презиме
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Пол
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-zinc-100">
                          <SelectItem value="male">Мъж</SelectItem>
                          <SelectItem value="female">Жена</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => {
                    const years = Array.from({ length: 90 }, (_, i) =>
                      (new Date().getFullYear() - i).toString()
                    );
                    const months = [
                      { value: "01", label: "Януари" },
                      { value: "02", label: "Февруари" },
                      { value: "03", label: "Март" },
                      { value: "04", label: "Април" },
                      { value: "05", label: "Май" },
                      { value: "06", label: "Юни" },
                      { value: "07", label: "Юли" },
                      { value: "08", label: "Август" },
                      { value: "09", label: "Септември" },
                      { value: "10", label: "Октомври" },
                      { value: "11", label: "Ноември" },
                      { value: "12", label: "Декември" },
                    ];
                    const days = Array.from({ length: 31 }, (_, i) =>
                      (i + 1).toString().padStart(2, "0")
                    );

                    let curYear = "";
                    let curMonth = "";
                    let curDay = "";

                    if (field.value) {
                      const val: any = field.value;
                      const valStr =
                        typeof val === "string"
                          ? val.split("T")[0]
                          : typeof val?.toDate === "function"
                            ? val.toDate().toISOString().split("T")[0]
                            : val instanceof Date
                              ? val.toISOString().split("T")[0]
                              : String(val);
                      const parts = valStr.split("-");
                      curYear = parts[0] || "";
                      curMonth = parts[1] || "";
                      curDay = parts[2] || "";
                    }

                    const updateDate = (y: string, m: string, d: string) => {
                      if (!y) {
                        field.onChange(null);
                        return;
                      }
                      let val = y;
                      if (m) {
                        val += `-${m}`;
                        if (d) val += `-${d}`;
                      }
                      field.onChange(val);
                    };

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mt-0.5 mb-1.5">
                          Дата на раждане
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            onValueChange={(v) => updateDate(v, curMonth, curDay)}
                            value={curYear || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                                <SelectValue placeholder="Година" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            onValueChange={(v) =>
                              updateDate(curYear, v === "none" ? "" : v, curDay)
                            }
                            value={curMonth || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                                <SelectValue placeholder="Месец" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Месец</SelectItem>
                              {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            onValueChange={(v) =>
                              updateDate(curYear, curMonth, v === "none" ? "" : v)
                            }
                            value={curDay || "none"}
                            disabled={!curMonth}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                                <SelectValue placeholder="Ден" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Ден</SelectItem>
                              {days.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </BentoCard>
          )}

          {/* СТЪПКА 2: Контакти */}
          {step === 2 && (
            <BentoCard className="p-5 sm:p-8 border-zinc-100 shadow-none rounded-3xl sm:rounded-4xl animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <Phone className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <h3 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Стъпка 2: Контакти
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <FormField
                  name="phone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Телефон
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Имейл
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          value={field.value || ""}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Адрес
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2 pt-6 border-t border-zinc-100 mt-2">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-4">
                    Спешен Контакт
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <FormField
                      name="emergencyContactName"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                            Име на контакт
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="emergencyContactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                            Телефон на контакт
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </BentoCard>
          )}

          {/* СТЪПКА 3: Допълнителни данни */}
          {step === 3 && (
            <BentoCard className="p-5 sm:p-8 border-zinc-100 shadow-none rounded-3xl sm:rounded-4xl animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <h3 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Стъпка 3: Допълнителни данни
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <FormField
                  name="educationInstitution"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Учебно заведение
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apparelSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Размер екипировка
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. M, L, XL"
                          className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Статус
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-zinc-100">
                          <SelectItem value="active">Активен</SelectItem>
                          <SelectItem value="inactive">Неактивен</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Ниво на умения
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Избери ниво" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-zinc-100">
                          <SelectItem value="beginner">Начално</SelectItem>
                          <SelectItem value="intermediate">Средно</SelectItem>
                          <SelectItem value="advanced">Напреднало</SelectItem>
                          <SelectItem value="professional">
                            Професионално
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 pt-6 border-t border-zinc-100 mt-2">
                  <FormField
                    control={form.control}
                    name="hasSignedDeclaration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-zinc-950">
                            Декларация
                          </FormLabel>
                          <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                            Подписана декларация
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hasMedicalCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-zinc-950">
                            Медицинско
                          </FormLabel>
                          <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                            Предадено за годината
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isLicensed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-zinc-950">
                            Картотека
                          </FormLabel>
                          <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                            Картотекиран в БФБ
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                        Бележки
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={3}
                          className="rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 resize-none p-5 sm:p-6 font-light text-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400 ml-1">
                        Вътрешни бележки, видими само за администратори.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </BentoCard>
          )}
        </div>

        {/* НАВИГАЦИОННИ БУТОНИ */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-900">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="h-11 sm:h-12 px-6 rounded-xl border-zinc-200 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-zinc-50 text-zinc-500 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Назад
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-11 sm:h-12 px-6 rounded-xl border-zinc-200 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-zinc-50 text-zinc-500 flex items-center gap-2"
              >
                <X className="h-4 w-4" strokeWidth={1.5} /> Отказ
              </Button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                disabled={isSubmitting}
                className="h-11 sm:h-12 px-8 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] flex items-center gap-2"
              >
                Напред <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 sm:h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] flex items-center gap-2"
              >
                <Save className="h-4 w-4" strokeWidth={1.5} />{" "}
                {initialData ? "Запазване" : "Създаване"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

