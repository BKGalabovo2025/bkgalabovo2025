'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScheduleEvent } from '@/types';
import MonthlyScheduleForm from './monthly-schedule-form';

interface MonthlyScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (newEvents: Omit<ScheduleEvent, 'id'>[]) => Promise<void>;
}

export const MonthlyScheduleDialog: React.FC<MonthlyScheduleDialogProps> = ({ isOpen, onClose, onGenerate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (formData: any) => {
        setError(null);
        setIsSubmitting(true);

        try {
            const newEvents: Omit<ScheduleEvent, 'id'>[] = [];
            const { year, month, title, eventType, days, startTime, endTime } = formData;
            const numDays = new Date(year, month, 0).getDate();

            for (let i = 1; i <= numDays; i++) {
                const date = new Date(year, month - 1, i);
                const dayOfWeek = date.getDay();

                if (days[dayOfWeek]) {
                    const startDate = new Date(year, month - 1, i, ...startTime.split(':').map(Number));
                    const endDate = new Date(year, month - 1, i, ...endTime.split(':').map(Number));

                    newEvents.push({
                        title: `${title} - ${date.toLocaleDateString('bg-BG', { weekday: 'short' })}`,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        type: eventType,
                        attendees: [],
                        description: 'Генерирано събитие от месечен шаблон.'
                    });
                }
            }

            await onGenerate(newEvents);
            onClose();

        } catch (err) {
            setError('Възникна грешка при генерирането на графика.');
            console.error(err);
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
            </DialogContent>
        </Dialog>
    );
}
