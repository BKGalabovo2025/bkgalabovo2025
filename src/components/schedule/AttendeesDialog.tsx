'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Member, ScheduleEvent } from '@/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface AttendeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    members: Member[];
    onUpdateAttendees: (eventId: string, attendeeIds: string[]) => Promise<void>;
}

export const AttendeesDialog: React.FC<AttendeesDialogProps> = ({ isOpen, onClose, event, members, onUpdateAttendees }) => {
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (event) {
            setSelectedAttendees(event.attendees?.map(a => a.memberId) || []);
        }
    }, [event]);

    const handleToggleAttendee = (memberId: string) => {
        setSelectedAttendees(prev => 
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };
    
    const handleSelectAll = () => {
        const allVisibleMemberIds = filteredMembers.map(m => m.id);
        const allSelected = allVisibleMemberIds.every(id => selectedAttendees.includes(id));
        if (allSelected) {
            setSelectedAttendees(prev => prev.filter(id => !allVisibleMemberIds.includes(id)));
        } else {
            setSelectedAttendees(prev => [...new Set([...prev, ...allVisibleMemberIds])]);
        }
    };

    const handleSubmit = async () => {
        if (!event) return;
        setIsSubmitting(true);
        try {
            await onUpdateAttendees(event.id, selectedAttendees);
            onClose();
        } catch (error) {
            console.error("Failed to update attendees", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const filteredMembers = members.filter(member => 
        member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Управление на присъстващи</DialogTitle>
                    <DialogDescription>
                        Изберете членовете, които са присъствали на събитието "{event?.title || ''}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input 
                        placeholder="Търсене по име..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                         <Checkbox
                            id="select-all"
                            checked={filteredMembers.length > 0 && filteredMembers.every(m => selectedAttendees.includes(m.id))}
                            onCheckedChange={handleSelectAll}
                        />
                        <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Избери всички видими
                        </label>
                    </div>
                    <ScrollArea className="h-64 border rounded-md">
                        <div className="p-4 space-y-2">
                            {filteredMembers.map(member => (
                                <div key={member.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`member-${member.id}`}
                                        checked={selectedAttendees.includes(member.id)}
                                        onCheckedChange={() => handleToggleAttendee(member.id)}
                                    />
                                    <label 
                                        htmlFor={`member-${member.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {member.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Отказ</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Запазване...</> : 'Запази'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
