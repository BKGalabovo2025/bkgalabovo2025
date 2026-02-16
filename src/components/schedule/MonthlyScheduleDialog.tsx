'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScheduleEvent } from '@/types';
import MonthlyScheduleForm, { MonthlyScheduleFormData } from './monthly-schedule-form';

interface MonthlyScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (newEvents: Omit<ScheduleEvent, 'id'>[]) => Promise<void>;
}

export const MonthlyScheduleDialog: React.FC<MonthlyScheduleDialogProps> = ({ isOpen, onClose, onGenerate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (formData: MonthlyScheduleFormData) => {
        setError(null);
        setIsSubmitting(true);

        try {
            const newEvents: Omit<ScheduleEvent, 'id'>[] = [];
            const { month: monthString, days, startTime, endTime, location } = formData;

            // Default values for event properties not included in the form
            const title = "Тренировка";
            const eventType = "training";

            const [year, month] = monthString.split('-').map(Number);

            // The month from `new Date()` is 0-indexed, so month - 1 is needed.
            const numDaysInMonth = new Date(year, month, 0).getDate();

            for (let i = 1; i <= numDaysInMonth; i++) {
                const date = new Date(year, month - 1, i);
                const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

                // Check if the current day of the week is in the user-selected days array
                if (days.includes(dayOfWeek)) {
                    const [startHour, startMinute] = startTime.split(':').map(Number);
                    const [endHour, endMinute] = endTime.split(':').map(Number);

                    const startDate = new Date(year, month - 1, i, startHour, startMinute);
                    const endDate = new Date(year, month - 1, i, endHour, endMinute);

                    newEvents.push({
                        title: title,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        type: eventType,
                        location: location,
                        attendees: [],
                        attendeeMemberIds: [],
                        description: `Генерирано събитие от месечен шаблон.`
                    });
                }
            }

            if (newEvents.length > 0) {
                await onGenerate(newEvents);
                onClose();
            } else {
                setError('Не са намерени съвпадащи дни за избрания месец.');
            }

        } catch (err) {
            setError('Възникна грешка при генерирането на графика. Моля, опитайте отново.');
            console.error("Error in handleGenerate:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Генериране на месечен график</DialogTitle>
                    <DialogDescription>
                        Създайте повтарящи се събития за избран месец. Попълнете данните и изберете дните от седмицата, за които да се създадат събития.
                    </DialogDescription>
                </DialogHeader>
                <MonthlyScheduleForm
                    onSave={handleGenerate}
                    onClose={onClose}
                    isSaving={isSubmitting}
                />
                {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </DialogContent>
        </Dialog>
    );
}
