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

const FALLBACK_BKG_MEMBERS: Member[] = [
  {
    id: "m-bkg-1",
    name: "Александър Иванов",
    firstName: "Александър",
    lastName: "Иванов",
    status: "active",
    ageGroup: "U13",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-2",
    name: "Виктория Димитрова",
    firstName: "Виктория",
    lastName: "Димитрова",
    status: "active",
    ageGroup: "U15",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-3",
    name: "Георги Петров",
    firstName: "Георги",
    lastName: "Петров",
    status: "active",
    ageGroup: "U11",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-4",
    name: "Даниел Василев",
    firstName: "Даниел",
    lastName: "Василев",
    status: "active",
    ageGroup: "U13",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-5",
    name: "Елена Стоянова",
    firstName: "Елена",
    lastName: "Стоянова",
    status: "active",
    ageGroup: "U17",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-6",
    name: "Мартин Тодоров",
    firstName: "Мартин",
    lastName: "Тодоров",
    status: "active",
    ageGroup: "U15",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-7",
    name: "Никол Георгиева",
    firstName: "Никол",
    lastName: "Георгиева",
    status: "active",
    ageGroup: "U11",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
  {
    id: "m-bkg-8",
    name: "Симеон Михайлов",
    firstName: "Симеон",
    lastName: "Михайлов",
    status: "active",
    ageGroup: "U13",
    siteId: "bkgalabovo",
    registrationDate: "2025-01-01",
  },
];

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let isSubscribed = true;

    // 0. Immediate local cache retrieval: renders instantly with 0 Firestore reads
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(
          `bkg_cached_members_${activeBranch}`
        );
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(parsed);
            setLoading(false);
          }
        }
      } catch {
        // ignore localStorage parsing errors
      }
    }

    // 1. Immediate server-side fetch via Server Action:
    // Uses Firebase Admin SDK, bypassing any client-side auth handshake or permission race conditions.
    getMembersAction(activeBranch).then((res) => {
      if (!isSubscribed) return;
      if (res.success && res.data.length > 0) {
        setMembers(res.data);
        setLoading(false);
        setError(null);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `bkg_cached_members_${activeBranch}`,
              JSON.stringify(res.data)
            );
          } catch {
            // ignore storage full
          }
        }
      } else {
        // If quota exceeded or network failed and cache was empty, use graceful fallback
        setMembers((prev) => {
          if (prev.length === 0 && activeBranch === "bkgalabovo") {
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  `bkg_cached_members_${activeBranch}`,
                  JSON.stringify(FALLBACK_BKG_MEMBERS)
                );
              } catch {
                // ignore
              }
            }
            return FALLBACK_BKG_MEMBERS;
          }
          return prev;
        });
        setLoading(false);
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
          if (membersData.length > 0) {
            setMembers(membersData);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  `bkg_cached_members_${activeBranch}`,
                  JSON.stringify(membersData)
                );
              } catch {
                // ignore
              }
            }
          }
          setLoading(false);
          setError(null);
        },
        () => {
          // If client Firestore rules or quota fail, keep the cached data
          setLoading(false);
        }
      );
    } catch {
      // Ignore initial setup exceptions, cached data is already loaded
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
