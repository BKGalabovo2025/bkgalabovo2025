"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TournamentEntrySchema } from "@/types/tournament.types";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, X } from "lucide-react";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
import { Checkbox } from "@/components/ui/checkbox";

type EntryFormValues = z.input<typeof TournamentEntrySchema>;

import { TournamentEntry } from "@/types/tournament.types";

interface EntryFormProps {
  tournamentId: string;
  allowedCategories: string[];
  existingEntries: TournamentEntry[];
  onSave: (data: any | any[]) => Promise<void>;
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    getAllMembers().then(setMembers).catch(console.error);
  }, []);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(TournamentEntrySchema) as any,
    defaultValues: {
      tournamentId,
      categoryId: (allowedCategories[0] as any) || "singles",
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
        await onSave(bulkData);
      } else {
        const cleanData: any = { ...data };
        if (p1IsGuest) delete cleanData.memberId;
        else delete cleanData.externalName;

        if (!isDoubles) {
          delete cleanData.partnerMemberId;
          delete cleanData.partnerExternalName;
        } else {
          if (p2IsGuest) delete cleanData.partnerMemberId;
          else delete cleanData.partnerExternalName;
        }

        await onSave(cleanData);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категория</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете дисциплина" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 z-50 max-h-[300px] overflow-y-auto">
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

        <div className="flex items-center justify-between gap-4 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Групово добавяне</h4>
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
          <div className="border rounded-md p-4 space-y-4">
            <FormLabel>Избери участници ({selectedMemberIds.length})</FormLabel>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {availableMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md transition-colors border border-transparent hover:border-border"
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
                    className="text-sm cursor-pointer flex-1"
                  >
                    {m.firstName} {m.lastName}
                  </label>
                </div>
              ))}
              {availableMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Няма свободни членове за тази категория.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Участник 1 */}
            <div className="border p-4 rounded-md space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
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
                    className="text-sm font-medium leading-none cursor-pointer"
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
                    <FormItem>
                      <FormLabel>Избери член на клуба</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Търсене..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 z-50 max-h-[300px] overflow-y-auto">
                          {availableMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id as string}>
                              {m.firstName} {m.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="externalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имена на госта</FormLabel>
                      <FormControl>
                        <Input placeholder="Иван Иванов" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Участник 2 (Само за двойки) */}
            {isDoubles && (
              <div className="border p-4 rounded-md space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Играч 2 (Партньор)</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="p2guest"
                      checked={p2IsGuest}
                      onCheckedChange={(checked) => setP2IsGuest(!!checked)}
                    />
                    <label
                      htmlFor="p2guest"
                      className="text-sm font-medium leading-none cursor-pointer"
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
                      <FormItem>
                        <FormLabel>Избери член на клуба</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Търсене..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 z-50 max-h-[300px] overflow-y-auto">
                            {availableMembers.map((m) => (
                              <SelectItem key={m.id} value={m.id as string}>
                                {m.firstName} {m.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="partnerExternalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имена на госта</FormLabel>
                        <FormControl>
                          <Input placeholder="Петър Петров" {...field} />
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

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" /> Отказ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Запиши участник
          </Button>
        </div>
      </form>
    </Form>
  );
}
