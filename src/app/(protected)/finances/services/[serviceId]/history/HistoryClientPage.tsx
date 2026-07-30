"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/firebase";

// --- Types ---
interface Service {
  id: string;
  name: string;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  userName: string;
  changes: string;
}

interface HistoryClientPageProps {
  serviceId: string;
}

// --- Helper Functions ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safely formats a timestamp from Firestore.
 * Handles both Timestamp objects and legacy string dates.
 */
const formatTimestamp = (timestamp: Timestamp | string): string => {
  // Case 1: It's a Firestore Timestamp object (the correct format).
  if (timestamp && typeof (timestamp as Timestamp).toDate === "function") {
    return (timestamp as Timestamp).toDate().toLocaleString("bg-BG");
  }
  // Case 2: It's a string (from old buggy code).
  if (typeof timestamp === "string" && timestamp.length > 0) {
    return timestamp; // Return the raw string as is.
  }
  // Case 3: It's null, undefined, or some other invalid type.
  return "Няма информация за дата";
};

// --- Client Page Component (Handles all data fetching) ---

export default function HistoryClientPage({
  serviceId,
}: HistoryClientPageProps) {
  const [service, setService] = useState<Service | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataWithRetry = async () => {
      if (!serviceId) {
        setError("Невалидно ID на услугата.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const db = getDb();
      const serviceDocRef = doc(db, "clubServices", serviceId);

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const serviceDoc = await getDoc(serviceDocRef);

          if (serviceDoc.exists()) {
            setService({ id: serviceDoc.id, ...serviceDoc.data() } as Service);

            const historyQuery = query(
              collection(db, "serviceHistory"),
              where("serviceId", "==", serviceId),
              orderBy("timestamp", "desc")
            );
            const historySnapshot = await getDocs(historyQuery);

            const historyData = historySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                timestamp: formatTimestamp(data.timestamp),
                userName: data.userName || "Няма информация",
                changes: data.changes || "Няма информация",
              } as HistoryEntry;
            });
            setHistory(historyData);

            setIsLoading(false);
            return;
          }

          if (attempt < 2) {
            await sleep(1500);
          } else {
            setError(
              `Услуга с ID &quot;${serviceId}&quot; не беше намерена. Възможно е все още да се създава или да е bila изтрита.`
            );
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error on attempt %s:", attempt, err);
          setError(
            (err as Error).message ||
              "Възникна грешка при зареждането на данните."
          );
          setIsLoading(false);
          return;
        }
      }
    };

    fetchDataWithRetry();
  }, [serviceId]);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="mr-2 size-8 animate-spin" />
        <span>Зареждане на историята...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="border-l-4 border-red-500 bg-red-50 p-4">
          <h2 className="text-xl font-bold text-red-800">
            Грешка при зареждане
          </h2>
          <p className="mt-2 text-red-700">{error}</p>
        </div>
        <Link href="/finances/services" className="mt-4 inline-block">
          <Button variant="outline">Назад към услугите</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">
        История на промените за &quot;{service?.name || "..."}&quot;
      </h1>
      <div className="mb-6">
        <Link href="/finances/services">
          <Button variant="outline">Назад към услугите</Button>
        </Link>
      </div>
      {history.length > 0 ? (
        <ul className="space-y-4">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-gray-500">{entry.timestamp}</p>
              <p>
                <strong>Потребител:</strong> {entry.userName}
              </p>
              <p className="mt-2">
                <strong>Промени:</strong>{" "}
                <span className="text-gray-700">{entry.changes}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border-2 border-dashed p-4 text-center">
          <p>Няма намерена история на промените за тази услуга.</p>
        </div>
      )}
    </div>
  );
}
