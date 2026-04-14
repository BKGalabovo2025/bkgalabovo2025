import { useState, useEffect, useCallback } from "react";
import { Member } from "@/types";
import { getAllMembers, getMemberById } from "@/services/member-service";

/**
 * A custom hook to manage fetching all members.
 * It handles loading states and potential errors, providing a clean interface to the components.
 */
export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const allMembers = await getAllMembers();
      setMembers(allMembers);
    } catch (err: unknown) {
      console.error("useMembers - Failed to fetch members:", err);
      setError("Failed to load members. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // The hook returns the state variables and a refetch function.
  return { members, loading, error, refetch: fetchMembers };
};

/**
 * A custom hook to manage fetching a single member by their ID.
 * It handles loading and error states for fetching a specific member.
 * @param memberId The ID of the member to fetch.
 */
export const useMember = (memberId: string | null) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    if (!memberId || memberId === "undefined") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedMember = await getMemberById(memberId);
      if (fetchedMember) {
        setMember(fetchedMember);
      } else {
        setError("Member not found.");
      }
    } catch (err: unknown) {
      console.error(
        `useMember - Failed to fetch member with ID ${memberId}:`,
        err
      );
      setError("Failed to load member data.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, loading, error, refetch: fetchMember };
};
