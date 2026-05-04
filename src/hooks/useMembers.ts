"use client";

import { useState, useEffect } from "react";
import { addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Member } from "@/types/member.types";
import { getMembersCollection } from "@/lib/firebase-collections";
import { getAllMembers } from "@/services/member-service";

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = await getAllMembers(true);
        setMembers(membersData);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

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
