'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { DocumentData, QuerySnapshot } from '@firebase/firestore';
import { processSubscription } from '@/lib/utils';
import ReceiptEmail from '@/components/emails/receipt-email';
import { render } from '@react-email/render';

interface Subscription {
  id: string;
  name: string;
  status: string;
  plan: string;
  price: number;
  startDate: string;
  endDate: string;
  email: string;
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
          collection(db, 'subscriptions'),
        );
        const subs = querySnapshot.docs.map(doc =>
          processSubscription(doc),
        ) as Subscription[];
        setSubscriptions(subs);
      } catch (err: any) {
        console.error('Error fetching subscriptions:', err);
        setError(`Failed to load subscriptions: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleSendEmail = useCallback(async (sub: Subscription) => {
    if (sendingEmailId === sub.id) return;

    setSendingEmailId(sub.id);
    setError(null);

    try {
      const emailHtml = render(
        <ReceiptEmail
          name={sub.name}
          subscriptionId={sub.id}
          startDate={sub.startDate}
          endDate={sub.endDate}
          planName={sub.plan}
          price={sub.price.toString()}
        />,
      );
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: sub.email,
          subject: `Разписка за абонамент - ${sub.plan}`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      alert('Имейлът е изпратен успешно!');
    } catch (err: any) {
      console.error('Грешка при изпращане на имейл:', err);
      alert(`Грешка: ${err.message}`);
      setError(err.message);
    } finally {
      setSendingEmailId(null);
    }
  }, [sendingEmailId]);


  if (loading) {
    return <div>Зареждане на абонаменти...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Абонаменти</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Грешка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Име</th>
              <th className="py-2 px-4 border-b">Имейл</th>
              <th className="py-2 px-4 border-b">План</th>
              <th className="py-2 px-4 border-b">Цена</th>
              <th className="py-2 px-4 border-b">Статус</th>
              <th className="py-2 px-4 border-b">Начална дата</th>
              <th className="py-2 px-4 border-b">Крайна дата</th>
              <th className="py-2 px-4 border-b">Действия</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length > 0 ? (
              subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{sub.name}</td>
                  <td className="py-2 px-4 border-b">{sub.email}</td>
                  <td className="py-2 px-4 border-b">{sub.plan}</td>
                  <td className="py-2 px-4 border-b">{sub.price.toFixed(2)}лв.</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                      {sub.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{sub.startDate}</td>
                  <td className="py-2 px-4 border-b">{sub.endDate}</td>
                  <td className="py-2 px-4 border-b">
                     <button
                        onClick={() => handleSendEmail(sub)}
                        disabled={sendingEmailId === sub.id}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {sendingEmailId === sub.id ? 'Изпращане...' : 'Изпрати разписка'}
                      </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Няма намерени абонаменти.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscriptions;
