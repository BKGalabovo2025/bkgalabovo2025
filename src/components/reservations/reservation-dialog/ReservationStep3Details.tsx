"use client";

import React, { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useReservationDialog } from "./ReservationDialogContext";

export const ReservationStep3Details = () => {
  const [searchTerm2, setSearchTerm2] = useState("");
  const [showMemberDropdown2, setShowMemberDropdown2] = useState(false);
  const {
    form,
    isTwoClients,
    membersLoading,
    searchTerm,
    setSearchTerm,
    showMemberDropdown,
    setShowMemberDropdown,
    members,
  } = useReservationDialog();

  return (
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-right-4">
      {/* SEARCH AND SELECT EXISTING MEMBER OR GUEST */}
      {form.watch("memberId") ? (
        <div className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 duration-200 animate-in fade-in zoom-in-95 dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 uppercase">
              {form.watch("clientName")?.[0]}
            </div>
            <div>
              <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-emerald-600 uppercase">
                Свързан профил
              </p>
              <h4 className="text-xs leading-none font-bold text-zinc-950 dark:text-white">
                {form.watch("clientName")}
              </h4>
              <p className="mt-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                {form.watch("clientPhone")} •{" "}
                {form.watch("clientEmail") || "Няма имейл"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.setValue("memberId", undefined);
              form.setValue("clientName", "");
              form.setValue("clientPhone", "");
              form.setValue("clientEmail", "");
              setSearchTerm("");
            }}
            className="h-8 rounded-lg px-3 text-[10px] font-black tracking-wider text-rose-500 uppercase transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            Откачи
          </Button>
        </div>
      ) : (
        <div className="relative space-y-2">
          <FormLabel className="flex items-center justify-between text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            <span>Избор от съществуващи членове или гости</span>
            {membersLoading && (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            )}
          </FormLabel>
          <div className="relative">
            <Input
              placeholder="Търсене на регистриран член или гост по име..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs text-zinc-900 focus:bg-white focus:ring-0"
            />
            {showMemberDropdown && searchTerm && (
              <div className="absolute z-50 mt-1 max-h-48 w-full divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950">
                {members
                  .filter(
                    (m) =>
                      m.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      (m.phone && m.phone.includes(searchTerm))
                  )
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        form.setValue("clientName", m.name || "");
                        form.setValue("clientPhone", m.phone || "");
                        form.setValue("clientEmail", m.email || "");
                        form.setValue("memberId", m.id);
                        setSearchTerm(m.name || "");
                        setShowMemberDropdown(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {m.phone || "Няма тел."}{" "}
                        {m.isGuest ? "• Гост" : "• Член"}
                      </span>
                    </button>
                  ))}
                {members.filter(
                  (m) =>
                    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (m.phone && m.phone.includes(searchTerm))
                ).length === 0 && (
                  <div className="p-3 text-center text-xs text-zinc-400">
                    Няма намерени резултати
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="clientName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              {isTwoClients ? "Име на Клиент 1" : "Пълно име"}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Иван Иванов"
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-900 transition-all focus:bg-white focus:ring-0"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                {isTwoClients ? "Телефон на Клиент 1" : "Телефон"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0888..."
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-900 transition-all focus:bg-white focus:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Имейл (опц.)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="email@..."
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-900 transition-all focus:bg-white focus:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {isTwoClients && (
        <>
          <div className="space-y-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {form.watch("client2Id") ? (
              <div className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 duration-200 animate-in fade-in zoom-in-95 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 uppercase">
                    {form.watch("client2Name")?.[0]}
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-emerald-600 uppercase">
                      Свързан профил (Клиент 2)
                    </p>
                    <h4 className="text-xs leading-none font-bold text-zinc-950 dark:text-white">
                      {form.watch("client2Name")}
                    </h4>
                    <p className="mt-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                      {form.watch("client2Phone")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    form.setValue("client2Id", undefined);
                    form.setValue("client2Name", "");
                    form.setValue("client2Phone", "");
                    setSearchTerm2("");
                  }}
                  className="h-8 rounded-lg px-3 text-[10px] font-black tracking-wider text-rose-500 uppercase transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Откачи
                </Button>
              </div>
            ) : (
              <div className="relative space-y-2">
                <FormLabel className="flex items-center justify-between text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  <span>Избор на втори клиент или гост</span>
                  {membersLoading && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                </FormLabel>
                <div className="relative">
                  <Input
                    placeholder="Търсене на регистриран член или гост по име..."
                    value={searchTerm2}
                    onChange={(e) => {
                      setSearchTerm2(e.target.value);
                      setShowMemberDropdown2(true);
                    }}
                    onFocus={() => setShowMemberDropdown2(true)}
                    className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs text-zinc-900 focus:bg-white focus:ring-0"
                  />
                  {showMemberDropdown2 && searchTerm2 && (
                    <div className="absolute z-50 mt-1 max-h-48 w-full divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950">
                      {members
                        .filter(
                          (m) =>
                            m.name
                              ?.toLowerCase()
                              .includes(searchTerm2.toLowerCase()) ||
                            (m.phone && m.phone.includes(searchTerm2))
                        )
                        .map((m) => (
                          <button
                            key={`client2-${m.id}`}
                            type="button"
                            onClick={() => {
                              form.setValue("client2Name", m.name || "");
                              form.setValue("client2Phone", m.phone || "");
                              form.setValue("client2Id", m.id);
                              setSearchTerm2(m.name || "");
                              setShowMemberDropdown2(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          >
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {m.phone || "Няма тел."}{" "}
                              {m.isGuest ? "• Гост" : "• Член"}
                            </span>
                          </button>
                        ))}
                      {members.filter(
                        (m) =>
                          m.name?.toLowerCase().includes(searchTerm2.toLowerCase()) ||
                          (m.phone && m.phone.includes(searchTerm2))
                      ).length === 0 && (
                        <div className="p-3 text-center text-xs text-zinc-400">
                          Няма намерени резултати
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="client2Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Име на Клиент 2 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Петър Петров"
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-900 transition-all focus:bg-white focus:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client2Phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                    Телефон на Клиент 2
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0888..."
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-900 transition-all focus:bg-white focus:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};
