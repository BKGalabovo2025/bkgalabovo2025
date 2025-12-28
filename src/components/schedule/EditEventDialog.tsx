'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEvent, ScheduleEventType } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    onUpdateEvent: (eventId: string, eventData: Partial<ScheduleEvent>) => Promise<void>;
}

const eventTypeTranslations: Record<ScheduleEventType, string> = {
    training: 'Тренировка',
    sastezanie: 'Състезание',
    lager: 'Лагер',
    sabitie: 'Събитие',
};

export const EditEventDialog: React.FC<EditEventDialogProps> = ({ isOpen, onClose, event, onUpdateEvent }) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<ScheduleEventType>('training');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setStartDate(event.startDate ? new Date(new Date(event.startDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
            setEndDate(event.endDate ? new Date(new Date(event.endDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
            setType(event.type);
            setDescription(event.description || '');
            setError(null);
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;
        if (!title || !startDate || !endDate || !type) {
            setError('Моля, попълнете всички задължителни полета.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await onUpdateEvent(event.id, {
                title,
                startDate,
                endDate,
                type,
                description,
            });
            onClose();
        } catch (err) {
            setError('Възникна грешка при обновяването на събитието.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                 <DialogHeader>
                    <DialogTitle>Редактиране на събитие</DialogTitle>
                     <DialogDescription>
                        Променете детайлите на събитието и запазете промените.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="edit-title">Име на събитието</label>
                        <Input 
                            id="edit-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label htmlFor="edit-startDate">Начало</label>
                            <Input 
                                id="edit-startDate"
                                type="datetime-local" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-endDate">Край</label>
                             <Input 
                                id="edit-endDate"
                                type="datetime-local" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="edit-type">Тип на събитието</label>
                        <Select onValueChange={(value: ScheduleEventType) => setType(value)} value={type}>
                            <SelectTrigger id="edit-type">
                                <SelectValue placeholder="Изберете тип" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                                    <SelectItem key={key} value={key as ScheduleEventType}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                     <div className="space-y-2">
                        <label htmlFor="edit-description">Описание</label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 !mt-2 text-center">{error}</p>}

                    <DialogFooter className="!mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Отказ
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Запазване...</> : 'Запази промените'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
