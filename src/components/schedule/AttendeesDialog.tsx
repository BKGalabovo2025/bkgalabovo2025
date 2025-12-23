
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Member, ScheduleEvent } from '@/types';
import { Input } from '@/components/ui/input';

interface AttendeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    members: Member[];
    onUpdateAttendees: (eventId: string, attendeeIds: string[]) => Promise<void>;
}

export function AttendeesDialog({ isOpen, onClose, event, members, onUpdateAttendees }: AttendeesDialogProps) {
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (event?.attendees) {
            setSelectedAttendees(event.attendees);
        } else {
            setSelectedAttendees([]);
        }
    }, [event]);

    const handleAttendeeToggle = (memberId: string) => {
        setSelectedAttendees(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId) 
                : [...prev, memberId]
        );
    };

    const handleSave = async () => {
        if (!event) return;
        setSubmitting(true);
        try {
            await onUpdateAttendees(event.id, selectedAttendees);
            onClose();
        } catch (error) {
            console.error("Failed to update attendees", error);
            // Optionally show a toast notification for the error
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = () => {
        const allVisibleMemberIds = filteredMembers.map(m => m.id);
        setSelectedAttendees(allVisibleMemberIds);
    };

    const handleDeselectAll = () => {
        setSelectedAttendees([]);
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Управление на присъствия</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input 
                        placeholder="Търсене на състезател..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            {selectedAttendees.length} / {members.length} избрани
                        </p>
                        <div className="flex gap-2">
                            <Button variant="link" size="sm" onClick={handleSelectAll} disabled={filteredMembers.length === 0}>Избери всички видими</Button>
                            <Button variant="link" size="sm" onClick={handleDeselectAll} disabled={selectedAttendees.length === 0}>Премахни всички</Button>
                        </div>
                    </div>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        {filteredMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between mb-2">
                                <label htmlFor={member.id} className="flex items-center space-x-3 cursor-pointer">
                                    <Checkbox 
                                        id={member.id} 
                                        checked={selectedAttendees.includes(member.id)}
                                        onCheckedChange={() => handleAttendeeToggle(member.id)}
                                    />
                                    <span className="text-sm font-medium">{member.firstName} {member.lastName}</span>
                                </label>
                            </div>
                        ))}
                         {filteredMembers.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">Няма намерени състезатели.</p>
                        )}
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Отказ</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Запазване...' : 'Запази'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
