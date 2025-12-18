
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

export const useMembers = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setIsLoading(true);
        try {
            const membersCollection = collection(db, 'members');
            // We only want to list active members for attendance
            const q = query(membersCollection, where('status', '==', 'active'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const membersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Member[];
                setMembers(membersData);
                setIsLoading(false);
            }, (err) => {
                console.error("Error fetching members:", err);
                setError(err);
                setIsLoading(false);
            });

            // Cleanup subscription on unmount
            return () => unsubscribe();

        } catch (err) {
            console.error("Error setting up members snapshot listener:", err);
            setError(err as Error);
            setIsLoading(false);
        }
    }, []);

    return { members, isLoading, error };
};
