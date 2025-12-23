
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, Timestamp, WriteBatch, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { useToast } from '@/components/ui/use-toast';

type NewMember = Omit<Member, 'id'>;

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return undefined;
};

export const useMembers = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const membersCollection = collection(db, 'members');
        const q = query(membersCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(doc => {
                const data = doc.data();
                // Explicitly construct the Member object to ensure type safety
                return {
                    id: doc.id,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    middleName: data.middleName || null,
                    status: data.status || 'inactive',
                    email: data.email || null,
                    phone: data.phone || null,
                    phoneType: data.phoneType || 'personal',
                    address: data.address || null,
                    dateOfBirth: toISOStringOrUndefined(data.dateOfBirth),
                    registrationDate: toISOStringOrUndefined(data.registrationDate),
                    notes: data.notes || null,
                    avatarUrl: data.avatarUrl || null,
                    familyId: data.familyId || null,
                    educationInstitution: data.educationInstitution || null,
                    personalId: data.personalId || null,
                } as Member;
            });
            setMembers(membersData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching members:", err);
            setError(err);
            setIsLoading(false);
            toast({ title: "Грешка при зареждане на членовете", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [toast]);

    const addMember = useCallback(async (memberData: NewMember) => {
        try {
            await addDoc(collection(db, 'members'), memberData);
            toast({ title: "Членът е добавен успешно" });
        } catch (err) {
            console.error("Error adding member:", err);
            toast({ title: "Грешка при добавяне на член", variant: "destructive" });
            throw err;
        }
    }, [toast]);

    const updateMember = useCallback(async (memberId: string, memberData: Partial<NewMember>) => {
        const originalMembers = members;
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...memberData } as Member : m));
        
        try {
            await updateDoc(doc(db, 'members', memberId), memberData);
            toast({ title: "Данните на члена са обновени" });
        } catch (err) {
            setMembers(originalMembers);
            console.error("Error updating member:", err);
            toast({ title: "Грешка при обновяване на данните", variant: "destructive" });
            throw err;
        }
    }, [members, toast]);

    const deleteMember = useCallback(async (memberId: string) => {
        const originalMembers = members;
        setMembers(prev => prev.filter(m => m.id !== memberId));

        try {
            await deleteDoc(doc(db, 'members', memberId));
            toast({ title: "Членът е изтрит" });
        } catch (err) {
            setMembers(originalMembers);
            console.error("Error deleting member:", err);
            toast({ title: "Грешка при изтриване", variant: "destructive" });
            throw err;
        }
    }, [members, toast]);
    
    const updateMemberAttendance = useCallback(async (updates: { memberId: string; newAttendance: { eventId: string; eventType: string; date: string; }[] }[]) => {
        const batch = writeBatch(db);
        updates.forEach(({ memberId, newAttendance }) => {
            const memberRef = doc(db, 'members', memberId);
            // This assumes the 'attendance' field is still part of your data model,
            // even if not strictly in the Member type for the main list.
            batch.update(memberRef, { attendance: newAttendance });
        });

        try {
            await batch.commit();
            // No toast here to avoid spamming for background updates
        } catch (error) {
            console.error("Batch attendance update failed:", error);
            toast({
                title: "Грешка при обновяване на присъствия",
                description: "Синхронизацията на присъствията се провали.",
                variant: "destructive"
            });
        }
    }, [toast]);


    return { members, isLoading, error, addMember, updateMember, deleteMember, updateMemberAttendance };
};
