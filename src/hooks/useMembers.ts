
import { useState, useEffect, useCallback } from 'react';
import { Member } from '@/types';
import { getAllMembers, getMemberById } from '@/services/member-service';

/**
 * A custom hook to manage fetching all members.
 * It handles loading states and potential errors, providing a clean interface to the components.
 */
export const useMembers = () => {
  // State for storing the list of members.
  const [members, setMembers] = useState<Member[]>([]);
  // State to indicate if the data is currently being fetched.
  const [loading, setLoading] = useState(true);
  // State to store any error that occurs during fetching.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        // We rely on the centralized, robust `getAllMembers` function from the member service.
        const allMembers = await getAllMembers();
        // The service now ensures that members are sorted and valid.
        setMembers(allMembers);
      } catch (err: any) {
        console.error("useMembers - Failed to fetch members:", err);
        setError("Failed to load members. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // The hook returns the state variables, which components can then use.
  return { members, loading, error };
};

/**
 * A custom hook to manage fetching a single member by their ID.
 * It handles loading and error states for fetching a specific member.
 * @param memberId The ID of the member to fetch.
 */
export const useMember = (memberId: string | null) => {
  // State for storing the single member object.
  const [member, setMember] = useState<Member | null>(null);
  // State for loading status.
  const [loading, setLoading] = useState(true);
  // State for storing errors.
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    // We only fetch if the memberId is valid.
    if (!memberId || memberId === 'undefined') {
      setLoading(false);
      return; // Do not proceed with invalid ID.
    }

    try {
      setLoading(true);
      // We use the centralized `getMemberById` function.
      const fetchedMember = await getMemberById(memberId);
      if (fetchedMember) {
        setMember(fetchedMember);
      } else {
        setError("Member not found.");
      }
    } catch (err: any) {
      console.error(`useMember - Failed to fetch member with ID ${memberId}:`, err);
      setError("Failed to load member data.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]); // The effect re-runs if the fetchMember function changes (i.e., if memberId changes).

  // Return the state and a function to manually refetch the data.
  return { member, loading, error, refetch: fetchMember };
};
