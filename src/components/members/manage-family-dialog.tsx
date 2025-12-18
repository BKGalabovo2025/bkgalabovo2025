'use client';

import { useState, useMemo, useEffect } from 'react';
import { Member } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface ManageFamilyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedMemberIds: string[]) => void;
  currentMember: Member;
  allMembers: Member[];
}

export const ManageFamilyDialog = ({ isOpen, onClose, onSave, currentMember, allMembers }: ManageFamilyDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
        const familyMembers = allMembers.filter(m => m.familyId === currentMember.familyId && m.id !== currentMember.id);
        setSelectedIds(familyMembers.map(m => m.id));
    }
  }, [isOpen, currentMember, allMembers]);

  const filteredMembers = useMemo(() => {
    const otherMembers = allMembers.filter(m => m.id !== currentMember.id && !selectedIds.includes(m.id));
    if (!searchTerm) {
        return otherMembers;
    }
    return otherMembers.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allMembers, currentMember.id, selectedIds]);

  const handleAddMember = (memberId: string) => {
    setSelectedIds(prev => [...prev, memberId]);
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== memberId));
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const selectedMembersDetails = useMemo(() => {
      return selectedIds.map(id => allMembers.find(m => m.id === id)).filter(Boolean) as Member[];
  }, [selectedIds, allMembers]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Управление на семейство</DialogTitle>
          <DialogDescription>
            Търсете и добавяйте членове към семейството на {currentMember.firstName}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
            <Input 
                placeholder="Търсене на член по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Налични членове</h3>
            <div className="rounded-md border min-h-[120px] max-h-[200px] overflow-y-auto p-2">
                {filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span>{member.firstName} {member.lastName}</span>
                            <Button size="icon" variant="ghost" onClick={() => handleAddMember(member.id)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">
                        {searchTerm ? "Няма намерени членове." : "Всички налични членове са добавени."}
                    </p>
                )}
            </div>
        </div>

        <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Избрани членове в семейството</h3>
            <div className="rounded-md border min-h-[120px] max-h-[200px] overflow-y-auto p-2 space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span>{currentMember.firstName} {currentMember.lastName}</span>
                    <Badge variant="secondary">Текущ</Badge>
                </div>
                {selectedMembersDetails.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                        <span>{member.firstName} {member.lastName}</span>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveMember(member.id)}>
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Отказ</Button>
          <Button onClick={handleSave}>Запази промените</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
