"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadmintonTest } from "@/types/assessment.types";
import { Member } from "@/types/member.types";
import { getAllMembers } from "@/services/member-service";
import { addAssessment } from "@/services/assessment-service";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ConductTestDialogProps {
  test: BadmintonTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParticipantEntry = {
  memberId: string;
  scoreDisplay: string;
  scoreNum: number;
  notes: string;
};

export default function ConductTestDialog({ test, open, onOpenChange }: ConductTestDialogProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      loadMembers();
      // Initialize with one empty participant
      setParticipants([{ memberId: "", scoreDisplay: "", scoreNum: 0, notes: "" }]);
    }
  }, [open]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data.filter((m) => m.status === "active"));
    } catch (error) {
      toast.error("Грешка при зареждане на членовете");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { memberId: "", scoreDisplay: "", scoreNum: 0, notes: "" }]);
  };

  const handleRemoveParticipant = (index: number) => {
    const newP = [...participants];
    newP.splice(index, 1);
    setParticipants(newP);
  };

  const updateParticipant = (index: number, field: keyof ParticipantEntry, value: string | number) => {
    const newP = [...participants];
    newP[index] = { ...newP[index], [field]: value };
    
    // Auto-parse score Num if they typed a display score (e.g. "10" -> 10)
    if (field === "scoreDisplay") {
       const parsed = parseFloat(value as string);
       if (!isNaN(parsed)) {
         newP[index].scoreNum = parsed;
       }
    }
    setParticipants(newP);
  };

  const handleSave = async () => {
    if (!test || !user) return;
    
    // Validate
    const validParticipants = participants.filter((p) => p.memberId && p.scoreDisplay);
    if (validParticipants.length === 0) {
      toast.error("Моля, добавете поне един участник с резултат.");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = validParticipants.map((p) => {
        const member = members.find((m) => m.id === p.memberId);
        if (!member) return Promise.resolve();

        return addAssessment({
          memberId: p.memberId,
          memberName: member.name,
          date: new Date(date).toISOString(),
          testId: test.id,
          testName: test.name,
          ageGroupAtTest: test.ageGroup,
          score: p.scoreNum,
          scoreDisplay: p.scoreDisplay,
          notes: p.notes,
          recordedBy: {
            userId: user.uid,
            userName: user.displayName || user.email || "Unknown",
          },
        });
      });

      await Promise.all(promises);
      toast.success("Резултатите са запазени успешно!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при запазване на резултатите.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-bold">
              {test.ageGroup}
            </span>
            {test.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-zinc-50 p-4 rounded-xl text-sm border border-zinc-100">
            <p><strong>Цел/Правила:</strong> {test.description}</p>
            <p className="mt-2"><strong>Оценяване:</strong> {test.scoring}</p>
          </div>

          <div>
            <Label>Дата на провеждане</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="mt-1 w-full sm:w-48"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">Участници и Резултати</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddParticipant}>
                <Plus className="w-4 h-4 mr-1" />
                Добави дете
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((p, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white border border-zinc-200 p-3 rounded-lg shadow-sm">
                    <div className="flex-1 w-full">
                      <Select value={p.memberId} onValueChange={(val) => updateParticipant(index, "memberId", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Избери състезател..." />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} {m.ageGroup ? `(${m.ageGroup})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-32">
                      <Input 
                        placeholder={`Резултат (${test.scoreUnit || ""})`} 
                        value={p.scoreDisplay}
                        onChange={(e) => updateParticipant(index, "scoreDisplay", e.target.value)}
                      />
                    </div>
                    
                    <div className="flex-1 w-full">
                      <Input 
                        placeholder="Бележка (опц.)" 
                        value={p.notes}
                        onChange={(e) => updateParticipant(index, "notes", e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveParticipant(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {participants.length === 0 && (
                  <p className="text-center text-zinc-500 text-sm py-4">
                    Няма добавени участници. Натиснете "Добави дете".
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting || participants.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Запази резултатите
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
