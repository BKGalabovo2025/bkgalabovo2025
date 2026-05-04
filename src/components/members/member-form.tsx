"use client";

import { useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { Save, X, AlertCircle } from "lucide-react";
import { calculateAgeGroup } from "@/services/member-service";

const MemberFormSchema = z.object({
  firstName: z.string().min(1, "Името е задължително"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Фамилията е задължителна"),
  gender: z.enum(["male", "female"]).nullable().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  email: z.string().trim().email("Невалиден имейл").or(z.literal("")).nullable().optional(),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  educationInstitution: z.string().optional().or(z.literal("")),
  apparelSize: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"]),
  category: z.enum(["Деца", "Любители", "Състезатели", "Професионалисти"]).nullable().optional().or(z.literal("")),
  skillLevel: z.enum(["beginner", "intermediate", "advanced", "professional"]).nullable().optional().or(z.literal("")),
  ageGroup: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  familyId: z.string().optional().or(z.literal("")),
  rating: z.number().optional(),
});

export type MemberFormValues = z.infer<typeof MemberFormSchema>;

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
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberFormSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName || "",
      middleName: initialData.middleName || "",
      lastName: initialData.lastName || "",
      educationInstitution: initialData.educationInstitution || "",
      dateOfBirth: (initialData.dateOfBirth && typeof initialData.dateOfBirth === "string") 
        ? initialData.dateOfBirth.split("T")[0] 
        : "",
      gender: initialData.gender || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
      address: initialData.address || "",
      emergencyContactName: initialData.emergencyContactName || "",
      emergencyContactPhone: initialData.emergencyContactPhone || "",
      apparelSize: initialData.apparelSize || "",
      status: initialData.status || "active",
      notes: initialData.notes || "",
      familyId: initialData.familyId || "",
      skillLevel: initialData.skillLevel || "",
      rating: initialData.rating || 0,
      category: initialData.category || "",
      ageGroup: initialData.ageGroup || "",
    } : {
      firstName: "",
      middleName: "",
      lastName: "",
      educationInstitution: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      apparelSize: "",
      status: "active",
      notes: "",
      familyId: "",
      skillLevel: "",
      rating: 0,
      category: "",
      ageGroup: "",
    },
  });

  const {
    formState: { isSubmitting, errors },
    watch,
    setValue,
  } = form;

  const dateOfBirth = watch("dateOfBirth");

  // Автоматично изчисляване на възрастовата група
  useEffect(() => {
    if (dateOfBirth) {
      const calculated = calculateAgeGroup(dateOfBirth);
      if (calculated) {
        setValue("ageGroup", calculated);
      }
    }
  }, [dateOfBirth, setValue]);

  // Debug: Log form errors to console if any
  if (Object.keys(errors).length > 0) {
    console.log("Form Validation Errors:", errors);
  }

  const onSubmit = async (values: MemberFormValues) => {
    try {
      const cleanedData = {
        ...values,
        gender: values.gender === "" ? null : values.gender,
        category: values.category === "" ? null : values.category,
        skillLevel: values.skillLevel === "" ? null : values.skillLevel,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
      };
      
      await onSave(cleanedData as any);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Лична информация */}
          <Card className="lg:col-span-2 overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="font-heading text-xl">Лична информация</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                name="firstName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Име</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
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
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Презиме</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
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
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Фамилия</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Дата на раждане</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20"
                        value={(() => {
                          if (!field.value) return "";
                          const d = new Date(field.value);
                          if (isNaN(d.getTime())) return "";
                          return d.toISOString().split('T')[0];
                        })()}
                        onChange={(e) => {
                          const date = e.target.value;
                          field.onChange(date || "");
                        }}
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
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Пол</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-zinc-200">
                          <SelectValue placeholder="Избери пол" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Адрес</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Контакти */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="font-heading text-xl">Контакти</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Телефон</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
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
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Имейл</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        value={field.value || ""}
                        className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Спешен Контакт</h4>
                </div>
                <div className="space-y-4">
                  <FormField
                    name="emergencyContactName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-zinc-500 uppercase">Име</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
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
                        <FormLabel className="text-xs font-bold text-zinc-500 uppercase">Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Административни данни */}
          <Card className="lg:col-span-1 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="font-heading text-xl">Административни данни</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                name="educationInstitution"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Учебно заведение</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500" />
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
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Статус</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="inactive">Неактивен</SelectItem>
                        <SelectItem value="suspended">Спрян</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Категория</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-zinc-200">
                          <SelectValue placeholder="Избери категория" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Деца">Деца</SelectItem>
                        <SelectItem value="Любители">Любители</SelectItem>
                        <SelectItem value="Състезатели">Състезатели</SelectItem>
                        <SelectItem value="Професионалисти">Професионалисти</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Спортни данни */}
          <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="font-heading text-xl">Спортни данни</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="apparelSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Размер екипировка</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="напр. M, L, XL"
                        className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skillLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Ниво на умения</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-zinc-200">
                          <SelectValue placeholder="Избери ниво" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
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
                name="ageGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Възрастова група</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        readOnly
                        className="rounded-xl h-11 border-zinc-200 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed font-medium text-blue-600 dark:text-blue-400"
                        placeholder="Автоматично"
                      />
                    </FormControl>
                    <FormDescription>Изчислява се от датата на раждане</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-zinc-700 dark:text-zinc-300">Рейтинг (0-3000)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="rounded-xl h-11 border-zinc-200 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Бележки */}
          <Card className="lg:col-span-3 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="font-heading text-xl">Бележки</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FormField
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        rows={4} 
                        placeholder="Въведете допълнителна информация тук..."
                        className="rounded-xl border-zinc-200 focus:ring-blue-500 resize-none" 
                      />
                    </FormControl>
                    <FormDescription>
                      Вътрешни бележки, видими само за администратори.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Бутони за действие */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-destructive flex items-center mr-auto">
              <AlertCircle className="h-4 w-4 mr-2" />
              Моля, проверете полетата с грешки по-горе.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-xl h-11 px-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="mr-2 h-4 w-4" /> Отказ
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto rounded-xl h-11 px-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
            <Save className="mr-2 h-4 w-4" />{" "}
            {initialData ? "Запазване на промените" : "Създаване на член"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
