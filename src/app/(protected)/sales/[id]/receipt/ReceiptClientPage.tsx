"use client";

import { useState, useEffect } from "react";
import { Printer, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { getReceiptDetails, ReceiptDetails } from "@/services/sales-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice } from "@/lib/currency";
import { formatFullName } from "@/lib/utils";

interface ReceiptClientPageProps {
  saleId: string;
}

export default function ReceiptClientPage({ saleId }: ReceiptClientPageProps) {
  const [details, setDetails] = useState<ReceiptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const fetchedDetails = await getReceiptDetails(saleId);
        if (!fetchedDetails) {
          setError(
            `Не могат да бъдат заредени данните за квитанция с номер ${saleId}.`
          );
        } else {
          setDetails(fetchedDetails);
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching receipt details:", error);
        setError(error.message || "Възникна неочаквана грешка.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [saleId]);

  if (loading) {
    return <ReceiptSkeleton />;
  }

  if (error || !details) {
    return (
      <ErrorDisplay
        message={error || "Данните за квитанцията не са намерени."}
      />
    );
  }

  const { sale, member, relatedMember, service } = details;

  return (
    <>
      <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 font-sans">
        <div className="flex justify-between items-center mb-8 no-print">
          <h1 className="text-2xl font-bold">Преглед на квитанция</h1>
          <Button onClick={() => window.print()} variant="default">
            <Printer className="mr-2 h-4 w-4" />
            Принтирай
          </Button>
        </div>

        <div className="border border-gray-300 p-8 printable-area">
          <header className="flex justify-between items-start pb-6 border-b-2 border-gray-500">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Лого на клуба"
                width={80}
                height={80}
                className="mr-4"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {clubInfo.name}
                </h2>
                <p className="text-xs text-gray-600">{clubInfo.address}</p>
                <p className="text-xs text-gray-600">{clubInfo.email}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-800 tracking-wider">
                КВИТАНЦИЯ
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Номер: {sale?.id.substring(0, 8).toUpperCase() || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                Дата:{" "}
                {sale?.saleDate
                  ? new Date(sale.saleDate).toLocaleDateString("bg-BG")
                  : "N/A"}
              </p>
            </div>
          </header>

          <main className="mt-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  ДОСТАВЧИК
                </h3>
                <p className="font-bold">{clubInfo.name}</p>
                <p>{clubInfo.address}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  ПОЛУЧАТЕЛ(И)
                </h3>
                {member ? (
                  <p className="font-bold">{formatFullName(member)}</p>
                ) : (
                  <p className="font-bold text-red-500">
                    (Основен получател липсва)
                  </p>
                )}
                {relatedMember && (
                  <p className="font-bold">{formatFullName(relatedMember)}</p>
                )}
              </div>
            </div>

            <table className="w-full text-left mb-8">
              <thead>
                <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
                  <th className="p-3">Описание</th>
                  <th className="p-3 text-right">Количество</th>
                  <th className="p-3 text-right">Ед. цена</th>
                  <th className="p-3 text-right">Общо</th>
                </tr>
              </thead>
              <tbody>
                {sale?.items && sale.items.length > 0 ? (
                  sale.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <p className="font-semibold">
                          {item.name || "(неизвестен артикул)"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {service?.name || "(неизвестна услуга)"}
                        </p>
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatPrice(item.price)}
                      </td>
                      <td className="p-3 text-right">
                        {formatPrice(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500">
                      Няма артикули в тази продажба.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full md:w-1/3 text-right">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Междинна сума:</span>
                  <span>{formatPrice(sale?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-xl border-t-2 border-b-2 my-2">
                  <span>Общо:</span>
                  <span>{formatPrice(sale?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Статус:</span>
                  <span className="font-bold">
                    {sale?.isPaid ? "Платено" : "Неплатено"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-500">
              <p>Благодарим Ви, че избрахте нашия клуб!</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const ReceiptSkeleton = () => (
  <div className="max-w-4xl mx-auto p-8">
    <div className="flex justify-between items-center mb-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-28" />
    </div>
    <div className="border p-8 space-y-8">
      <div className="flex justify-between items-start">
        <Skeleton className="h-20 w-1/2" />
        <Skeleton className="h-12 w-1/3" />
      </div>
      <div className="grid grid-cols-2 gap-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="flex justify-end">
        <Skeleton className="h-40 w-1/3" />
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="max-w-4xl mx-auto p-8">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Грешка</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </div>
);
