'use client';

import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createReservation, updateReservation } from '@/lib/reservations';
import { toast } from 'sonner';
import { Reservation } from '@/types/reservation';

const reservationSchema = z.object({
  clientName: z.string().min(2, { message: "Името трябва да е поне 2 символа." }),
  clientPhone: z.string().min(9, { message: "Невалиден телефонен номер." }),
  clientEmail: z.string().email({ message: "Невалиден имейл адрес." }),
  courtId: z.number().min(1, { message: "Моля, изберете корт"}).max(6),
  startTime: z.date(),
  endTime: z.date(),
}).refine(data => data.endTime > data.startTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
});

interface ReservationDialogProps {
    children: React.ReactNode;
    reservation?: Reservation; // Existing reservation for edit mode
    initialData?: Partial<z.infer<typeof reservationSchema>>; // For pre-filling new reservations
    onSave?: () => void; // Callback to refresh data
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({ children, reservation, initialData, onSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [price, setPrice] = useState(0);
    const COURT_PRICE_PER_HOUR = 10;

    const isEditMode = !!reservation;

    const form = useForm<z.infer<typeof reservationSchema>>({
        resolver: zodResolver(reservationSchema),
    });

    const { watch, reset } = form;
    const startTime = watch('startTime');
    const endTime = watch('endTime');

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                reset({
                    ...reservation,
                    startTime: reservation.startTime.toDate(),
                    endTime: reservation.endTime.toDate(),
                });
            } else {
                reset({
                    clientName: '',
                    clientPhone: '',
                    clientEmail: '',
                    ...initialData,
                });
            }
        }
    }, [isOpen, isEditMode, reservation, initialData, reset]);

    useEffect(() => {
        if (startTime && endTime && endTime > startTime) {
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            setPrice(durationHours * COURT_PRICE_PER_HOUR);
        } else {
            setPrice(0);
        }
    }, [startTime, endTime]);

    async function onSubmit(values: z.infer<typeof reservationSchema>) {
        setIsSaving(true);
        try {
            const dataToSave = {
                currency: 'EUR',
                ...values,
                startTime: Timestamp.fromDate(values.startTime),
                endTime: Timestamp.fromDate(values.endTime),
                totalPrice: price, // store in Euro directly
            };

            if (isEditMode) {
                await updateReservation(reservation.id, dataToSave);
                toast.success("Резервацията е актуализирана успешно!");
            } else {
                await createReservation({ ...dataToSave, status: 'unpaid' });
                toast.success("Резервацията е създадена успешно!");
            }
            onSave?.();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save reservation:", error);
            if (error instanceof Error) {
                toast.error(error.message || "Възникна грешка при запазването.");
            } else {
                toast.error("Възникна грешка при запазването.");
            }
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Редактиране на резервация' : 'Нова резервация'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Променете данните по-долу и кликнете \'Запази промените\'.' : 'Попълнете данните, за да създадете нова резервация.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="clientName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Име на клиент</FormLabel>
                                    <FormControl><Input placeholder="Иван Иванов" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="clientPhone" render={({ field }) => (<FormItem><FormLabel>Телефон</FormLabel><FormControl><Input placeholder="0888123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="clientEmail" render={({ field }) => (<FormItem><FormLabel>Имейл</FormLabel><FormControl><Input placeholder="ivan@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="courtId" render={({ field }) => (<FormItem><FormLabel>Корт</FormLabel><Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={field.value ? String(field.value) : ""}><FormControl><SelectTrigger><SelectValue placeholder="Изберете корт..." /></SelectTrigger></FormControl><SelectContent>{Array.from({ length: 6 }, (_, i) => i + 1).map(num => (<SelectItem key={num} value={String(num)}>Корт {num}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Начален час</FormLabel><Input type="datetime-local" value={field.value ? new Date(field.value.getTime() - (field.value.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={e => field.onChange(new Date(e.target.value))} /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Краен час</FormLabel><Input type="datetime-local" value={field.value ? new Date(field.value.getTime() - (field.value.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={e => field.onChange(new Date(e.target.value))} /><FormMessage /></FormItem>)} />
                        </div>
                        <div className="text-right font-bold text-lg">Общо: {price.toFixed(2)} €</div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Отказ</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Запази промените' : 'Запази резервация'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
