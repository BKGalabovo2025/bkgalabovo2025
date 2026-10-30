"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
import { TournamentEntrySchema } from "@/types/tournament.types";

import { SearchableMemberSelect } from "./searchable-member-select";

type EntryFormValues = z.input<typeof TournamentEntrySchema>;

import { TournamentEntry } from "@/types/tournament.types";

interface EntryFormProps {
  tournamentId: string;
  allowedCategories: string[];
  existingEntries: TournamentEntry[];
  onSave: (data: TournamentEntry | TournamentEntry[]) => Promise<void>;
  onClose: () => void;
}

export function EntryForm({
  tournamentId,
  allowedCategories,
  existingEntries,
  onSave,
  onClose,
}: EntryFormProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [p1IsGuest, setP1IsGuest] = useState(false);
  const [p2IsGuest, setP2IsGuest] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    getAllMembers().then(setMembers).catch(console.error);
  }, []);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(TournamentEntrySchema),
    defaultValues: {
      tournamentId,
      categoryId:
        (allowedCategories[0] as "singles" | "doubles" | "mixed") || "singles",
    },
  });

  const selectedCategory = form.watch("categoryId");
  const isDoubles =
    selectedCategory === "doubles" || selectedCategory === "mixed";

  // Филтриране на вече записаните членове за ТАЗИ категория
  const availableMembers = members.filter((m) => {
    const alreadyRegistered = existingEntries.some(
      (e) =>
        e.categoryId === selectedCategory &&
        (e.memberId === m.id || e.partnerMemberId === m.id)
    );
    return !alreadyRegistered;
  });

  const filteredBulkMembers = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    if (!q) return availableMembers;
    return availableMembers.filter((m) => {
      const full = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      const reversed = `${m.lastName || ""} ${m.firstName || ""}`.toLowerCase();
      const age = (m.ageGroup || "").toLowerCase();
      return full.includes(q) || reversed.includes(q) || age.includes(q);
    });
  }, [availableMembers, bulkSearch]);

  const onSubmit = async (data: EntryFormValues) => {
    setIsSubmitting(true);
    try {
      if (isBulkMode && !isDoubles) {
        // Bulk save
        const bulkData = selectedMemberIds.map((mid) => ({
          tournamentId,
          categoryId: selectedCategory,
          memberId: mid,
          registrationDate: new Date().toISOString(),
        }));
        await onSave(bulkData as TournamentEntry[]);
      } else {
        const cleanData: Partial<TournamentEntry> = { ...data };
        if (p1IsGuest) delete cleanData.memberId;
        else delete cleanData.externalName;

        if (!isDoubles) {
          delete cleanData.partnerMemberId;
          delete cleanData.partnerExternalName;
        } else {
          if (p2IsGuest) delete cleanData.partnerMemberId;
          else delete cleanData.partnerExternalName;
        }

        await onSave(cleanData as TournamentEntry);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "singles":
        return "Единично";
      case "doubles":
        return "Двойки";
      case "mixed":
        return "Смесени двойки";
      default:
        return cat;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-hidden min-h-0"
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-3 min-h-0">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold">
                  Категория
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 rounded-xl text-xs sm:text-sm">
                      <SelectValue placeholder="Изберете дисциплина" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-50 max-h-75 overflow-y-auto border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    {allowedCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryName(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3 py-2 dark:border-blue-800/60 dark:bg-blue-900/10">
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-semibold">
                Групово добавяне
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Избери няколко души наведнъж
              </p>
            </div>
            <Checkbox
              id="bulkMode"
              checked={isBulkMode}
              disabled={isDoubles}
              onCheckedChange={(checked) => setIsBulkMode(!!checked)}
            />
          </div>

          {isBulkMode && !isDoubles ? (
            <div className="space-y-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Избери участници ({selectedMemberIds.length})
                </FormLabel>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = Array.from(
                        new Set([
                          ...selectedMemberIds,
                          ...filteredBulkMembers.map((m) => m.id!),
                        ])
                      );
                      setSelectedMemberIds(allIds);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Избери всички намерени ({filteredBulkMembers.length})
                  </button>
                  {selectedMemberIds.length > 0 && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">
                        |
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMemberIds([])}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      >
                        Изчисти
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Търсачка за състезатели в групов режим */}
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  placeholder="Търсене на състезател по име..."
                  className="h-8.5 rounded-lg border-zinc-200 bg-white pr-7 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900"
                />
                {bulkSearch && (
                  <button
                    type="button"
                    onClick={() => setBulkSearch("")}
                    aria-label="Изчисти търсенето"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="custom-scrollbar max-h-60 space-y-1 overflow-y-auto pr-1">
                {filteredBulkMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center space-x-2.5 rounded-lg border border-transparent p-1.5 transition-colors hover:border-zinc-200 hover:bg-zinc-100/60 dark:hover:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <Checkbox
                      id={`member-${m.id}`}
                      checked={selectedMemberIds.includes(m.id!)}
                      onCheckedChange={(checked) => {
                        if (checked)
                          setSelectedMemberIds([...selectedMemberIds, m.id!]);
                        else
                          setSelectedMemberIds(
                            selectedMemberIds.filter((id) => id !== m.id)
                          );
                      }}
                    />
                    <label
                      htmlFor={`member-${m.id}`}
                      className="flex flex-1 cursor-pointer items-center justify-between text-xs"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {m.firstName} {m.lastName}
                      </span>
                      {m.ageGroup && (
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {m.ageGroup}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
                {filteredBulkMembers.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {bulkSearch
                      ? `Няма намерени състезатели за "${bulkSearch}"`
                      : "Няма свободни членове за тази категория."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Участник 1 */}
              <div className="space-y-2.5 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold">
                    {isDoubles ? "Играч 1" : "Състезател"}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="p1guest"
                      checked={p1IsGuest}
                      onCheckedChange={(checked) => setP1IsGuest(!!checked)}
                    />
                    <label
                      htmlFor="p1guest"
                      className="cursor-pointer text-xs leading-none font-medium"
                    >
                      Гост (Външен)
                    </label>
                  </div>
                </div>

                {!p1IsGuest ? (
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium">
                          Избери състезател
                        </FormLabel>
                        <FormControl>
                          <SearchableMemberSelect
                            value={field.value}
                            onChange={field.onChange}
                            members={availableMembers}
                            placeholder="Търсене на състезател по име..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="externalName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium">
                          Имена на госта
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-9 rounded-xl text-xs sm:text-sm"
                            placeholder="Иван Иванов"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {isDoubles && (
                <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-semibold">
                      Играч 2 (Партньор)
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="p2guest"
                        checked={p2IsGuest}
                        onCheckedChange={(checked) => setP2IsGuest(!!checked)}
                      />
                      <label
                        htmlFor="p2guest"
                        className="cursor-pointer text-xs leading-none font-medium"
                      >
                        Гост (Външен)
                      </label>
                    </div>
                  </div>

                  {!p2IsGuest ? (
                    <FormField
                      control={form.control}
                      name="partnerMemberId"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium">
                            Избери партньор
                          </FormLabel>
                          <FormControl>
                            <SearchableMemberSelect
                              value={field.value}
                              onChange={field.onChange}
                              members={availableMembers.filter(
                                (m) => m.id !== form.watch("memberId")
                              )}
                              placeholder="Търсене на партньор по име..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="partnerExternalName"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium">
                            Имена на госта
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 rounded-xl text-xs sm:text-sm"
                              placeholder="Петър Петров"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <X className="mr-1.5 size-3.5" /> Отказ
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="h-9 rounded-xl bg-zinc-900 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <Save className="mr-1.5 size-3.5" />
            {isBulkMode
              ? `Запиши ${selectedMemberIds.length} участника`
              : "Запиши участник"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
