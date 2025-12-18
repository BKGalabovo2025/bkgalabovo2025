
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEvent } from '@/types';
import { DateSelectArg } from '@fullcalendar/interaction';

interface AddEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddEvent: (newEvent: Omit<ScheduleEvent, 'id'>) => void;
    selectInfo: DateSelectArg;
}

export function AddEventDialog({ isOpen, onClose, onAddEvent, selectInfo }: AddEventDialogProps) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const type = formData.get('type') as string;

        // The selectInfo object from the `select` callback has `start` and `end` Date objects.
        const startDate = selectInfo.start;
        const endDate = selectInfo.end;

        if (!title || !type || !startDate) {
            console.error("AddEventDialog: Missing title, type, or startDate on submit.");
            // You can add a toast notification here to inform the user.
            return;
        }

        onAddEvent({
            title,
            type,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            description: '',
            coach: '',
            location: '',
            color: '' // Color will be set by the service
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details for your new event. Click Add Event when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" name="title" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select name="type" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="training">Training</SelectItem>
                                    <SelectItem value="competition">Competition</SelectItem>
                                    <SelectItem value="camp">Camp</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Add Event</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
