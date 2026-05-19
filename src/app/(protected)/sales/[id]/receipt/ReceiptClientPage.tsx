"use client";

import { useState, useEffect, useRef } from "react";
import {
  Printer,
  AlertCircle,
  FileDown,
  BadgeCheck,
  Scissors,
} from "lucide-react";
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
import { Member, ClubService, Sale, Subscription } from "@/types";

interface ReceiptClientPageProps {
  saleId: string;
}

interface ReceiptCopyProps {
  label: string;
  sale: Sale | null;
  member: Member | null;
  relatedMember: Member | null;
  service: ClubService | null;
  subscription: Subscription | null;
}

const ReceiptCopy = ({
  label,
  sale,
  member,
  relatedMember,
  service,
}: ReceiptCopyProps) => {
  const formattedDate = sale?.saleDate
    ? new Date(sale.saleDate).toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("bg-BG");

  return (
    <div
      className="flex flex-col h-[470px] border border-black p-6 bg-white relative"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", wordSpacing: "2px" }}
    >
      <div className="flex flex-col h-full text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              РАЗПИСКА ЗА ПЛАЩАНЕ
            </h2>
            <p className="text-[10px] font-bold uppercase text-[#475569]">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {formattedDate}
            </p>
            <p className="text-[10px] font-bold uppercase mt-1 text-[#64748b]">
              {label}
            </p>
          </div>
          <div className="text-right text-[10px] space-y-0.5">
            <p className="font-bold uppercase">{clubInfo.name}</p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Info Block (Получател, Статус, Начин на плащане) */}
        <div className="mb-4 text-[10px] flex justify-between items-start bg-[#f8fafc] p-3 border border-[#e2e8f0]">
          <div>
            <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">
              Получател
            </p>
            <p className="font-bold uppercase text-xs text-[#0f172a]">
              {member ? formatFullName(member) : "(Липсват данни за член)"}
            </p>
            {relatedMember && (
              <p className="text-[#475569] font-medium">
                Свързано лице: {formatFullName(relatedMember)}
              </p>
            )}
            <p className="text-[#64748b] mt-0.5 text-[9px]">
              {member?.address || "Адрес: (не е посочен)"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">
              Детайли за плащане
            </p>
            <p className="font-bold text-[#0f172a]">
              Начин: {sale?.paymentMethod || "В брой"}
            </p>
            <p className="mt-0.5 font-bold">
              Статус:{" "}
              <span
                className={
                  sale?.isPaid
                    ? "text-[#059669] font-black"
                    : "text-[#e11d48] font-black"
                }
              >
                {sale?.isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
              </span>
            </p>
            {sale?.note && (
              <p className="text-[9px] text-[#475569] italic mt-0.5">
                Бележка: {sale.note}
              </p>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-black text-[9px] font-bold uppercase">
                <th className="p-2 text-left border-r border-black">
                  Описание на услугата / продукта
                </th>
                <th className="p-2 text-center border-r border-black">К-во</th>
                <th className="p-2 text-right border-r border-black">
                  Ед. цена
                </th>
                <th className="p-2 text-right">Общо</th>
              </tr>
            </thead>
            <tbody>
              {sale?.items && sale.items.length > 0 ? (
                sale.items.map((item, index) => (
                  <tr key={index} className="border-b border-black font-medium">
                    <td className="p-2 border-r border-black font-bold">
                      {item.name || "(Липсва име)"}
                      {service?.name && (
                        <span className="block text-[8px] text-[#64748b] font-normal mt-0.5">
                          {service.name}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center border-r border-black">
                      {item.quantity}
                    </td>
                    <td className="p-2 text-right border-r border-black">
                      {formatPrice(item.price)}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatPrice(item.quantity * item.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-[#94a3b8] italic"
                  >
                    Няма добавени артикули
                  </td>
                </tr>
              )}
              <tr>
                <td
                  colSpan={3}
                  className="p-2 text-right border-r border-black font-bold uppercase text-[9px]"
                >
                  Обща стойност:
                </td>
                <td className="p-2 text-right font-bold text-xs">
                  {formatPrice(sale?.totalAmount || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Unified Legal / Accounting Statement */}
        <div className="mt-4 mb-2 text-center">
          <p className="text-[8px] text-[#64748b] italic">
            Документът е издаден от автоматизирана система в съответствие с чл.
            7, ал. 1 от Закона за счетоводството.
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-4 flex justify-between gap-16">
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              Доставчик: {clubInfo.name}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              Получател: {member ? formatFullName(member) : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[7px] text-[#94a3b8] font-bold uppercase tracking-widest">
            ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
          </p>
        </div>
      </div>
    </div>
  );
};

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

      // 1. Събираме всички активни CSS правила от браузъра и премахваме lab/oklch
      let allCSS = "";
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let j = 0; j < rules.length; j++) {
            allCSS += rules[j].cssText + "\n";
          }
        } catch (e) {
          // Игнорираме защитени с CORS външни стилове
        }
      }
      const cleanCSS = allCSS
        .replace(
          /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
          "color: rgb(15, 23, 42)"
        )
        .replace(
          /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
          "background-color: transparent"
        )
        .replace(
          /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
          "border-color: rgb(203, 213, 225)"
        )
        .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit");

      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc: Document) => {
          // Премахваме оригиналните link stylesheets, за да не ги тегли html2canvas
          const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
          linkTags.forEach((link) => link.remove());

          // Инжектираме пълния изчистен CSS (Tailwind класове)
          const styleEl = clonedDoc.createElement("style");
          styleEl.textContent =
            cleanCSS +
            "\n" +
            `
            * {
              font-family: Arial, Helvetica, sans-serif !important;
              word-spacing: 2px !important;
            }
          `;
          clonedDoc.head.appendChild(styleEl);

          // 2. Почистваме съществуващите style тагове
          const styleTags = clonedDoc.querySelectorAll("style");
          styleTags.forEach((style) => {
            if (style.innerHTML) {
              style.innerHTML = style.innerHTML
                .replace(
                  /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                  "color: rgb(15, 23, 42)"
                )
                .replace(
                  /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                  "background-color: transparent"
                )
                .replace(
                  /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                  "border-color: rgb(203, 213, 225)"
                )
                .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit");
            }
          });

          // 3. Почистваме inline стиловете на всички DOM елементи
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styleAttr = el.getAttribute("style");
            if (styleAttr && /(?:lab|oklch|lch|oklab)/i.test(styleAttr)) {
              el.setAttribute(
                "style",
                styleAttr
                  .replace(
                    /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                    "color: rgb(15, 23, 42)"
                  )
                  .replace(
                    /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                    "background-color: transparent"
                  )
                  .replace(
                    /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                    "border-color: rgb(203, 213, 225)"
                  )
                  .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit")
              );
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = 297; // A4 height in mm
      let imgWidth = pdfWidth;
      let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeight > pageHeight) {
        const ratio = pageHeight / imgHeight;
        imgHeight = pageHeight;
        imgWidth = imgWidth * ratio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);
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

  const { sale, member, relatedMember, service, subscription } = details;

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
          .no-print-visible {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 receipt-container">
        {/* ACTION BAR */}
        <div className="flex flex-wrap justify-between items-center mb-8 no-print gap-4 bg-zinc-50 p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BadgeCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase text-zinc-950">
                Разписка за Плащане
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                А4 формат (2 екземпляра)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="lg"
              className="rounded-2xl border-zinc-200 hover:bg-zinc-50 h-12 px-6 font-bold uppercase tracking-widest text-[10px]"
            >
              <Printer className="mr-2 h-4 w-4" />
              Принтирай
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              size="lg"
              className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}
            </Button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="flex justify-center bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-3xl overflow-x-auto">
          <div
            ref={receiptRef}
            className="bg-white text-zinc-950 shadow-2xl w-[794px] min-w-[794px] shrink-0 min-h-[1123px] p-8 flex flex-col justify-between gap-6 printable-area"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ReceiptCopy
              label="Екземпляр за клиента"
              sale={sale}
              member={member}
              relatedMember={relatedMember}
              service={service}
              subscription={subscription}
            />

            <div className="relative py-2 no-print-visible flex items-center justify-center">
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-zinc-300" />
              <div className="relative bg-white px-4 text-zinc-300">
                <Scissors className="w-5 h-5" />
              </div>
            </div>

            <ReceiptCopy
              label="Екземпляр за клуба"
              sale={sale}
              member={member}
              relatedMember={relatedMember}
              service={service}
              subscription={subscription}
            />
          </div>
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
