
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Payment } from '@/types';

// const paymentsCollection = collection(db, 'payments'); // Преместено във функциите, за да се избегнат грешки при билд

/**
 * Добавя ново плащане в базата данни.
 * @param paymentData - Обект, съдържащ данните за плащането, без ID.
 * @returns Promise, което връща ID-то на новосъздадения документ.
 */
export const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
    const paymentsCollection = collection(db, 'payments');
    const docRef = await addDoc(paymentsCollection, paymentData);
    return docRef.id;
};

/**
 * Извлича всички плащания, направени от конкретен член.
 * @param memberId - ID на члена.
 * @returns Promise, което връща масив с плащанията на члена.
 */
export const getPaymentsForMember = async (memberId: string): Promise<Payment[]> => {
    const paymentsCollection = collection(db, 'payments');
    const q = query(paymentsCollection, where('memberId', '==', memberId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

/**
 * Извлича всички плащания от системата.
 * @returns Promise, което връща масив с всички плащания.
 */
export const getAllPayments = async (): Promise<Payment[]> => {
    const paymentsCollection = collection(db, 'payments');
    const querySnapshot = await getDocs(paymentsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

/**
 * Изтрива плащане от базата данни.
 * @param paymentId - ID на плащането за изтриване.
 * @returns Promise, което завършва, когато плащането е изтрито.
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
    const paymentDoc = doc(db, 'payments', paymentId);
    await deleteDoc(paymentDoc);
};
