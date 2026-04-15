"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, AlertCircle, FileDown } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { getReceiptDetails, ReceiptDetails } from "@/services/sales-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice } from "@/lib/currency";
import { formatFullName } from "@/lib/utils";
import { toast } from "sonner";

interface ReceiptClientPageProps {
  saleId: string;
}

// Declare global types for CDN-loaded libraries
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: {
        orientation?: "portrait" | "landscape";
        unit?: "mm" | "pt" | "in" | "cm";
        format?: string | string[];
      }) => {
        getImageProperties: (data: string) => { width: number; height: number };
        internal: { pageSize: { getWidth: () => number } };
        addImage: (data: string, type: string, x: number, y: number, w: number, h: number) => void;
        save: (filename: string) => void;
      };
    };
    html2canvas: (element: HTMLElement, options?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      backgroundColor?: string | null;
    }) => Promise<HTMLCanvasElement>;
  }
}

export default function ReceiptClientPage({ saleId }: ReceiptClientPageProps) {
  const [details, setDetails] = useState<ReceiptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !window.jspdf || !window.html2canvas) {
      toast.error("Библиотеките за PDF все още се зареждат. Моля, опитайте след малко.");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const element = receiptRef.current;
      
      // We use a high scale for better quality in the PDF
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${details?.sale?.id.substring(0, 8).toUpperCase() || "N-A"}.pdf`);
      
      toast.success("PDF файлът беше генериран успешно!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Възникна грешка при генерирането на PDF файла.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
      {/* Load PDF libraries via CDN since we can't install via npm in this restricted environment */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" 
        strategy="lazyOnload"
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" 
        strategy="lazyOnload"
      />

      <style>{`
        @media print {
            @page {
                margin: 10mm;
                size: A4;
            }
            body {
                background: white;
            }
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
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .no-print {
                display: none !important;
            }
            .print-shadow-none {
                box-shadow: none !important;
            }
            /* Force exact colors for printing */
            .print-bg-gray {
                background-color: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        /* Receipt Aesthetics */
        .receipt-container {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.5;
        }
        .receipt-header-title {
            letter-spacing: 0.1em;
            color: #1a202c;
        }
        .receipt-table th {
            text-transform: uppercase;
            font-size: 0.75rem;
            color: #4a5568;
        }
        .receipt-footer {
            border-top: 1px dashed #cbd5e0;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 receipt-container">
        {/* ACTION BAR */}
        <div className="flex flex-wrap justify-between items-center mb-8 no-print gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Управление на квитанция</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm" className="bg-white">
              <Printer className="mr-2 h-4 w-4" />
              Принтирай
            </Button>
            <Button 
                onClick={handleDownloadPDF} 
                variant="default" 
                size="sm"
                disabled={isGeneratingPDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? "Генериране..." : "PDF за имейл"}
            </Button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div ref={receiptRef} className="bg-white border border-gray-200 shadow-xl p-8 sm:p-12 printable-area print-shadow-none overflow-hidden rounded-sm">
          <header className="flex flex-col md:flex-row justify-between items-start pb-8 border-b-2 border-gray-900 gap-6">
            <div className="flex items-center">
              <div className="relative w-20 h-20 mr-6">
                <Image
                    src="/logo.png"
                    alt="Лого"
                    fill
                    className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">
                  {clubInfo.name}
                </h2>
                <div className="text-sm text-gray-600 space-y-0.5">
                    <p>{clubInfo.address}</p>
                    <p>{clubInfo.email}</p>
                    <p>{clubInfo.contact}</p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <h1 className="text-5xl font-black text-gray-900 receipt-header-title mb-4">
                КВИТАНЦИЯ
              </h1>
              <div className="inline-block bg-gray-900 text-white px-4 py-2 mt-2">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Номер на документ</p>
                <p className="text-xl font-mono font-bold leading-none">#{sale?.id.substring(0, 8).toUpperCase() || "N/A"}</p>
              </div>
              <p className="text-sm font-medium text-gray-600 mt-4 uppercase tracking-wider">
                Дата: {sale?.saleDate ? new Date(sale.saleDate).toLocaleDateString("bg-BG", { day: "2-digit", month: "long", year: "numeric" }) : "N/A"}
              </p>
            </div>
          </header>

          <main className="mt-12">
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="border-l-4 border-gray-200 pl-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  ДОСТАВЧИК
                </h3>
                <p className="font-bold text-lg text-gray-900">{clubInfo.name}</p>
                <p className="text-gray-600 max-w-xs">{clubInfo.address}</p>
              </div>
              <div className="text-right border-r-4 border-gray-200 pr-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  ПОЛУЧАТЕЛ
                </h3>
                {member ? (
                  <p className="font-bold text-lg text-gray-900">{formatFullName(member)}</p>
                ) : (
                  <p className="font-bold text-red-600 underline decoration-wavy">(Липсва информация)</p>
                )}
                {relatedMember && (
                  <p className="font-medium text-gray-700 mt-1">{formatFullName(relatedMember)}</p>
                )}
              </div>
            </div>

            <table className="w-full text-left mb-12 receipt-table border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="p-4 rounded-tl-sm">Описание на услугата</th>
                  <th className="p-4 text-center">К-во</th>
                  <th className="p-4 text-right">Ед. цена</th>
                  <th className="p-4 text-right rounded-tr-sm">Обща сума</th>
                </tr>
              </thead>
              <tbody>
                {sale?.items && sale.items.length > 0 ? (
                  sale.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-5">
                        <p className="font-bold text-gray-900 text-lg">
                          {item.name || "(неизвестен артикул)"}
                        </p>
                        <p className="text-sm text-gray-500 italic mt-1 font-medium">
                          {service?.name || "(неспецифицирана категория)"}
                        </p>
                      </td>
                      <td className="p-5 text-center font-bold text-gray-700">{item.quantity}</td>
                      <td className="p-5 text-right font-medium text-gray-600">
                        {formatPrice(item.price)}
                      </td>
                      <td className="p-5 text-right font-black text-gray-900 text-lg">
                        {formatPrice(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-medium italic">
                      Списъкът с услуги е празен.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="bg-blue-50 p-6 rounded-lg flex-grow border border-blue-100 no-print-background">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Начин на плащане</h4>
                    <p className="font-bold text-blue-900 flex items-center">
                        В брой / Банков превод
                    </p>
                    <div className="mt-4 pt-4 border-t border-blue-100">
                         <p className="text-xs text-blue-500 font-medium italic">
                            Този документ служи за потвърждение на направеното плащане.
                         </p>
                    </div>
                </div>
                
                <div className="w-full md:w-80 space-y-3">
                    <div className="flex justify-between items-center text-gray-500 px-2">
                      <span className="text-sm font-bold uppercase tracking-wider">Междинна сума:</span>
                      <span className="font-mono">{formatPrice(sale?.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-sm shadow-lg transform scale-105 origin-right">
                      <span className="text-lg font-black uppercase tracking-widest">ОБЩО:</span>
                      <span className="text-3xl font-black">{formatPrice(sale?.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 px-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Статус на плащане:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${sale?.isPaid ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                        {sale?.isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                      </span>
                    </div>
                </div>
            </div>

            <footer className="mt-20 pt-10 receipt-footer flex flex-col items-center">
              <div className="flex justify-between w-full mb-12 px-12 italic text-sm text-gray-400 uppercase font-black">
                <p>Подпис на платилия: .........................</p>
                <p>Подпис на касиера: .........................</p>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-widest">Благодарим Ви, че спортувате с нас!</p>
              <p className="text-xs text-gray-400 font-medium">{clubInfo.name} &copy; {new Date().getFullYear()}</p>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

const ReceiptSkeleton = () => (
  <div className="max-w-4xl mx-auto p-8 space-y-8">
    <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    <div className="border p-12 space-y-12 bg-white shadow-sm border-gray-100">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-20 w-64" />
        </div>
        <Skeleton className="h-24 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-12">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="flex justify-end">
        <Skeleton className="h-48 w-80" />
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="max-w-4xl mx-auto p-8">
    <Alert variant="destructive" className="border-2">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Системна грешка</AlertTitle>
      <AlertDescription className="mt-2 text-md font-medium">{message}</AlertDescription>
    </Alert>
  </div>
);

