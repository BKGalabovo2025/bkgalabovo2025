
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScheduleEvent } from '@/types';

interface MonthlyScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (events: Omit<ScheduleEvent, 'id'>[]) => Promise<void>;
}

const daysOfWeek = [
    { id: 1, label: 'Понеделник' }, { id: 2, label: 'Вторник' }, { id: 3, label: 'Сряда' },
    { id: 4, label: 'Четвъртък' }, { id: 5, label: 'Петък' }, { id: 6, label: 'Събота' }, { id: 0, label: 'Неделя' },
];

export function MonthlyScheduleDialog({ isOpen, onClose, onGenerate }: MonthlyScheduleDialogProps) {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear.toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('20:00');
    const [location, setLocation] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);

    const handleDayToggle = (dayId: number) => {
        setSelectedDays(prev => 
            prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
        );
    };

    const handleSubmit = async () => {
        if (selectedDays.length === 0) {
            alert('Моля, изберете поне един ден от седмицата.');
            return;
        }
        
        setSubmitting(true);
        const generatedEvents: Omit<ScheduleEvent, 'id'>[] = [];
        const numDays = new Date(parseInt(year), parseInt(month), 0).getDate();

        for (let day = 1; day <= numDays; day++) {
            const date = new Date(parseInt(year), parseInt(month) - 1, day);
            if (selectedDays.includes(date.getDay())) {
                const [startHour, startMinute] = startTime.split(':').map(Number);
                const [endHour, endMinute] = endTime.split(':').map(Number);

                const startDate = new Date(date);
                startDate.setHours(startHour, startMinute);

                const endDate = new Date(date);
                endDate.setHours(endHour, endMinute);

                generatedEvents.push({
                    title: 'Тренировка',
                    type: 'тренировка',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    location: location,
                    description: 'Автоматично генерирана тренировка.',
                });
            }
        }
        
        try {
            await onGenerate(generatedEvents);
            onClose();
        } catch (error) {
            console.error("Failed to generate monthly schedule", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Генериране на месечен график</DialogTitle>
                    <DialogDescription>Автоматично създайте тренировки за избран месец и дни.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="number" placeholder="Година" value={year} onChange={e => setYear(e.target.value)} />
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger><SelectValue placeholder="Месец" /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={(i + 1).toString()}>{new Date(0, i).toLocaleString('bg', { month: 'long' })}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div>
                        <Label>Дни от седмицата</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                            {daysOfWeek.map(day => (
                                <div key={day.id} className="flex items-center space-x-2">
                                    <Checkbox id={`day-${day.id}`} checked={selectedDays.includes(day.id)} onCheckedChange={() => handleDayToggle(day.id)} />
                                    <Label htmlFor={`day-${day.id}`} className="font-normal">{day.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="start-time">Начален час</Label>
                           <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div>
                           <Label htmlFor="end-time">Краен час</Label>
                           <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="location">Локация</Label>
                        <Input id="location" placeholder="Зала..." value={location} onChange={e => setLocation(e.target.value)} />
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
