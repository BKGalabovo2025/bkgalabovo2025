
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

// Centralized hook for fetching and caching members
export const useMembers = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const membersCollection = collection(db, 'members');
        const q = query(membersCollection); // Query all members

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Member[];
            setMembers(membersData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching members:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    return { members, loading, error };
};
