"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, AlertCircle, Download, ArrowLeft, Scissors } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
        addImage: (
          data: string,
          type: string,
          x: number,
          y: number,
          w: number,
          h: number
        ) => void;
        save: (filename: string) => void;
      };
    };
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
    if (!receiptRef.current || !window.jspdf || !(window as any).html2canvas) {
      toast.error(
        "Библиотеките за PDF все още се зареждат. Моля, опитайте след малко."
      );
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const element = receiptRef.current;

      // Use any to bypass conflicting global types
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc: Document) => {
          const receipt = clonedDoc.querySelector('.printable-area') as HTMLElement;
          if (receipt) {
            receipt.style.backgroundColor = '#ffffff';
            receipt.style.color = '#000000';
            
            // Inject a style to override any oklch/lab colors globally in the clone
            const styleTag = clonedDoc.createElement('style');
            styleTag.innerHTML = `
              * { 
                color-scheme: light !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .text-emerald-600 { color: #059669 !important; }
              .text-red-600 { color: #dc2626 !important; }
              .border-red-600 { border-color: #dc2626 !important; }
              .bg-black { background-color: #000000 !important; }
              .bg-zinc-900 { background-color: #18181b !important; }
              .text-zinc-900 { color: #18181b !important; }
            `;
            clonedDoc.head.appendChild(styleTag);

            const allElements = receipt.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              // Reset any lab/oklch colors
              const style = clonedDoc.defaultView?.getComputedStyle(htmlEl);
              if (style) {
                if (style.color.includes('lab') || style.color.includes('oklch')) {
                  htmlEl.style.setProperty('color', '#000000', 'important');
                }
                if (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch')) {
                  htmlEl.style.setProperty('background-color', 'transparent', 'important');
                }
                if (style.borderColor.includes('lab') || style.borderColor.includes('oklch')) {
                  htmlEl.style.setProperty('border-color', '#eeeeee', 'important');
                }
              }
            });
          }
        }
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
      pdf.save(
        `Kvitancia-${details?.sale?.id.substring(0, 8).toUpperCase() || "N-A"}.pdf`
      );

      toast.success("PDF файлът беше генериран успешно!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Възникна грешка при генерирането на PDF файла. Моля, използвайте бутона за печат вместо това.");
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

  const { sale, member, relatedMember } = details;

  return (
    <>
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
            @page { margin: 0; size: A4; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .printable-area {
                position: absolute; left: 0; top: 0; width: 210mm; height: 297mm;
                border: none !important; margin: 0 !important; box-shadow: none !important;
            }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-12 px-4 flex flex-col items-center no-print">
        <div className="w-full max-w-[794px] mb-8 flex justify-between items-center">
          {member?.id !== "GUEST_EXTERNAL" && (
            <Link
              href={`/members/${details.member.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-xl shadow-sm hover:bg-zinc-50 transition-colors font-bold text-sm border border-zinc-200"
            >
              <ArrowLeft size={18} />
              Към профила на члена
            </Link>
          )}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-white text-zinc-900 border border-zinc-900 rounded-xl shadow-sm hover:bg-zinc-50 transition-all font-bold"
            >
              <Printer size={20} />
              Печат
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl shadow-xl hover:bg-black transition-all font-bold disabled:opacity-50"
            >
              <Download size={20} className="text-white" />
              <span className="text-white">{isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}</span>
            </button>
          </div>
        </div>

        <div 
          className="bg-white shadow-2xl printable-area relative overflow-hidden" 
          style={{ 
            width: '794px', 
            minHeight: '1123px', 
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#000000'
          }} 
          ref={receiptRef}
        >
          {[1, 2].map((i) => (
            <div key={i} className="relative h-[561.5px] flex flex-col p-12">
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rotate-[-35deg] text-8xl font-black border-[12px] px-12 py-4 z-0"
                style={{ 
                  opacity: sale?.isPaid ? 0.05 : 0.08,
                  color: sale?.isPaid ? '#000000' : '#dc2626',
                  borderColor: sale?.isPaid ? '#000000' : '#dc2626'
                }}
              >
                {sale?.isPaid ? "ПЛАТЕНО" : "ОТЛОЖЕНО"}
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col gap-4">
                  <div className="relative w-40 h-16">
                    <Image
                      src="/logo.png"
                      alt="Лого"
                      fill
                      sizes="160px"
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div className="mt-1">
                    <h2 className="text-sm font-bold uppercase tracking-tight">{clubInfo.name}</h2>
                    <div className="text-[10px] mt-0.5 space-y-0.5" style={{ color: '#4b5563' }}>
                      <p>{clubInfo.address}</p>
                      <p>Електронна поща: {clubInfo.email}</p>
                      <p>Телефон: {clubInfo.contact}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right border-t-2 pt-2" style={{ borderColor: '#000', width: '180px' }}>
                <h1 className="text-xl font-black uppercase mb-1">{sale?.isPaid ? "КВИТАНЦИЯ" : (sale?.relatedReservationId || details.generalService ? "УСЛУГА" : "ПОРЪЧКА")}</h1>
                <p className="text-[10px] font-bold mb-4" style={{ color: '#6b7280' }}>№ {sale?.id.slice(-8).toUpperCase()}</p>
                  <div className="text-[10px]">
                    <p className="uppercase font-bold" style={{ color: '#9ca3af' }}>Дата</p>
                    <p className="font-bold">{sale?.saleDate ? new Date(sale.saleDate).toLocaleDateString("bg-BG") : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex justify-between items-end border-b pb-4 relative z-10" style={{ borderColor: '#f3f4f6' }}>
                <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>{member?.id === "GUEST_EXTERNAL" ? "КЛИЕНТ" : "ПОЛУЧАТЕЛ"}</p>
                <p className="text-xl font-black uppercase">
                  {member?.id === "GUEST_EXTERNAL" && sale?.clientName 
                    ? `Външен Клиент - ${sale.clientName}`
                    : (member ? formatFullName(member) : "---")}
                </p>
                  {relatedMember && (
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: '#4b5563' }}>чрез {formatFullName(relatedMember)}</p>
                  )}
                </div>
                <div className="text-right text-[10px]" style={{ color: '#4b5563' }}>
                  <p className="font-bold uppercase mb-1" style={{ color: '#9ca3af' }}>{(sale?.relatedReservationId || details.generalService) ? "Информация за услугата" : "Информация за поръчката"}</p>
                  <p>Статус: <span className="font-black" style={{ color: sale?.isPaid ? '#059669' : '#dc2626' }}>{sale?.isPaid ? "ПЛАТЕНО" : "ОТЛОЖЕНО"}</span></p>
                  {details.generalService && (
                    <>
                      <p>Изпълнител: <span className="font-black text-black">{details.generalService.performerName}</span></p>
                      <p>Тип: <span className="font-black text-black">{details.generalService.performerType === 'internal' ? 'Вътрешен' : 'Външен'}</span></p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-grow mb-6 relative z-10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th className="p-2 font-bold uppercase tracking-widest text-[8px]">Услуга</th>
                      <th className="p-2 text-center font-bold uppercase tracking-widest text-[8px] w-16">К-во</th>
                      <th className="p-2 text-right font-bold uppercase tracking-widest text-[8px] w-24">Ед. цена</th>
                      <th className="p-2 text-right font-bold uppercase tracking-widest text-[8px] w-24">Общо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale?.items.map((item, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: '#f3f4f6' }}>
                        <td className="p-2 font-bold">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatPrice(item.price)}</td>
                        <td className="p-2 text-right font-black">{formatPrice(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-end relative z-10">
                <div className="text-[8px] space-y-1 w-1/2" style={{ color: '#9ca3af' }}>
                  <p className="font-bold uppercase" style={{ color: '#000' }}>Начин на плащане: {sale?.isPaid ? "В БРОЙ" : "ОТЛОЖЕНО"}</p>
                  <p>{sale?.isPaid ? "Документът е валиден без мокър печат при потвърдено плащане." : "Документът е валиден само след извършване на плащането."}</p>
                </div>
                <div className="w-48">
                  <div className="flex justify-between items-center bg-black text-white p-3 rounded shadow-lg">
                    <span className="text-[8px] font-bold uppercase tracking-widest">ОБЩО ЗА ПЛАЩАНЕ</span>
                    <span className="text-lg font-black">{formatPrice(sale?.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-24 relative z-10">
                <div className="border-t pt-2 text-center" style={{ borderColor: '#000' }}>
                  <p className="text-[8px] font-bold uppercase">{member?.id === "GUEST_EXTERNAL" ? "Клиент" : "Платец"}</p>
                </div>
                <div className="border-t pt-2 text-center" style={{ borderColor: '#000' }}>
                  <p className="text-[8px] font-bold uppercase">Касиер</p>
                </div>
              </div>

              <div className="mt-4 text-center text-[8px] font-bold tracking-[0.2em]" style={{ color: '#d1d5db' }}>
                {i === 1 ? "ЕКЗЕМПЛЯР ЗА КЛУБА" : (member?.id === "GUEST_EXTERNAL" ? "" : "ЕКЗЕМПЛЯР ЗА ЧЛЕНА")}
              </div>

              {i === 1 && (
                <div className="absolute bottom-0 left-0 w-full flex items-center no-print">
                  <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                  <div className="px-4 text-[8px] text-gray-300 font-bold flex items-center gap-2 uppercase tracking-[0.3em]">
                    <Scissors size={10} /> Линия за отрязване
                  </div>
                  <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                </div>
              )}
            </div>
          ))}
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
      <AlertDescription className="mt-2 text-md font-medium">
        {message}
      </AlertDescription>
    </Alert>
  </div>
);
