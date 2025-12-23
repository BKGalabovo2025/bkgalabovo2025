
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEvent, ScheduleEventType } from '@/types';
import { Label } from '@/components/ui/label';

interface CreateEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddEvent: (event: Omit<ScheduleEvent, 'id' | 'color' | 'attendees'>) => Promise<void>;
}

export function CreateEventDialog({ isOpen, onClose, onAddEvent }: CreateEventDialogProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ScheduleEventType>('trening');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setTitle('');
        setType('trening');
        setStartDate('');
        setEndDate('');
        setLocation('');
        setDescription('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title || !type || !startDate) {
            setError('Моля, попълнете заглавие, тип и начална дата.');
            return;
        }

        setSubmitting(true);
        try {
            const newEvent: Omit<ScheduleEvent, 'id' | 'color' | 'attendees'> = {
                title,
                type,
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                location,
                description,
            };
            await onAddEvent(newEvent);
            resetForm();
            onClose();
        } catch (err) {
            setError('Възникна грешка при създаването на събитието.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Създаване на ново събитие</DialogTitle>
                    <DialogDescription>Попълнете детайлите по-долу, за да добавите ново събитие към графика.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 py-4">
                        <Input
                            placeholder="Заглавие на събитието"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <Select onValueChange={(value) => setType(value as ScheduleEventType)} value={type}>
                            <SelectTrigger>
                                <SelectValue placeholder="Изберете тип" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="trening">Тренировка</SelectItem>
                                <SelectItem value="sastezanie">Състезание</SelectItem>
                                <SelectItem value="lager">Лагер</SelectItem>
                                <SelectItem value="sabitie">Събитие</SelectItem>
                            </SelectContent>
                        </Select>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="start-date-create">Начална дата и час</Label>
                                <Input
                                    id="start-date-create"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="end-date-create">Крайна дата и час (по желание)</Label>
                                <Input
                                    id="end-date-create"
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
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            Отказ
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Създаване...' : 'Създай събитие'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
