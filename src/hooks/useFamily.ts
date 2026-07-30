"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import useSWR from "swr";

import { db } from "@/lib/firebase";
import { docToMember } from "@/services/member-service";
import { Member } from "@/types";

import { Family } from "./useFamilies";

interface FamilyData {
  family: Family | null;
  members: Member[];
}

const fetchFamilyData = async (familyId: string): Promise<FamilyData> => {
  if (!familyId) throw new Error("No family ID provided.");

  const familyRef = doc(db, "families", familyId);
  const familySnap = await getDoc(familyRef);

  if (!familySnap.exists()) {
    return { family: null, members: [] };
  }

  const family = { ...familySnap.data(), id: familySnap.id } as Family;
  const members: Member[] = [];

  if (family.memberIds && family.memberIds.length > 0) {
    const membersRef = collection(db, "members");
    const q = query(
      membersRef,
      where("__name__", "in", family.memberIds.slice(0, 30))
    );
    const querySnapshot = await getDocs(q);
    members.push(
      ...(querySnapshot.docs.map(docToMember).filter(Boolean) as Member[])
    );
  }

  return { family, members };
};

export function useFamily(familyId: string) {
  const { data, error, isLoading, mutate } = useSWR<FamilyData>(
    familyId ? `family-${familyId}` : null,
    () => fetchFamilyData(familyId)
  );

  return {
    family: data?.family || null,
    members: data?.members || [],
    loading: isLoading,
    error: error ? "Грешка при зареждане на данните за семейството." : null,
    refetch: mutate,
  };
}
