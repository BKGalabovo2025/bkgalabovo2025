"use client";

import { useState, useEffect } from "react";
import { addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
    const fetchMembers = async () => {
      try {
        const membersQuery = getMembersQuery();
        const querySnapshot = await getDocs(membersQuery);
        const membersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { ...data, id: doc.id };
        });
        setMembers(membersData as Member[]);
      } catch {
        setError("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
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
