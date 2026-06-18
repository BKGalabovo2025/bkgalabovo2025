"use client";

import { UseFormReturn } from "react-hook-form";
import { BentoCard } from "@/components/ui/bento-card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";

interface MemberFormStep2Props {
  form: UseFormReturn<any>;
  isActive: boolean;
  selectedMemberType: string;
}

export function MemberFormStep2({
  form,
  isActive,
  selectedMemberType,
}: MemberFormStep2Props) {
  if (!isActive) return null;

  return (
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

        {selectedMemberType !== "guest" && (
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
        )}

        {selectedMemberType !== "guest" && (
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
        )}
      </div>
    </BentoCard>
  );
}
