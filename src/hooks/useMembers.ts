"use client";

import { useState, useEffect } from "react";
import {
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Member } from "@/types/member.types";
import {
  getMembersQuery,
  getMembersCollection,
} from "@/lib/firebase-collections";
import { useAppStore } from "@/store/use-app-store";

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  useEffect(() => {
    const membersQuery = getMembersQuery();

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const membersData = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Member[];
        setMembers(membersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching members:", err);
        setError("Failed to fetch members.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeBranch]);

  const addMember = async (member: Omit<Member, "id">) => {
    const membersCollection = getMembersCollection();
    const docRef = await addDoc(membersCollection, member);
    setMembers((prev) => [...prev, { id: docRef.id, ...member }]);
  };

  const updateMember = async (id: string, updatedMember: Partial<Member>) => {
    const memberDoc = doc(db, "members", id);
    await updateDoc(memberDoc, updatedMember);
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, ...updatedMember } : member
      )
    );
  };

  const deleteMember = async (id: string) => {
    const memberDoc = doc(db, "members", id);
    await deleteDoc(memberDoc);
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  return { members, loading, error, addMember, updateMember, deleteMember };
}
