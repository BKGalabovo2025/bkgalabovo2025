 
 
 
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";
import { addMemberToFamilyAction } from "@/lib/actions/families";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

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
      <DialogContent className="rounded-4xl border-none shadow-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">
            Добавяне към семейството
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Търсене на член по име..."
              className="h-12 rounded-2xl border-zinc-100 bg-zinc-50 pl-10 focus-visible:ring-zinc-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="custom-scrollbar max-h-100 space-y-2 overflow-y-auto pr-2">
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
                    <p className="tracking-widest2 text-[10px] text-zinc-300 uppercase">
                      Проверете дали членът вече не е в друго семейство
                    </p>
                  </div>
                );
              }
              return filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition-all hover:border-zinc-100 hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border-2 border-white shadow-sm">
                      <AvatarImage src={member.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-zinc-100 text-xs text-zinc-500">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">
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
                    className="h-8 rounded-full border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase transition-all hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
