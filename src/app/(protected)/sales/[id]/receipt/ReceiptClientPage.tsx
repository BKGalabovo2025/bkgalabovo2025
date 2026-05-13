"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, AlertCircle, FileDown, Edit } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { getReceiptDetails, ReceiptDetails } from "@/services/sales-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice } from "@/lib/currency";
import { formatFullName } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ReceiptClientPageProps {
  saleId: string;
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
            `Не можахме да открием детайли за разписка с номер ${saleId}.`
          );
        } else {
          setDetails(fetchedDetails);
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching receipt details:", error);
        setError(error.message || "Възникна грешка при зареждане на данните.");
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
    if (!receiptRef.current) return;

    try {
      setIsGeneratingPDF(true);

      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc: Document) => {
          // 1. SANITIZE STYLESHEETS: html2canvas crashes on lab(), oklch(), etc.
          // We must strip these from the cloned document's head styles.
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML) {
              // Replace any lab(), oklch(), lch(), oklab() with a safe color
              style.innerHTML = style.innerHTML.replace(
                /(lab|oklch|lch|oklab)\([^)]+\)/g,
                "inherit"
              );
            }
          }

          // 2. ISOLATE CONTENT: Clear body and only re-add the printable area
          const printable = clonedDoc.querySelector(
            ".printable-area"
          ) as HTMLElement;
          if (printable) {
            const body = clonedDoc.body;
            body.innerHTML = "";
            body.appendChild(printable);

            // 3. REFINE PRINTABLE STYLES: Ensure clean background and spacing
            printable.style.boxShadow = "none";
            printable.style.border = "none";
            printable.style.margin = "0";
            printable.style.padding = "40px";
            printable.style.width = "auto";
            printable.style.background = "white";

            // 4. FORCE LEGACY COLORS: Override primary brand colors
            const all = printable.querySelectorAll("*");
            all.forEach((el) => {
              if (el instanceof HTMLElement) {
                if (
                  el.classList.contains("text-primary") ||
                  el.classList.contains("bg-primary")
                ) {
                  if (el.classList.contains("text-primary"))
                    el.style.color = "#0ea5e9";
                  if (el.classList.contains("bg-primary"))
                    el.style.backgroundColor = "#0ea5e9";
                }
              }
            });
          }
        },
      } as any);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${saleId.substring(0, 8)}.pdf`);

      toast.success("PDF документът е генериран успешно!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Възникна грешка при генерирането на PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) return <ReceiptSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!details) return <ErrorDisplay message="Няма намерени данни." />;

  const { sale, member, relatedMember, service } = details;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
        .receipt-table th {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a1a1aa;
          border-bottom: 2px solid #f4f4f5;
          padding-bottom: 0.75rem;
        }
        .receipt-table td {
          padding: 1rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .receipt-header-line {
          height: 4px;
          background: #09090b;
          width: 60px;
          margin-bottom: 2rem;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 sm:p-12 receipt-container">
        {/* ACTION BAR */}
        <div className="flex flex-wrap justify-between items-center mb-12 no-print gap-4 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-zinc-950 rounded-full" />
            <h1 className="text-lg font-medium text-zinc-900 uppercase tracking-widest">
              Преглед на разписка
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="bg-white rounded-xl border-zinc-200"
            >
              <Printer className="mr-2 h-4 w-4" />
              Принтиране
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              size="sm"
              className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-xl px-6"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}
            </Button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div
          ref={receiptRef}
          className="bg-white border border-zinc-100 p-[15mm] printable-area overflow-hidden relative"
        >
          {/* Subtle Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />

          <header className="flex justify-between items-start mb-16 relative z-10">
            <div>
              <div className="relative w-24 h-24 mb-6">
                <Image
                  src="/logo.png"
                  alt="Club Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="96px"
                />
              </div>
              <div className="receipt-header-line" />
              <h2 className="text-xl font-bold text-zinc-950 mb-2 uppercase tracking-tighter">
                {clubInfo.name}
              </h2>
              <div className="text-[9pt] text-gray-500 space-y-1 font-medium max-w-xs leading-relaxed">
                <p>{clubInfo.address}</p>
                <p>
                  {clubInfo.email} • {clubInfo.contact}
                </p>
                <p className="text-zinc-400">Област: Стара Загора</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black text-zinc-950 mb-2 tracking-tighter uppercase italic">
                БЛАГОДАРИМ ВИ!
              </h1>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-8">
                РАЗПИСКА ЗА ПЛАЩАНЕ № {sale?.id.substring(0, 8).toUpperCase()}
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    НОМЕР НА РАЗПИСКА
                  </p>
                  <p className="text-2xl font-mono font-medium text-zinc-900 tracking-tighter">
                    #{sale?.id.substring(0, 8).toUpperCase() || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    ДАТА НА ИЗДАВАНЕ
                  </p>
                  <p className="text-sm font-bold text-zinc-800">
                    {sale?.saleDate
                      ? new Date(sale.saleDate).toLocaleDateString("bg-BG", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main>
            {/* Parties Section */}
            <div className="grid grid-cols-2 gap-16 mb-16">
              <div>
                <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-4 border-b pb-2">
                  ДОСТАВЧИК
                </h3>
                <p className="font-bold text-zinc-900 text-md mb-1">
                  {clubInfo.name}
                </p>
                <p className="text-[9pt] text-gray-500 leading-relaxed font-medium">
                  {clubInfo.address}
                  <br />
                  България (Област Стара Загора)
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-4 border-b pb-2">
                  ПОЛУЧАТЕЛ
                </h3>
                {member ? (
                  <p className="font-bold text-zinc-900 text-md mb-1">
                    {formatFullName(member)}
                  </p>
                ) : (
                  <p className="font-bold text-rose-600">
                    (Липсват данни за член)
                  </p>
                )}
                <div className="text-[9pt] text-gray-500 leading-relaxed font-medium">
                  {relatedMember && (
                    <p className="text-zinc-900">
                      {formatFullName(relatedMember)} (Член)
                    </p>
                  )}
                  <p>{member?.address || "Адрес: (не е посочен)"}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-16 receipt-table">
              <thead>
                <tr>
                  <th className="w-1/2">ОПИСАНИЕ НА УСЛУГАТА / ПРОДУКТА</th>
                  <th className="text-center">К-ВО</th>
                  <th className="text-right">ЕД. ЦЕНА</th>
                  <th className="text-right">ОБЩО</th>
                </tr>
              </thead>
              <tbody>
                {sale?.items && sale.items.length > 0 ? (
                  sale.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <p className="font-bold text-zinc-900">
                          {item.name || "(Липсва име)"}
                        </p>
                        {service?.name && (
                          <p className="text-[8pt] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                            {service.name}
                          </p>
                        )}
                      </td>
                      <td className="text-center font-medium text-zinc-600">
                        {item.quantity}
                      </td>
                      <td className="text-right font-medium text-gray-600">
                        {formatPrice(item.price)}
                      </td>
                      <td className="text-right font-black text-zinc-950">
                        {formatPrice(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-gray-300 font-medium italic"
                    >
                      Няма добавени артикули.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals & Footer Info */}
            <div className="flex justify-between items-start gap-12">
              <div className="max-w-sm">
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 mb-6">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                    НАЧИН НА ПЛАЩАНЕ
                  </h4>
                  <p className="text-sm font-bold text-zinc-700">
                    В брой / Банков превод
                  </p>
                  <p className="text-[8pt] text-zinc-400 mt-2 font-medium leading-relaxed italic">
                    Документът е издаден от автоматизирана система в
                    съответствие с чл. 7, ал. 1 от Закона за счетоводството.
                  </p>
                </div>

                <div className="flex gap-4 items-center px-2">
                  <div
                    className={`w-3 h-3 rounded-full ${sale?.isPaid ? "bg-emerald-500" : "bg-rose-500"}`}
                  />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    СТАТУС: {sale?.isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                  </span>
                </div>
              </div>

              <div className="w-64 space-y-3">
                <div className="flex justify-between items-center text-gray-400 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    МЕЖДИННА СУМА
                  </span>
                  <span className="font-bold text-sm">
                    {formatPrice(sale?.totalAmount || 0)}
                  </span>
                </div>
                <div className="border-t-2 border-zinc-950 pt-4 flex justify-between items-center px-2">
                  <span className="text-sm font-black uppercase tracking-tighter text-zinc-950">
                    ОБЩО ЗА ПЛАЩАНЕ
                  </span>
                  <span className="text-3xl font-black text-zinc-950 tracking-tighter">
                    {formatPrice(sale?.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Signatures & Custom Message */}
            <footer className="mt-32">
              <div className="grid grid-cols-2 gap-16 mb-16 px-4">
                <div className="border-t border-zinc-200 pt-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8 text-center">
                    ПОДПИС ДОСТАВЧИК
                  </p>
                  <div className="h-px bg-zinc-100 w-3/4 mx-auto" />
                </div>
                <div className="border-t border-zinc-200 pt-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8 text-center">
                    ПОДПИС ПОЛУЧАТЕЛ
                  </p>
                  <div className="h-px bg-zinc-100 w-3/4 mx-auto" />
                </div>
              </div>

              <div className="text-center pt-8 border-t border-zinc-50">
                <EditableReceiptMessage />
                <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-[0.3em] mt-6">
                  {clubInfo.name} &copy; {new Date().getFullYear()} • BK
                  Galabovo & Recovery Zone
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

const EditableReceiptMessage = () => {
  const [message, setMessage] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("receipt-custom-message") ||
        "Благодарим Ви, че избрахте нас!"
      );
    }
    return "Благодарим Ви, че избрахте нас!";
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    localStorage.setItem("receipt-custom-message", message);
    setIsEditing(false);
    toast.success("Съобщението е запазено!");
  };

  if (isEditing) {
    return (
      <div className="flex flex-col items-center gap-3 no-print">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full min-w-[300px] p-4 text-sm font-bold text-center border-2 border-primary rounded-xl focus:outline-none"
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Отказ
          </Button>
          <Button size="sm" onClick={handleSave}>
            Запази
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer inline-block"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest italic">
        &quot;{message}&quot;
      </p>
      <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity no-print">
        <Edit className="h-4 w-4 text-blue-500" />
      </div>
    </div>
  );
};

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
      <AlertTitle className="text-lg font-bold">
        Грешка при зареждане
      </AlertTitle>
      <AlertDescription className="mt-2 text-md font-medium">
        {message}
      </AlertDescription>
    </Alert>
  </div>
);
