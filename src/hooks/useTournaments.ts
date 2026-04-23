import { useState, useEffect, useCallback } from 'react';
import { getDocs, addDoc } from 'firebase/firestore';
import { getTournamentsCollection } from '@/lib/firebase-collections'; // Corrected import
import { Tournament } from '@/types/tournament.types';

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
        const tournamentsCollection = getTournamentsCollection(); // Get collection instance
        const querySnapshot = await getDocs(tournamentsCollection);
        const tournamentsData = querySnapshot.docs.map(doc => doc.data() as Tournament);
        setTournaments(tournamentsData);
    } catch (err) {
        setError(err as Error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const addTournament = async (tournamentData: Omit<Tournament, 'id'>) => {
    try {
      const tournamentsCollection = getTournamentsCollection(); // Get collection instance
      const docRef = await addDoc(tournamentsCollection, tournamentData);
      // Optimistically add to state or refetch
      setTournaments(prev => [...prev, { ...tournamentData, id: docRef.id }]);
      return docRef.id;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { tournaments, loading, error, addTournament, refetch: fetchTournaments };
};
