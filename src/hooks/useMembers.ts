
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

// Firestore data structure might have Timestamps
interface MemberData extends Omit<Member, 'dateOfBirth' | 'registrationDate'> {
    dateOfBirth: Timestamp | string;
    registrationDate: Timestamp | string;
}

// Helper to convert timestamp to ISO string
const convertTimestamps = (data: MemberData): Member => {
    const toDateString = (date: Timestamp | string): string => {
        if (date instanceof Timestamp) {
            return date.toDate().toISOString();
        }
        return date; // Already a string
    };

    return {
        ...data,
        dateOfBirth: toDateString(data.dateOfBirth),
        registrationDate: toDateString(data.registrationDate),
    } as Member;
};

export const useMembers = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const membersCollection = collection(db, 'members');
        const q = query(membersCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(doc => {
                const data = doc.data() as MemberData;
                const memberWithId = { id: doc.id, ...data };
                return convertTimestamps(memberWithId);
            });
            setMembers(membersData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching members:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { members, loading, error };
};
