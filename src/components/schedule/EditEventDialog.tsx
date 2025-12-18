
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEvent } from '@/types';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';

interface EditEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    onUpdateEvent: (eventId: string, eventData: Partial<ScheduleEvent>) => Promise<void>;
}

// Helper to format ISO string to yyyy-MM-ddTHH:mm format for the input
const toInputFormat = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
        // The format required by datetime-local input is YYYY-MM-DDTHH:mm
        return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
        console.error("Error formatting date:", error);
        return ''; // Return empty string if date is invalid
    }
};

export function EditEventDialog({ isOpen, onClose, event, onUpdateEvent }: EditEventDialogProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setType(event.type);
            setStartDate(toInputFormat(event.startDate));
            setEndDate(toInputFormat(event.endDate));
            setLocation(event.location || '');
            setDescription(event.description || '');
        } else {
            // Reset if no event is provided
            setTitle('');
            setType('');
            setStartDate('');
            setEndDate('');
            setLocation('');
            setDescription('');
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!event || !title || !type || !startDate) {
            setError('Моля, попълнете заглавие, тип и начална дата.');
            return;
        }

        setSubmitting(true);
        try {
            // Construct the payload carefully to avoid `undefined` values
            const updateData: Partial<ScheduleEvent> = {
                title,
                type: type as ScheduleEvent['type'],
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null, // Use null for empty endDate
                location,
                description,
                attendees: event.attendees || [], // Ensure attendees is an array
            };

            await onUpdateEvent(event.id, updateData);
            onClose();
        } catch (err) {
            setError('Възникна грешка при обновяването на събитието.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Редактиране на събитие</DialogTitle>
                    <DialogDescription>Променете детайлите по-долу.</DialogDescription>
                </DialogHeader>
                {event && (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-5 py-4">
                            <Input
                                placeholder="Заглавие на събитието"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <Select onValueChange={setType} value={type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Изберете тип" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="тренировка">Тренировка</SelectItem>
                                    <SelectItem value="състезание">Състезание</SelectItem>
                                    <SelectItem value="лагер">Лагер</SelectItem>
                                    <SelectItem value="събитие">Събитие</SelectItem>
                                </SelectContent>
                            </Select>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="start-date-edit">Начална дата и час</Label>
                                    <Input
                                        id="start-date-edit"
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="end-date-edit">Крайна дата и час (по желание)</Label>
                                    <Input
                                        id="end-date-edit"
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Input
                                placeholder="Място (по желание)"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <Textarea
                                placeholder="Описание (по желание)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Запазване...' : 'Запази промените'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
