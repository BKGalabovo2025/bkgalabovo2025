"use client";

import { useState, useEffect } from "react";
import { Member } from "@/types";
import { 
  getAllMembers, 
  linkMembersInFamily, 
  unlinkMemberFromFamily,
  getFamilyById 
} from "@/services/member-service";
import { 
  Family 
} from "@/types";
import { 
  Button 
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatFullName } from "@/lib/utils";
import { Users, UserPlus, UserMinus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FamilyManagerProps {
  currentMember: Member;
  familyMembers: Member[];
  onUpdate: () => void;
}

export const FamilyManager = ({ 
  currentMember, 
  familyMembers, 
  onUpdate 
}: FamilyManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    if (currentMember.familyId) {
      getFamilyById(currentMember.familyId).then(setFamily);
    } else {
      setFamily(null);
    }
  }, [currentMember.familyId, familyMembers]);

  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        setLoading(true);
        try {
          const members = await getAllMembers();
          // Filter out current member and existing family members
          const filtered = members.filter(m => 
            m.id !== currentMember.id && 
            !familyMembers.some(fm => fm.id === m.id)
          );
          setAllMembers(filtered);
        } catch (error) {
          toast.error("Грешка при зареждане на членовете");
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [isOpen, currentMember.id, familyMembers]);

  const filteredMembers = allMembers.filter(m => 
    formatFullName(m).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLink = async (targetMember: Member) => {
    setProcessing(targetMember.id);
    try {
      // Use current member's familyId if exists, otherwise generate new one
      const familyId = currentMember.familyId || undefined;
      await linkMembersInFamily([currentMember.id, targetMember.id], familyId);
      toast.success(`${formatFullName(targetMember)} е добавен към семейството`);
      onUpdate();
      setIsOpen(false);
    } catch (error) {
      toast.error("Грешка при свързване");
    } finally {
      setProcessing(null);
    }
  };

  const handleUnlink = async (memberId: string, name: string) => {
    if (!confirm(`Сигурни ли сте, че искате да премахнете ${name} от семейството?`)) return;
    setProcessing(memberId);
    try {
      await unlinkMemberFromFamily(memberId);
      toast.success(`${name} е премахнат от семейството`);
      onUpdate();
    } catch (error) {
      toast.error("Грешка при премахване");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Семейни връзки
          </h3>
          {family && (
            <p className="text-xs text-zinc-500 font-medium ml-7">{family.name}</p>
          )}
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <UserPlus className="h-4 w-4 mr-2" />
              Добави член
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>Добавяне на член към семейството</DialogTitle>
            </DialogHeader>
            <div className="relative my-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Търсене по име..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl"
              />
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center py-10 text-zinc-500 italic">Няма намерени членове</p>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={m.avatarUrl || ""} />
                          <AvatarFallback>{getInitials(formatFullName(m))}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{formatFullName(m)}</p>
                          <p className="text-xs text-zinc-500">{m.category || "Без категория"}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleLink(m)}
                        disabled={processing === m.id}
                        className="rounded-xl font-bold"
                      >
                        {processing === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Свържи"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {familyMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {familyMembers.map((fm) => (
            <div key={fm.id} className="group relative flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-800 shadow-sm">
                  <AvatarImage src={fm.avatarUrl || ""} />
                  <AvatarFallback>{getInitials(formatFullName(fm))}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-black text-sm text-zinc-900 dark:text-white">{formatFullName(fm)}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">{fm.category || "Член"}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleUnlink(fm.id, formatFullName(fm))}
                disabled={processing === fm.id}
                className="h-8 w-8 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50"
              >
                {processing === fm.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-[2rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm italic font-medium">Няма свързани членове на семейството.</p>
        </div>
      )}
    </div>
  );
};
