
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getDaysInMonth, set, getDay, addMonths, format } from 'date-fns';
import { ScheduleEvent, ScheduleEventType } from '@/types';
import { Label } from '@/components/ui/label';

interface MonthlyScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (events: Omit<ScheduleEvent, 'id'>[]) => Promise<void>;
}

const weekDays = [
    { id: 1, name: 'Понеделник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Сряда' },
    { id: 4, name: 'Четвъртък' },
    { id: 5, name: 'Петък' },
    { id: 6, name: 'Събота' },
    { id: 0, name: 'Неделя' },
];

export function MonthlyScheduleDialog({ isOpen, onClose, onGenerate }: MonthlyScheduleDialogProps) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedDay, setSelectedDay] = useState(1); // Monday
    const [time, setTime] = useState('18:00');
    const [title, setTitle] = useState('Тренировка');
    const [type, setType] = useState<ScheduleEventType>('trening');
    const [isSubmitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthDate = new Date(year, month - 1);
        const daysInMonth = getDaysInMonth(monthDate);
        const newEvents: Omit<ScheduleEvent, 'id'>[] = [];

        for (let i = 1; i <= daysInMonth; i++) {
            let currentDate = new Date(year, month - 1, i);
            if (getDay(currentDate) === selectedDay) {
                const [hours, minutes] = time.split(':').map(Number);
                const eventDate = set(currentDate, { hours, minutes });

                newEvents.push({
                    title: title || 'Тренировка',
                    type: type,
                    startDate: eventDate.toISOString(),
                    endDate: set(eventDate, { hours: hours + 1 }).toISOString(), // Assuming 1 hour duration
                });
            }
        }

        await onGenerate(newEvents);
        setSubmitting(false);
        onClose();
    };

    const availableMonths = Array.from({ length: 6 }, (_, i) => addMonths(new Date(), i));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Генериране на месечен график</DialogTitle>
                    <DialogDescription>Изберете ден от седмицата и час, за да генерирате събития за избрания месец.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month" className="text-right">Месец</Label>
                        <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map(month => (
                                    <SelectItem key={format(month, 'yyyy-MM')} value={format(month, 'yyyy-MM')}>
                                        {format(month, 'MMMM yyyy')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="day" className="text-right">Ден от седмицата</Label>
                        <Select onValueChange={(val) => setSelectedDay(parseInt(val, 10))} defaultValue={String(selectedDay)}>
                             <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {weekDays.map(day => (
                                    <SelectItem key={day.id} value={String(day.id)}>{day.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">Час</Label>
                        <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Заглавие</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Тип</Label>
                         <Select onValueChange={(val) => setType(val as ScheduleEventType)} value={type}>
                             <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="trening">Тренировка</SelectItem>
                                <SelectItem value="sastezanie">Състезание</SelectItem>
                                <SelectItem value="lager">Лагер</SelectItem>
                                <SelectItem value="sabitie">Събитие</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отказ</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Генериране...' : 'Генерирай'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
