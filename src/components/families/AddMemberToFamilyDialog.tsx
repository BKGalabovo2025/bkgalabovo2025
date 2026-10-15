"use client";

import { Loader2, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import { addMemberToFamilyAction } from "@/lib/actions/families";

interface AddMemberToFamilyDialogProps {
  familyId: string;
  existingMemberIds: string[];
  onSuccess?: () => void;
}

export function AddMemberToFamilyDialog({
  familyId,
  existingMemberIds,
  onSuccess,
}: AddMemberToFamilyDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { members, loading } = useMembers();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const availableMembers = members.filter(
    (m) => !existingMemberIds.includes(m.id) && !m.familyId
  );

  const filteredMembers = availableMembers.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = async (memberId: string) => {
    if (!user) {
      toast.error("Трябва да сте влезли в системата.");
      return;
    }

    setIsSubmitting(memberId);
    try {
      const idToken = await user.getIdToken();
      const result = await addMemberToFamilyAction(familyId, memberId, idToken);

      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при добавянето.");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full bg-zinc-950 text-white hover:bg-zinc-800">
          <UserPlus className="size-4" />
          Добави член
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-800">
              <UserPlus className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                Добавяне към семейството
              </DialogTitle>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Изберете свободен член за добавяне
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 pb-2 border-b border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Търсене на член по име..."
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-10 text-xs focus-visible:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 space-y-2 min-h-0">
          {(() => {
            if (loading) {
              return (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-zinc-200" />
                </div>
              );
            }
            if (filteredMembers.length === 0) {
              return (
                <div className="space-y-2 py-12 text-center">
                  <p className="text-sm text-zinc-400">
                    Няма намерени свободни членове.
                  </p>
                  <p className="tracking-widest text-[10px] text-zinc-300 uppercase">
                    Проверете дали членът вече не е в друго семейство
                  </p>
                </div>
              );
            }
            return filteredMembers.map((member) => (
              <div
                key={member.id}
                className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition-all hover:border-zinc-100 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border-2 border-white shadow-sm dark:border-zinc-800">
                    <AvatarImage src={member.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-[10px] tracking-widest text-zinc-400 uppercase">
                      {member.ageGroup || "Няма група"}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase transition-all hover:border-zinc-950 hover:bg-zinc-950 hover:text-white dark:border-zinc-700 dark:hover:bg-white dark:hover:text-zinc-950"
                  disabled={isSubmitting !== null}
                  onClick={() => handleAddMember(member.id)}
                >
                  {isSubmitting === member.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Добави"
                  )}
                </Button>
              </div>
            ));
          })()}
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-xl px-5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            onClick={() => setOpen(false)}
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
