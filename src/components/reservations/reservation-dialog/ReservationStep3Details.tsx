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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* SEARCH AND SELECT EXISTING MEMBER OR GUEST */}
      {form.watch("memberId") ? (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm uppercase">
              {form.watch("clientName")?.[0]}
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                Свързан профил
              </p>
              <h4 className="font-bold text-xs text-zinc-950 dark:text-white leading-none">
                {form.watch("clientName")}
              </h4>
              <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">
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
            className="h-8 px-3 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            Откачи
          </Button>
        </div>
      ) : (
        <div className="relative space-y-2">
          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex justify-between items-center">
            <span>Избор от съществуващи членове или гости</span>
            {membersLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
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
              className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-xs text-zinc-900"
            />
            {showMemberDropdown && searchTerm && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
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
                      className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs flex justify-between items-center transition-colors"
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
                  <div className="p-3 text-center text-zinc-400 text-xs">
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
            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {isTwoClients ? "Име на Клиент 1" : "Пълно име"}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Иван Иванов"
                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
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
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {isTwoClients ? "Телефон на Клиент 1" : "Телефон"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0888..."
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
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
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Имейл (опц.)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="email@..."
                  className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
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
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
            {form.watch("client2Id") ? (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm uppercase">
                    {form.watch("client2Name")?.[0]}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                      Свързан профил (Клиент 2)
                    </p>
                    <h4 className="font-bold text-xs text-zinc-950 dark:text-white leading-none">
                      {form.watch("client2Name")}
                    </h4>
                    <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">
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
                  className="h-8 px-3 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Откачи
                </Button>
              </div>
            ) : (
              <div className="relative space-y-2">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex justify-between items-center">
                  <span>Избор на втори клиент или гост</span>
                  {membersLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
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
                    className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-xs text-zinc-900"
                  />
                  {showMemberDropdown2 && searchTerm2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
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
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs flex justify-between items-center transition-colors"
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
                        <div className="p-3 text-center text-zinc-400 text-xs">
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Име на Клиент 2 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Петър Петров"
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Телефон на Клиент 2
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0888..."
                      className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
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
