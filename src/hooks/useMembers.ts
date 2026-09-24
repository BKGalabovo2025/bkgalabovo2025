"use client";

import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { getMembersAction } from "@/lib/actions/members";
import { db } from "@/lib/firebase";
import {
  getMembersCollection,
  getMembersQuery,
} from "@/lib/firebase-collections";
import { useAppStore } from "@/store/use-app-store";
import { Member } from "@/types/member.types";

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let isSubscribed = true;

    // 1. Immediate server-side fetch via Server Action:
    // Uses Firebase Admin SDK, bypassing any client-side auth handshake or permission race conditions.
    getMembersAction(activeBranch).then((res) => {
      if (!isSubscribed) return;
      if (res.success && res.data.length > 0) {
        setMembers(res.data);
        setLoading(false);
        setError(null);
      }
    });

    // 2. Real-time snapshot listener: only attach if client Firebase Auth is active
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setLoading(false);
      }
      return () => {
        isSubscribed = false;
      };
    }

    let unsubscribe = () => {};
    try {
      const membersQuery = getMembersQuery();
      unsubscribe = onSnapshot(
        membersQuery,
        (snapshot) => {
          if (!isSubscribed) return;
          const membersData = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as Member[];
          setMembers(membersData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          // If client Firestore rules or network handshake fail, keep the server-action data
          if (
            err?.code === "permission-denied" ||
            err?.message?.includes("permissions")
          ) {
            // Handled: Server action already populated members safely
            setLoading(false);
          } else {
            console.warn("Notice in members real-time sync:", err);
            setLoading(false);
          }
        }
      );
    } catch {
      // Ignore initial setup exceptions, server data is already loaded
      setLoading(false);
    }

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [activeBranch, user, authLoading]);

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
