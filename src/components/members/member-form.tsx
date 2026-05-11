"use client";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

import { cn } from "@/lib/utils";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
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
  initialData?: Member;
}

export const MemberForm = ({
  onSave,
  onClose,
  initialData,
}: MemberFormProps) => {
  const { activeBranch } = useAppStore();
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberFormSchema) as any,
    defaultValues: initialData || {
      siteId: activeBranch,
      firstName: "",
      middleName: "",
      lastName: "",
      personalId: "",
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
      rating: undefined,
      hasSignedDeclaration: false,
      hasMedicalCertificate: false,
      isLicensed: false,
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: MemberFormValues) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основна информация */}
          <BentoCard className="lg:col-span-2 p-8 border-zinc-100 shadow-none rounded-4xl">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-6">
              Основна информация
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                name="firstName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Име
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Презиме
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Фамилия
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </BentoCard>

          {/* Контактна информация */}
          <BentoCard className="p-8 border-zinc-100 shadow-none rounded-4xl">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-6">
              Контакт
            </h3>
            <div className="space-y-6">
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Телефон
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Имейл
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-6 border-t border-zinc-100 mt-6">
                <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-4">
                  Спешен Контакт
                </h4>
                <div className="grid gap-6">
                  <FormField
                    name="emergencyContactName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                          Име на контакт
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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
                        <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                          Телефон на контакт
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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

          {/* Лични данни */}
          <BentoCard className="lg:col-span-3 p-8 border-zinc-100 shadow-none rounded-4xl">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-6">
              Лични данни
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <FormField
                name="personalId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      ЕГН
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="educationInstitution"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Учебно заведение
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mt-0.5 mb-1.5">
                      Дата на раждане
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-12 pl-4 text-left font-light rounded-xl border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50",
                              !field.value && "text-zinc-400"
                            )}
                          >
                            {field.value &&
                            !isNaN(new Date(field.value).getTime()) ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Избери дата</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 rounded-2xl border-zinc-100"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            field.value &&
                            !isNaN(new Date(field.value).getTime())
                              ? new Date(field.value)
                              : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Пол
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0">
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
                name="address"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Адрес
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </BentoCard>

          {/* Административна информация */}
          <BentoCard className="lg:col-span-3 p-8 border-zinc-100 shadow-none rounded-4xl">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-6">
              Административна информация
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="apparelSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Размер екипировка
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="напр. M, L, XL"
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
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
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Статус
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0">
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
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Ниво на умения
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0">
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
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Рейтинг (0-3000)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-zinc-100">
                <FormField
                  control={form.control}
                  name="hasSignedDeclaration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-6 bg-zinc-50/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-zinc-950">
                          Подписана декларация
                        </FormLabel>
                        <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                          Има ли подписана декларация
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasMedicalCertificate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-6 bg-zinc-50/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5 rounded-md border-zinc-200 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-zinc-950">
                          Медицинско свидетелство
                        </FormLabel>
                        <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                          Предадено за текущата година
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isLicensed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-6 bg-zinc-50/30">
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
                          Картотекиран в БФБ за годината
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
                  <FormItem className="sm:col-span-4">
                    <FormLabel className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Бележки
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={4}
                        className="rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 resize-none p-6 font-light"
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
        </div>

        {/* Бутони за действие */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl border-zinc-200 text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-zinc-50"
          >
            <X className="mr-2 h-4 w-4" strokeWidth={1.5} /> Отказ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 text-[11px] font-medium uppercase tracking-[0.2em]"
          >
            <Save className="mr-2 h-4 w-4" strokeWidth={1.5} />{" "}
            {initialData ? "Запазване" : "Създаване"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
