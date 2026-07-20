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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice } from "@/lib/currency";
import { formatFullName } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Member, ClubService, Sale, Family } from "@/types";


interface ReceiptCopyProps {
  label: string;
  sale: Sale | null;
  member: Member | null;
  relatedMember: Member | null;
  service: ClubService | null;
  family?: Family | null;
  familyMembers?: Member[];
}

const getReceiptDates = (sale: Sale | null) => {
  const paymentDate = sale?.saleDate
    ? new Date(sale.saleDate).toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("bg-BG");

  let issueDate = new Date().toLocaleDateString("bg-BG");
  if (sale?.createdAt) {
    issueDate = new Date(sale.createdAt).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } else if (sale?.saleDate) {
    issueDate = new Date(sale.saleDate).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return { paymentDate, issueDate };
};

const DonationReceipt = ({ label, sale, member }: ReceiptCopyProps) => {
  const { issueDate } = getReceiptDates(sale);
  const hours = sale?.items?.[0]?.quantity || 1;
  const totalAmount = sale?.totalAmount || 0;
  const clientName =
    sale?.clientName ||
    (member ? `${member.firstName} ${member.lastName}` : "Външен клиент");
  const clientPhone = member?.phone || sale?.note || ""; // fallback

  const start = sale?.saleDate ? new Date(sale.saleDate) : new Date();
  const end = new Date(start.getTime() + hours * 3600000);

  const formattedDate =
    start.toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " г.";

  const timeRange =
    start.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    " - " +
    end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

  // Extract court number from product ID (e.g. court_rental_3 -> 3) or name
  const courtMatch = sale?.items?.[0]?.productId?.match(/\d+/);
  const nameMatch = sale?.items?.[0]?.name?.match(/\d+/);
  const courtId = courtMatch?.[0] || nameMatch?.[0] || "-";

  const isRecovery =
    sale?.items?.[0]?.productId?.startsWith("recovery_session") ||
    sale?.siteId === "recoveryzone";

  return (
    <div className="relative flex flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-6 font-sans tracking-wide text-zinc-950 shadow-sm">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between border-b border-zinc-200 pb-3 text-[10px]">
          <div className="space-y-1">
            <h2 className="text-xs font-bold tracking-tight text-zinc-900 uppercase">
              ДОКУМЕНТ ЗА ДАРЕНИЕ
            </h2>
            <p className="text-[9px] font-bold text-zinc-500 uppercase">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase">
              {label}
            </p>
          </div>
          <div className="space-y-0.5 text-right text-[9px] text-zinc-500">
            <p className="font-bold text-zinc-700 uppercase">{clubInfo.name}</p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Legal statement */}
        <div className="mb-3 text-justify text-[10px] leading-relaxed text-zinc-700">
          С настоящия документ се потвърждава постъпило целево дарение от{" "}
          <span className="font-bold text-zinc-900 uppercase">
            {clientName}
          </span>{" "}
          {clientPhone && `(тел. ${clientPhone})`} в полза на СНЦ „БАДМИНТОН
          КЛУБ ГЪЛЪБОВО“. Дарените средства ще бъдат използвани изцяло за
          поддържане на материално-техническата база (МТО) на клуба и неговите
          уставни цели,{" "}
          {isRecovery
            ? "включително развитие на възстановителния център Recovery zone by ZM."
            : "включително развитие на детско-юношеската школа по бадминтон."}
        </div>

        {/* Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-zinc-200 text-[9px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[8px] font-bold text-zinc-500 uppercase">
                <th className="border-r border-zinc-200 p-1.5 text-left">
                  Описание на дарението
                </th>
                <th className="border-r border-zinc-200 p-1.5 text-center">
                  {isRecovery ? "Услуга" : "Корт"}
                </th>
                <th className="border-r border-zinc-200 p-1.5 text-center">
                  Дата / Час
                </th>
                <th className="p-1.5 text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200 font-medium">
                <td className="border-r border-zinc-200 p-1.5 text-left font-bold text-zinc-800">
                  Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“{" "}
                  {isRecovery
                    ? "от възстановителни процедури от Recovery zone by ZM"
                    : "за ползване на бадминтон корт"}
                </td>
                <td className="border-r border-zinc-200 p-1.5 text-center font-bold text-zinc-800">
                  {isRecovery
                    ? sale?.items?.[0]?.name?.replace("Възстановяване: ", "") ||
                      "Услуга"
                    : courtId}
                </td>
                <td className="border-r border-zinc-200 p-1.5 text-center text-zinc-800">
                  {formattedDate}
                  <br />
                  {timeRange} ({hours} ч.)
                </td>
                <td className="p-1.5 text-right font-bold text-zinc-800">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="border-r border-zinc-200 p-1.5 text-right text-[8px] font-bold text-zinc-400 uppercase"
                >
                  Обща стойност:
                </td>
                <td className="p-1.5 text-right text-[10px] font-bold text-zinc-900">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-4 flex justify-between gap-12 text-zinc-500">
          <div className="flex-1">
            <div className="h-px w-full bg-zinc-300" />
            <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
              За Клуба: {clubInfo.name}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-px w-full bg-zinc-300" />
            <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
              Дарител: {clientName}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[7px] font-bold tracking-widest text-zinc-400 uppercase">
            ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
          </p>
        </div>
      </div>
    </div>
  );
};

const StandardReceipt = ({
  label,
  sale,
  member,
  relatedMember,
  service,
}: ReceiptCopyProps) => {
  const { paymentDate, issueDate } = getReceiptDates(sale);

  return (
    <div className="relative flex flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-6 font-sans tracking-wide text-zinc-950 shadow-sm">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between border-b border-zinc-200 pb-3 text-[10px]">
          <div className="space-y-1">
            <h2 className="text-xs font-bold tracking-tight text-zinc-900 uppercase">
              РАЗПИСКА ЗА ПЛАЩАНЕ
            </h2>
            <p className="text-[9px] font-bold text-zinc-500 uppercase">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
            </p>
            <p className="mt-1 text-[9px] font-bold text-zinc-500 uppercase">
              {label}
            </p>
          </div>
          <div className="space-y-0.5 text-right text-[9px] text-zinc-500">
            <p className="font-bold text-zinc-700 uppercase">{clubInfo.name}</p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Info Block (Получател, Статус, Начин на плащане) */}
        <div className="mb-3 flex items-start justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 text-[9px]">
          <div className="space-y-0.5">
            <span className="mb-0.5 block font-bold tracking-widest text-zinc-400 uppercase">
              Получател на услугата
            </span>
            <span className="text-[10px] font-bold text-zinc-800 uppercase">
              {sale?.clientName || (member ? formatFullName(member) : "N/A")}
            </span>
            {(sale?.clientPhone || member?.phone) && (
              <span className="mt-0.5 block text-zinc-500">
                {sale?.clientPhone || member?.phone}
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-center">
            <span className="mb-0.5 block font-bold tracking-widest text-zinc-400 uppercase">
              Статус на плащане
            </span>
            <span
              className={`text-[10px] font-bold uppercase ${
                sale?.isPaid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {sale?.isPaid ? "Платено" : "Неплатено"}
            </span>
            <span className="mt-0.5 block text-zinc-500">{paymentDate}</span>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="mb-0.5 block font-bold tracking-widest text-zinc-400 uppercase">
              Начин на плащане
            </span>
            <span className="text-[10px] font-bold text-zinc-800 uppercase">
              {sale?.paymentMethod || "N/A"}
            </span>
          </div>
        </div>

        {/* Client 2 (if present) */}
        {(sale?.client2Name || relatedMember) && (
          <div className="mb-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-2 text-[9px]">
            <span className="mr-1 font-bold tracking-widest text-zinc-500 uppercase">
              Втори клиент:
            </span>
            <span className="font-bold text-zinc-800">
              {sale?.client2Name || formatFullName(relatedMember!)}
            </span>
            {sale?.client2Phone && (
              <span className="ml-1 text-zinc-500">({sale.client2Phone})</span>
            )}
          </div>
        )}

        {/* Note Block */}
        {sale?.note && (
          <div className="mb-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-2 text-[9px]">
            <span className="mr-1 font-bold tracking-widest text-zinc-500 uppercase">
              Бележка:
            </span>
            <span className="text-zinc-800 italic">{sale.note}</span>
          </div>
        )}

        {/* Content Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-zinc-200 text-[9px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[8px] font-bold text-zinc-500 uppercase">
                <th className="border-r border-zinc-200 p-1.5 text-left">
                  Описание на услугата / продукта
                </th>
                <th className="border-r border-zinc-200 p-1.5 text-center">
                  К-во
                </th>
                <th className="border-r border-zinc-200 p-1.5 text-right">
                  Ед. цена
                </th>
                <th className="p-1.5 text-right">Общо</th>
              </tr>
            </thead>
            <tbody>
              {sale?.items && sale.items.length > 0 ? (
                sale.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-200 font-medium"
                  >
                    <td className="border-r border-zinc-200 p-1.5 text-left font-bold text-zinc-800">
                      {item.name || "(Липсва име)"}
                      {sale?.targetMonthLabels &&
                        sale.targetMonthLabels.length > 0 && (
                          <span className="ml-1 text-[9px] font-normal text-zinc-500">
                            ({sale.targetMonthLabels.join(", ")})
                          </span>
                        )}
                      {sale?.targetEventDates &&
                        sale.targetEventDates.length > 0 && (
                          <span className="ml-1 text-[9px] font-normal text-zinc-500">
                            (Дата: {sale.targetEventDates.join(", ")})
                          </span>
                        )}

                      {service?.name && (
                        <span className="mt-0.5 block text-[8px] font-normal text-zinc-500">
                          {service.name}
                        </span>
                      )}
                    </td>
                    <td className="border-r border-zinc-200 p-1.5 text-center text-zinc-800">
                      {item.quantity}
                    </td>
                    <td className="border-r border-zinc-200 p-1.5 text-right text-zinc-800">
                      {formatPrice(item.price)}
                    </td>
                    <td className="p-1.5 text-right font-bold text-zinc-800">
                      {formatPrice(item.quantity * item.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-zinc-400 italic"
                  >
                    Няма добавени артикули
                  </td>
                </tr>
              )}
              <tr>
                <td
                  colSpan={3}
                  className="border-r border-zinc-200 p-1.5 text-right text-[8px] font-bold text-zinc-400 uppercase"
                >
                  Обща стойност:
                </td>
                <td className="p-1.5 text-right text-[10px] font-bold text-zinc-900">
                  {formatPrice(sale?.totalAmount || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Unified Legal / Accounting Statement */}
        <div className="mt-4 border-t border-zinc-100 pt-3 text-center text-[7px] text-zinc-400">
          Документът е издаден съгласно чл. 7, ал. 1 от Закона за
          счетоводството.
        </div>

        {/* Signatures */}
        <div className="mt-4 flex justify-between gap-12 text-zinc-500">
          <div className="flex-1">
            <div className="h-px w-full bg-zinc-300" />
            <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
              Доставчик: {clubInfo.name}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-px w-full bg-zinc-300" />
            <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
              Получател: {member ? formatFullName(member) : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[7px] font-bold tracking-widest text-zinc-400 uppercase">
            ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
          </p>
        </div>
      </div>
    </div>
  );
};

const ReceiptCopy = (props: ReceiptCopyProps) => {
  const isDonation =
    props.sale?.items?.[0]?.productId?.startsWith("court_rental") ||
    props.sale?.items?.[0]?.productId?.startsWith("recovery_session") ||
    props.sale?.items?.[0]?.name?.toLowerCase()?.includes("наем на корт") ||
    props.sale?.siteId === "recoveryzone";

  if (isDonation) {
    return <DonationReceipt {...props} />;
  }
  return <StandardReceipt {...props} />;
};

export interface SharedReceiptClientProps {
  saleId: string;
  initialDetails: {
    sale: Sale | null;
    member: Member | null;
    relatedMember: Member | null;
    service: ClubService | null;
    family?: Family | null;
    familyMembers?: Member[];
  };
  backUrl: string;
}

export function SharedReceiptClient({
  saleId,
  initialDetails,
  backUrl,
}: SharedReceiptClientProps) {
  const [details, setDetails] = useState<
    SharedReceiptClientProps["initialDetails"] | null
  >(initialDetails);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDetails(initialDetails);
  }, [initialDetails]);

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
        } catch {
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

  if (!details) return <ErrorDisplay message="Няма намерени данни." />;

  const { sale, member, relatedMember, service, family, familyMembers } =
    details;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4 portrait;
          }
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

      <div className="receipt-container mx-auto max-w-4xl p-4 sm:p-8">
        {/* ACTION BAR */}
        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-2xl border-zinc-200 hover:bg-zinc-100"
              onClick={() => window.location.href = backUrl}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <BadgeCheck className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                Разписка за Плащане
              </h1>
              <p className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                А4 формат (2 екземпляра)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="lg"
              className="h-12 rounded-2xl border-zinc-200 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-50"
            >
              <Printer className="mr-2 size-4" />
              Принтирай
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              size="lg"
              className="h-12 rounded-2xl bg-emerald-500 px-8 text-[10px] font-bold tracking-widest text-white uppercase shadow-xl shadow-emerald-500/20 hover:bg-emerald-600"
            >
              <FileDown className="mr-2 size-4" />
              {isGeneratingPDF ? "Генериране..." : "Изтегли PDF"}
            </Button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="overflow-x-auto rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
          <div
            ref={receiptRef}
            className="printable-area mx-auto flex min-h-[1123px] w-[794px] min-w-[794px] shrink-0 flex-col justify-between gap-6 bg-white p-8 text-zinc-950 shadow-2xl"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ReceiptCopy
              label="Екземпляр за клиента"
              sale={sale}
              member={member}
              relatedMember={relatedMember}
              service={service}
              family={family}
              familyMembers={familyMembers}
            />

            <div className="no-print-visible relative flex items-center justify-center py-2">
              <div className="absolute inset-x-0 border-t-2 border-dashed border-zinc-300" />
              <div className="relative bg-white px-4 text-zinc-300">
                <Scissors className="size-5" />
              </div>
            </div>

            <ReceiptCopy
              label="Екземпляр за клуба"
              sale={sale}
              member={member}
              relatedMember={relatedMember}
              service={service}
              family={family}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="mx-auto max-w-4xl p-8">
    <Alert variant="destructive" className="border-2">
      <AlertCircle className="size-5" />
      <AlertTitle className="text-lg font-bold">
        Грешка при зареждане
      </AlertTitle>
      <AlertDescription className="text-md mt-2 font-medium">
        {message}
      </AlertDescription>
    </Alert>
  </div>
);
