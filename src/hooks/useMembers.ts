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

// Module-level cache and subscriber registry to eliminate duplicate queries & multiple listeners
const memoryCache: Record<string, Member[]> = {};
const subscribers: Record<string, Set<(data: Member[]) => void>> = {};
const activeUnsubs: Record<string, (() => void) | null> = {};
const cleanupTimers: Record<string, ReturnType<typeof setTimeout> | null> = {};

function notifySubscribers(branch: string, members: Member[]) {
  memoryCache[branch] = members;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `bkg_cached_members_${branch}`,
        JSON.stringify(members)
      );
    } catch {
      // ignore storage full
    }
  }
  subscribers[branch]?.forEach((cb) => cb(members));
}

function getInitialCachedMembers(branch: string): Member[] {
  if (memoryCache[branch]?.length) {
    return memoryCache[branch];
  }
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`bkg_cached_members_${branch}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache[branch] = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore parse error
    }
  }
  return [];
}

export function useMembers() {
  const { activeBranch } = useAppStore();
  const { user, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<Member[]>(() =>
    getInitialCachedMembers(activeBranch)
  );
  const [loading, setLoading] = useState<boolean>(() => members.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial cached render
    const cached = getInitialCachedMembers(activeBranch);
    if (cached.length > 0) {
      setMembers(cached);
      setLoading(false);
    }

    // 2. Register subscriber
    if (!subscribers[activeBranch]) {
      subscribers[activeBranch] = new Set();
    }
    subscribers[activeBranch].add(setMembers);

    // Cancel any pending unmount cleanup for this branch
    if (cleanupTimers[activeBranch]) {
      clearTimeout(cleanupTimers[activeBranch]!);
      cleanupTimers[activeBranch] = null;
    }

    // 3. Single shared listener / fetcher per branch
    if (!activeUnsubs[activeBranch]) {
      if (user && !authLoading) {
        // Active authenticated user: single onSnapshot listener (realtime updates without parallel server action)
        try {
          const membersQuery = getMembersQuery();
          const unsub = onSnapshot(
            membersQuery,
            (snapshot) => {
              const membersData = snapshot.docs.map((d) => ({
                ...d.data(),
                id: d.id,
              })) as Member[];
              if (membersData.length > 0) {
                notifySubscribers(activeBranch, membersData);
              }
              setLoading(false);
              setError(null);
            },
            () => {
              // On quota error or permission drop, retain cache
              setLoading(false);
            }
          );
          activeUnsubs[activeBranch] = unsub;
        } catch {
          setLoading(false);
        }
      } else if (!authLoading && !user && cached.length === 0) {
        // Fallback for unauthenticated / SSR-like client state if cache is empty
        getMembersAction(activeBranch).then((res) => {
          if (res.success && res.data.length > 0) {
            notifySubscribers(activeBranch, res.data);
          } else if (activeBranch === "bkgalabovo") {
            notifySubscribers(activeBranch, FALLBACK_BKG_MEMBERS);
          }
          setLoading(false);
        });
      }
    }

    return () => {
      subscribers[activeBranch]?.delete(setMembers);
      // If no components are listening to this branch, schedule graceful cleanup
      if (subscribers[activeBranch]?.size === 0) {
        cleanupTimers[activeBranch] = setTimeout(() => {
          if (
            subscribers[activeBranch]?.size === 0 &&
            activeUnsubs[activeBranch]
          ) {
            activeUnsubs[activeBranch]!();
            activeUnsubs[activeBranch] = null;
          }
        }, 30000); // 30s grace period prevents listener churn on rapid tab switching
      }
    };
  }, [activeBranch, user, authLoading]);

  const addMember = async (member: Omit<Member, "id">) => {
    const membersCollection = getMembersCollection();
    const docRef = await addDoc(membersCollection, member);
    const newMember = { id: docRef.id, ...member };
    const updated = [...(memoryCache[activeBranch] || members), newMember];
    notifySubscribers(activeBranch, updated);
  };

  const updateMember = async (id: string, updatedMember: Partial<Member>) => {
    const memberDoc = doc(db, "members", id);
    await updateDoc(memberDoc, updatedMember);
    const updated = (memoryCache[activeBranch] || members).map((m) =>
      m.id === id ? { ...m, ...updatedMember } : m
    );
    notifySubscribers(activeBranch, updated);
  };

  const deleteMember = async (id: string) => {
    const memberDoc = doc(db, "members", id);
    await deleteDoc(memberDoc);
    const updated = (memoryCache[activeBranch] || members).filter(
      (m) => m.id !== id
    );
    notifySubscribers(activeBranch, updated);
  };

  return { members, loading, error, addMember, updateMember, deleteMember };
}
