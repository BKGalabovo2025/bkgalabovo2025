 
 
 
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  createGeneralService,
  updateGeneralService,
} from "@/lib/actions/general-services";
import { GeneralService } from "@/types";
import { UseFormReturn } from "react-hook-form";

const formSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа."),
  price: z.number().min(0, "Цената трябва да е положително число."),
  description: z.string().optional(),
  performerName: z.string().min(2, "Изпълнителят трябва да е поне 2 символа."),
  performerType: z.enum(["internal", "external"] as const),
  pricingUnit: z.enum(["fixed", "per_hour", "per_session"] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneralServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: GeneralService | null;
}

export function GeneralServiceDialog({
  open,
  onOpenChange,
  service,
}: GeneralServiceDialogProps) {
  const { idToken } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const form: UseFormReturn<FormValues> = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      performerName: "",
      performerType: "internal",
      pricingUnit: "fixed",
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        price: service.price,
        description: service.description || "",
        performerName: service.performerName,
        performerType: service.performerType,
        pricingUnit: service.pricingUnit,
      });
    } else {
      form.reset({
        name: "",
        price: 0,
        description: "",
        performerName: "",
        performerType: "internal",
        pricingUnit: "fixed",
      });
    }
  }, [service, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!idToken) return;
    setIsPending(true);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = service
        ? await updateGeneralService(service.id, idToken, {}, formData)
        : await createGeneralService(idToken, {}, formData);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message || "Грешка при запазване");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Възникна неочаквана грешка");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-zinc-950 text-white">
          <DialogTitle className="text-2xl font-light tracking-tight">
            {service ? "Редактиране на услуга" : "Нова услуга"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 font-light">
            {service
              ? "Променете детайлите на съществуващата услуга."
              : "Добавете нова услуга към каталога."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-8 space-y-6"
          >
            <FormField<FormValues, "name">
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                    Име на услугата
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="напр. Наплитане на ракета"
                      className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField<FormValues, "price">
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                      Цена (EUR)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<FormValues, "pricingUnit">
                control={form.control}
                name="pricingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                      Тип ценообразуване
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all h-12">
                          <SelectValue placeholder="Изберете тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-zinc-100">
                        <SelectItem value="fixed">Фикс. цена</SelectItem>
                        <SelectItem value="per_hour">На час</SelectItem>
                        <SelectItem value="per_session">На сесия</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField<FormValues, "performerName">
                control={form.control}
                name="performerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                      Изпълнител
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Име на изпълнител"
                        className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<FormValues, "performerType">
                control={form.control}
                name="performerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                      Тип изпълнител
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all h-12">
                          <SelectValue placeholder="Изберете тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-zinc-100">
                        <SelectItem value="internal">
                          Вътрешен (Клуб)
                        </SelectItem>
                        <SelectItem value="external">Външен</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField<FormValues, "description">
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                    Описание
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Опишете услугата..."
                      className="rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white transition-all min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-12 px-6"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl h-12 px-8 bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
              >
                {isPending ? "Запазване..." : "Запази услугата"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
