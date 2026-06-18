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
        <Button className="rounded-full gap-2 bg-zinc-950 text-white hover:bg-zinc-800">
          <UserPlus className="h-4 w-4" />
          Добави член
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-4xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">
            Добавяне към семейството
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Търсене на член по име..."
              className="pl-10 h-12 rounded-2xl bg-zinc-50 border-zinc-100 focus-visible:ring-zinc-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {(() => {
              if (loading) {
                return (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
                  </div>
                );
              }
              if (filteredMembers.length === 0) {
                return (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-sm text-zinc-400">
                      Няма намерени свободни членове.
                    </p>
                    <p className="text-[10px] text-zinc-300 uppercase tracking-widest2">
                      Проверете дали членът вече не е в друго семейство
                    </p>
                  </div>
                );
              }
              return filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100 group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={member.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-zinc-100 text-zinc-500 text-xs">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                        {member.ageGroup || "Няма група"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full px-4 text-[10px] uppercase tracking-widest font-medium border-zinc-200 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
                    disabled={isSubmitting !== null}
                    onClick={() => handleAddMember(member.id)}
                  >
                    {isSubmitting === member.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
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
