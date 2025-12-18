'use client';

import { useState, useEffect } from 'react';
import { Member } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFamilyById } from '@/services/family-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ManageFamilyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // The onSave function expects the list of OTHER member IDs, excluding the current one.
  onSave: (otherMemberIds: string[]) => void;
  currentMember: Member;
  allMembers: Member[];
}

export const ManageFamilyDialog = ({ isOpen, onClose, onSave, currentMember, allMembers }: ManageFamilyDialogProps) => {
  // This state holds the full list of members that will be in the family.
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Effect to initialize the selected members when the dialog opens.
  useEffect(() => {
    if (isOpen) {
        // Always start with the current member in the list.
        const initialSelection = [currentMember];

        const fetchFamily = async () => {
            if (currentMember.familyId) {
                const family = await getFamilyById(currentMember.familyId);
                if (family) {
                    const familyMembers = allMembers.filter(m => 
                        family.memberIds.includes(m.id) && m.id !== currentMember.id
                    );
                    setSelectedMembers([...initialSelection, ...familyMembers]);
                } else {
                    setSelectedMembers(initialSelection);
                }
            } else {
                setSelectedMembers(initialSelection);
            }
        };

        fetchFamily();
    }
  }, [isOpen, currentMember, allMembers]);

  const addMember = (member: Member) => {
    setSelectedMembers(prev => [...prev, member]);
  };

  const removeMember = (memberId: string) => {
    // Prevent the current member from being removed.
    if (memberId === currentMember.id) return;
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSave = () => {
    // Extract IDs, excluding the current member as the parent logic handles it.
    const otherMemberIds = selectedMembers
        .filter(m => m.id !== currentMember.id)
        .map(m => m.id);
    onSave(otherMemberIds);
    onClose();
  };

  // Filter members available for adding: not the current one, not already selected, and matches search.
  const availableMembers = allMembers.filter(m => 
    !selectedMembers.some(sm => sm.id === m.id) &&
    (m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Управление на семейство</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <Input 
                placeholder="Търсене на член по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <h3 className="text-sm font-medium text-muted-foreground">Налични членове</h3>
            <ScrollArea className="rounded-md border p-2 h-32">
                {searchTerm && availableMembers.length > 0 ? (
                    availableMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                            <span>{member.firstName} {member.lastName}</span>
                            <Button size="sm" variant="outline" onClick={() => addMember(member)}>+</Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">
                        {searchTerm ? 'Няма намерени членове.' : 'Започнете да пишете, за да търсите.'}
                    </p>
                )}
            </ScrollArea>

            <h3 className="text-sm font-medium text-muted-foreground">Избрани членове в семейството</h3>
            <ScrollArea className="rounded-md border p-2 h-32">
                 {selectedMembers.length > 0 ? (
                    selectedMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                            <span className="flex items-center">
                                {member.firstName} {member.lastName}
                                {member.id === currentMember.id && <Badge variant="secondary" className="ml-2">Текущ</Badge>}
                            </span>
                            {member.id !== currentMember.id && (
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeMember(member.id)}>X</Button>
                            )}
                        </div>
                    ))
                 ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">Няма избрани членове.</p>
                 )}
            </ScrollArea>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Отказ</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Запази промените</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
