
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Member, ScheduleEvent } from '@/types';
import { useMembers } from '@/hooks/useMembers';
import { Label } from '@/components/ui/label';

interface AttendeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    onUpdateAttendees: (eventId: string, attendeeIds: string[]) => Promise<void>;
}

export function AttendeesDialog({ isOpen, onClose, event, onUpdateAttendees }: AttendeesDialogProps) {
    const { members, isLoading: isLoadingMembers } = useMembers();
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
    const [isSubmitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (event?.attendees) {
            setSelectedAttendees(event.attendees);
        } else {
            setSelectedAttendees([]);
        }
    }, [event]);

    const handleToggleAttendee = (memberId: string) => {
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
            // Optionally, show an error message to the user
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Управление на присъстващи</DialogTitle>
                    <DialogDescription>Изберете кои членове са присъствали на "{event?.title}".</DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-72 w-full rounded-md border p-4">
                    {isLoadingMembers ? (
                        <p>Зареждане на членовете...</p>
                    ) : members.length > 0 ? (
                        members.map(member => (
                            <div key={member.id} className="flex items-center space-x-3 mb-3">
                                <Checkbox
                                    id={`member-${member.id}`}
                                    checked={selectedAttendees.includes(member.id)}
                                    onCheckedChange={() => handleToggleAttendee(member.id)}
                                />
                                <Label htmlFor={`member-${member.id}`} className="font-normal">
                                    {member.firstName} {member.lastName}
                                </Label>
                            </div>
                        ))
                    ) : (
                        <p>Няма намерени активни членове.</p>
                    )}
                </ScrollArea>
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Отказ
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Запазване...' : 'Запази'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
