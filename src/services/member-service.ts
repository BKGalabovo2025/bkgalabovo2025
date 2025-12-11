
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

const MEMBERS_COLLECTION = 'members';

// Тип за данните, които се подават при създаване (без id)
type CreateMemberData = Omit<Member, 'id'>;

// Тип за данните, които се подават при редакция (може да са частични)
type UpdateMemberData = Partial<CreateMemberData>;

/**
 * Извлича всички членове от Firestore.
 */
export const getMembers = async (): Promise<Member[]> => {
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const querySnapshot = await getDocs(membersCollection);
  const members: Member[] = [];
  querySnapshot.forEach((doc) => {
    members.push({ id: doc.id, ...doc.data() } as Member);
  });
  return members;
};

/**
 * Добавя нов член в Firestore.
 * @param memberData Данните за новия член.
 * @returns ID на новосъздадения документ.
 */
export const addMember = async (memberData: CreateMemberData): Promise<string> => {
  const membersCollection = collection(db, MEMBERS_COLLECTION);
  const docRef = await addDoc(membersCollection, memberData);
  return docRef.id;
};

/**
 * Обновява данните за съществуващ член.
 * @param id ID на члена, който ще се редактира.
 * @param memberData Новите данни за члена.
 */
export const updateMember = async (id: string, memberData: UpdateMemberData): Promise<void> => {
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await updateDoc(memberRef, memberData);
};

/**
 * Изтрива член от Firestore.
 * @param id ID на члена, който ще се изтрие.
 */
export const deleteMember = async (id: string): Promise<void> => {
  const memberRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberRef);
};
