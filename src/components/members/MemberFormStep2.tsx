"use client";

import { Phone } from "lucide-react";
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

import { MemberFormValues } from "./member-form-types";

interface MemberFormStep2Props {
  form: UseFormReturn<MemberFormValues>;
  isActive: boolean;
}

export function MemberFormStep2({ form, isActive }: MemberFormStep2Props) {
  if (!isActive) return null;

  const isGuest = form.watch("isGuest");
  const isClubMember = form.watch("isClubMember");
  const isRecoveryMember = form.watch("isRecoveryMember");
  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember;

  return (
    <BentoCard className="rounded-3xl border-zinc-100 p-5 shadow-none duration-300 animate-in fade-in slide-in-from-right-4 sm:rounded-4xl sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Phone className="size-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
          Стъпка 2: Контакти
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField
          name="phone"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Телефон
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
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
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Имейл
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  value={field.value || ""}
                  className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isGuestOnly && (
          <FormField
            name="address"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                  Адрес
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isGuestOnly && (
          <div className="mt-2 border-t border-zinc-100 pt-6 sm:col-span-2">
            <h4 className="mb-4 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
              Спешен Контакт
            </h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              <FormField
                name="emergencyContactName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                      Име на контакт
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
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
                    <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                      Телефон на контакт
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {!isGuestOnly && (
          <div className="mt-4 border-t border-zinc-100 pt-6 sm:col-span-2">
            <h4 className="mb-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
              Родители / Законни представители (за договори и картотеки)
            </h4>
            <p className="mb-4 text-[10px] text-zinc-500">
              Данните се извличат автоматично за Договора за аматьорски статут,
              Молбата за картотекиране и Декларацията за пътуване.
            </p>

            {/* Баща */}
            <div className="mb-5 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
              <h5 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                1. Данни за Баща
              </h5>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  name="fatherName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Име, презиме, фамилия
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Трите имена по лична карта"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="fatherEGN"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        ЕГН на баща
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="10-цифрено ЕГН"
                          maxLength={10}
                          className="h-10 rounded-xl border-zinc-200 bg-white font-mono text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="fatherPhone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Телефон
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. 0888 123 456"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="fatherCity"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Жител на (гр./с., адрес)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. гр. Гълъбово"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Майка */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
              <h5 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                2. Данни за Майка
              </h5>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  name="motherName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Име, презиме, фамилия
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Трите имена по лична карта"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="motherEGN"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        ЕГН на майка
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="10-цифрено ЕГН"
                          maxLength={10}
                          className="h-10 rounded-xl border-zinc-200 bg-white font-mono text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="motherPhone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Телефон
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. 0888 654 321"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="motherCity"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Жител на (гр./с., адрес)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. гр. Гълъбово"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
