'use client';
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';

interface Debtor {
  id: string;
  firstName: string;
  lastName: string;
  lastPaymentDate?: Timestamp | Date | string;
}

export function LatePayments() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  const toSafeDate = (date: Timestamp | Date | string | null): Date | null => {
    if (!date) return null;
    if (date instanceof Timestamp) return date.toDate();
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return null;
  };

  const fetchDebtors = useCallback(async () => {
    try {
      const q = query(collection(getDb(), "members"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      const today = new Date();
      
      const overdue = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Debtor))
        .filter((member: Debtor) => {
          if (!member.lastPaymentDate) return true;
          const lastDate = toSafeDate(member.lastPaymentDate);
          if (!lastDate) return true; // Treat as overdue if date is invalid
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          return diffDays > 30;
        });

      setDebtors(overdue);
    } catch (err) {
      console.error("Грешка:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQuickPayment = async (memberId: string, name: string) => {
    if (!confirm(`Маркиране на месечната такса като платена за ${name}?`)) return;

    try {
      const memberRef = doc(getDb(), 'members', memberId);
      const now = Timestamp.now();

      // 1. Обновяваме последното плащане на члена
      await updateDoc(memberRef, {
        lastPaymentDate: now
      });

      // 2. Добавяме запис в историята на плащанията (за отчетност)
      await addDoc(collection(getDb(), 'payments'), {
        memberId,
        memberName: name,
        amount: 40, // Смени го на твоята стандартна такса
        date: now,
        type: 'monthly_subscription'
      });

      alert('Плащането е отразено! Списъкът се обновява...');
      fetchDebtors(); // Опресняваме списъка на екрана
    } catch (err) {
      alert('Грешка при запис на плащането.');
      console.error("Error handling quick payment:", err);
    }
  };

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  if (loading) return <p className="text-sm italic">Проверка...</p>;

  return (
    <div className="bg-white border-l-4 border-red-500 p-4 rounded shadow-md mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex justify-between">
        ⚠️ Закъснели такси <span>({debtors.length})</span>
      </h3>
      <div className="space-y-3">
        {debtors.length === 0 ? (
          <p className="text-green-600">Няма длъжници! ✅</p>
        ) : (
          debtors.map(member => (
            <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition">
              <div>
                <p className="font-bold text-gray-700">{member.firstName} {member.lastName}</p>
                <p className="text-xs text-gray-500">
                  {member.lastPaymentDate 
                    ? `Преди ${formatDistanceToNow(toSafeDate(member.lastPaymentDate)!, { locale: bg })}` 
                    : 'Няма предишни плащания'}
                </p>
              </div>
              <button 
                onClick={() => handleQuickPayment(member.id, `${member.firstName} ${member.lastName}`)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg font-bold shadow-sm"
              >
                Плати
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}