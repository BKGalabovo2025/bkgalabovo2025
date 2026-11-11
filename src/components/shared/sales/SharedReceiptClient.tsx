"use client";

import {
  AlertCircle,
  ArrowLeft,
  FileDown,
  Loader2,
  Printer,
  Receipt,
  Scissors,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";
import { formatFullName } from "@/lib/utils";
import { ClubService, Family, Member, Sale } from "@/types";

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
  const clientPhone = member?.phone || sale?.note || "";

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

  const courtMatch = sale?.items?.[0]?.productId?.match(/\d+/);
  const nameMatch = sale?.items?.[0]?.name?.match(/\d+/);
  const courtId = courtMatch?.[0] || nameMatch?.[0] || "-";

  const isRecovery =
    sale?.items?.[0]?.productId?.startsWith("recovery_session") ||
    sale?.siteId === "recoveryzone";

  return (
    <div className="receipt-card relative flex h-full flex-col justify-between rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 sm:p-5 font-sans tracking-wide text-zinc-950 dark:text-zinc-100 box-border overflow-hidden print:bg-white print:text-black print:border-zinc-600 print:rounded-xl">
      <div className="flex h-full flex-col justify-between">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 text-[10px] sm:text-xs">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base print:text-base font-medium tracking-tight text-zinc-950 dark:text-white uppercase print:text-black">
              ДОКУМЕНТ ЗА ДАРЕНИЕ
            </h2>
            <p className="text-[11px] sm:text-xs print:text-xs font-normal text-zinc-600 dark:text-zinc-400 print:text-zinc-700 uppercase">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
            </p>
            <p className="text-[11px] sm:text-xs print:text-xs font-normal text-zinc-800 dark:text-zinc-200 print:text-black uppercase">
              {label}
            </p>
          </div>
          <div className="space-y-0.5 text-left sm:text-right text-[10px] sm:text-[11px] print:text-[11px] text-zinc-600 dark:text-zinc-400 print:text-zinc-700 leading-tight">
            <p className="font-medium text-zinc-950 dark:text-white print:text-black uppercase">
              {clubInfo.name}
            </p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Legal statement */}
        <div className="my-2 text-justify text-[10px] sm:text-xs print:text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-300 print:text-zinc-800">
          С настоящия документ се потвърждава постъпило целево дарение от{" "}
          <span className="font-medium text-zinc-950 dark:text-white print:text-black uppercase">
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
        <div className="flex-1 my-1 overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-700 print:border-zinc-400 text-[10px] sm:text-xs print:text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 print:border-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/60 print:bg-zinc-50/60 text-[9px] sm:text-[10px] print:text-[10px] font-medium text-zinc-600 dark:text-zinc-400 print:text-zinc-700 uppercase">
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-left">
                  Описание на дарението
                </th>
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center w-20">
                  {isRecovery ? "Услуга" : "Корт"}
                </th>
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center w-36">
                  Дата / Час
                </th>
                <th className="px-3 py-1.5 sm:py-2 text-right w-24">Сума</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 font-normal">
                <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-left font-normal text-zinc-900 dark:text-white print:text-black">
                  Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“{" "}
                  {isRecovery
                    ? "от възстановителни процедури от Recovery zone by ZM"
                    : "за ползване на бадминтон корт"}
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center font-normal text-zinc-900 dark:text-white print:text-black">
                  {isRecovery
                    ? sale?.items?.[0]?.name?.replace("Възстановяване: ", "") ||
                      "Услуга"
                    : courtId}
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center text-zinc-800 dark:text-zinc-200 print:text-black font-normal">
                  {formattedDate}
                  <br />
                  {timeRange} ({hours} ч.)
                </td>
                <td className="px-3 py-1.5 sm:py-2 text-right font-medium text-zinc-900 dark:text-white print:text-black">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
              <tr className="bg-zinc-100/60 dark:bg-zinc-800/60 print:bg-zinc-50/60 font-medium">
                <td
                  colSpan={3}
                  className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs print:text-xs uppercase text-zinc-900 dark:text-white print:text-black font-medium"
                >
                  Обща стойност:
                </td>
                <td className="px-3 py-1.5 sm:py-2 text-right text-xs sm:text-sm print:text-sm text-zinc-950 dark:text-white print:text-black font-medium">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-3 flex justify-between text-[11px] sm:text-xs print:text-xs font-normal uppercase text-zinc-800 dark:text-zinc-300 print:text-black">
          <div>За Клуба: {clubInfo.name}</div>
          <div>Дарител: {clientName}</div>
        </div>

        {/* Disclaimer */}
        <div className="mt-1.5 text-center">
          <p className="text-[8px] sm:text-[9px] print:text-[9px] font-normal tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
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
  familyMembers,
}: ReceiptCopyProps) => {
  const { paymentDate, issueDate } = getReceiptDates(sale);
  let clientDisplayName = "N/A";
  if (sale?.clientName && sale.clientName.trim()) {
    clientDisplayName = sale.clientName.trim();
  } else if (familyMembers && familyMembers.length > 0) {
    clientDisplayName = [
      member ? `${member.firstName} ${member.lastName}` : null,
      ...familyMembers.map((m) => `${m.firstName} ${m.lastName}`),
    ]
      .filter(Boolean)
      .join(", ");
  } else if (member) {
    clientDisplayName = `${member.firstName} ${member.lastName}`;
  }

  return (
    <div className="receipt-card relative flex h-full flex-col justify-between rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 sm:p-5 font-sans tracking-wide text-zinc-950 dark:text-zinc-100 box-border overflow-hidden print:bg-white print:text-black print:border-zinc-600 print:rounded-xl">
      <div className="flex h-full flex-col justify-between">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 text-[10px] sm:text-xs">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base print:text-base font-medium tracking-tight text-zinc-950 dark:text-white uppercase print:text-black">
              РАЗПИСКА ЗА ПЛАЩАНЕ
            </h2>
            <p className="text-[11px] sm:text-xs print:text-xs font-normal text-zinc-600 dark:text-zinc-400 print:text-zinc-700 uppercase">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
            </p>
            <p className="text-[11px] sm:text-xs print:text-xs font-normal text-zinc-800 dark:text-zinc-200 print:text-black uppercase">
              {label}
            </p>
          </div>
          <div className="space-y-0.5 text-left sm:text-right text-[10px] sm:text-[11px] print:text-[11px] text-zinc-600 dark:text-zinc-400 print:text-zinc-700 leading-tight">
            <p className="font-medium text-zinc-950 dark:text-white print:text-black uppercase">
              {clubInfo.name}
            </p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Info Block (Получател, Статус, Начин на плащане) */}
        <div className="my-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-3 text-[10px] sm:text-xs print:grid-cols-3 print:bg-zinc-50/50 print:border-zinc-400 print:p-2.5">
          <div>
            <span className="block text-[9px] sm:text-[10px] font-normal tracking-wider text-zinc-500 uppercase">
              Получател на услугата
            </span>
            <span className="text-xs sm:text-sm font-medium text-zinc-950 dark:text-white print:text-black uppercase mt-0.5 block">
              {sale?.memberId ? (
                <Link
                  href={`/members/${sale.memberId}`}
                  className="hover:underline text-blue-600 dark:text-blue-400 print:text-black print:no-underline"
                >
                  {clientDisplayName}
                </Link>
              ) : (
                clientDisplayName
              )}
            </span>
          </div>
          <div className="text-left sm:text-center print:text-center">
            <span className="block text-[9px] sm:text-[10px] font-normal tracking-wider text-zinc-500 uppercase">
              Статус на плащане
            </span>
            <span className="block text-xs sm:text-sm font-medium text-zinc-950 dark:text-white print:text-black uppercase mt-0.5">
              {sale?.isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
              {paymentDate} г.
            </span>
          </div>
          <div className="text-left sm:text-right print:text-right">
            <span className="block text-[9px] sm:text-[10px] font-normal tracking-wider text-zinc-500 uppercase">
              Начин на плащане
            </span>
            <span className="text-xs sm:text-sm font-medium text-zinc-950 dark:text-white print:text-black uppercase mt-0.5 block">
              {sale?.paymentMethod || "В брой"}
            </span>
          </div>
        </div>

        {/* Client 2 (if present and not already listed in clientDisplayName) */}
        {(sale?.client2Name || relatedMember) &&
          !clientDisplayName.includes(
            sale?.client2Name || relatedMember?.firstName || "---"
          ) && (
            <div className="mb-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-2.5 py-1 text-[9px] sm:text-[10px]">
              <span className="mr-1 font-normal tracking-widest text-zinc-500 uppercase">
                Втори клиент:
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {sale?.client2Name || formatFullName(relatedMember!)}
              </span>
              {sale?.client2Phone && (
                <span className="ml-1 text-zinc-500">
                  ({sale.client2Phone})
                </span>
              )}
            </div>
          )}

        {/* Note Block */}
        {sale?.note && (
          <div className="mb-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-2.5 py-1 text-[9px] sm:text-[10px]">
            <span className="mr-1 font-normal tracking-widest text-zinc-500 uppercase">
              Бележка:
            </span>
            <span className="text-zinc-800 dark:text-zinc-300 italic">
              {sale.note}
            </span>
          </div>
        )}

        {/* Content Table */}
        <div className="flex-1 my-1 overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-700 print:border-zinc-400 text-[10px] sm:text-xs print:text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 print:border-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/60 print:bg-zinc-50/60 text-[9px] sm:text-[10px] print:text-[10px] font-medium text-zinc-600 dark:text-zinc-400 print:text-zinc-700 uppercase">
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-left">
                  Описание на услугата / продукта
                </th>
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center w-16">
                  К-во
                </th>
                <th className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-right w-24">
                  Ед. цена
                </th>
                <th className="px-3 py-1.5 sm:py-2 text-right w-24">Общо</th>
              </tr>
            </thead>
            <tbody>
              {sale?.items && sale.items.length > 0 ? (
                sale.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 font-normal"
                  >
                    <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-left font-normal text-zinc-900 dark:text-white print:text-black">
                      {item.name || "(Липсва име)"}
                      {sale?.targetMonthLabels &&
                        sale.targetMonthLabels.length > 0 && (
                          <span className="ml-1 text-[9px] font-normal text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
                            ({sale.targetMonthLabels.join(", ")})
                          </span>
                        )}
                      {sale?.targetEventDates &&
                        sale.targetEventDates.length > 0 && (
                          <span className="ml-1 text-[9px] font-normal text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
                            (Дата: {sale.targetEventDates.join(", ")})
                          </span>
                        )}

                      {service?.name && (
                        <span className="block text-[8px] font-normal text-zinc-500 dark:text-zinc-400">
                          {service.name}
                        </span>
                      )}
                    </td>
                    <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-2 py-1.5 sm:py-2 text-center text-zinc-800 dark:text-zinc-200 print:text-black font-normal">
                      {item.quantity}
                    </td>
                    <td className="border-r border-zinc-200 dark:border-zinc-700/60 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-right text-zinc-800 dark:text-zinc-200 print:text-black">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-3 py-1.5 sm:py-2 text-right font-medium text-zinc-900 dark:text-white print:text-black">
                      {formatPrice(item.quantity * item.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-3 text-center text-zinc-400 italic"
                  >
                    Няма добавени артикули
                  </td>
                </tr>
              )}
              <tr className="bg-zinc-100/60 dark:bg-zinc-800/60 print:bg-zinc-50/60 font-medium">
                <td
                  colSpan={3}
                  className="border-r border-zinc-200 dark:border-zinc-700 print:border-zinc-400 px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs print:text-xs uppercase text-zinc-900 dark:text-white print:text-black"
                >
                  Обща стойност:
                </td>
                <td className="px-3 py-1.5 sm:py-2 text-right text-xs sm:text-sm print:text-sm text-zinc-950 dark:text-white print:text-black font-medium">
                  {formatPrice(sale?.totalAmount || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-3 flex justify-between text-[11px] sm:text-xs print:text-xs font-normal uppercase text-zinc-800 dark:text-zinc-300 print:text-black">
          <div>Доставчик: {clubInfo.name}</div>
          <div>Получател: {clientDisplayName}</div>
        </div>

        {/* Disclaimer */}
        <div className="mt-1.5 text-center">
          <p className="text-[8px] sm:text-[9px] print:text-[9px] font-normal tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
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
      const { generatePdfFromElement } = await import("@/lib/html-to-pdf");
      await generatePdfFromElement(
        receiptRef.current,
        `receipt-${saleId.substring(0, 8)}.pdf`,
        "portrait"
      );
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            color-scheme: light !important;
            animation: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
            perspective: none !important;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide application chrome, sidebar, header, navigation, and buttons */
          .peer,
          [data-state],
          [data-sidebar],
          .sidebar,
          header,
          nav,
          aside,
          .skip-link,
          .no-print,
          button,
          [data-slot="page-header"] {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          /* Neutralize all ancestor wrappers */
          body > div,
          .group\/sidebar-wrapper,
          .group\/sidebar-wrapper > div,
          main,
          [data-slot="sidebar-inset"],
          #main-content,
          #main-content > div,
          .receipt-container,
          .receipt-print-wrapper {
            display: block !important;
            position: static !important;
            float: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            overflow: visible !important;
            transform: none !important;
          }
          /* Full A4 sheet (210mm x 297mm) with 10mm lateral and 7mm top/bottom padding */
          .printable-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 7mm 10mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
            z-index: 999999 !important;
          }
          /* Crisp normal typography without unreadable heavy bolding */
          .printable-area,
          .printable-area * {
            font-weight: 400 !important;
            color: #000000 !important;
          }
          .printable-area h2,
          .printable-area .font-medium {
            font-weight: 500 !important;
          }
          /* Each half takes exactly 50% of available printable height */
          .receipt-half {
            flex: 1 1 0% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          /* Clear, legible receipt card filling its half */
          .receipt-card {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 100% !important;
            width: 100% !important;
            border: 1px solid #71717a !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          /* Midline scissors cutting boundary at exact 50% center of sheet */
          .cut-line-container {
            flex: 0 0 9mm !important;
            height: 9mm !important;
            max-height: 9mm !important;
            min-height: 9mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          .cut-line-container .border-dashed {
            border-top: 1px dashed #71717a !important;
          }
          .printable-area .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `,
        }}
      />

      <div className="receipt-container mx-auto max-w-4xl p-3 sm:p-6 md:p-8 print:m-0 print:p-0 print:max-w-none print:w-full space-y-6">
        {/* GOLDEN HYBRID ACTION BAR */}
        <div className="no-print rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Button
                variant="outline"
                size="icon"
                className="size-10 sm:size-11 shrink-0 rounded-2xl border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-200"
                onClick={() => (window.location.href = backUrl)}
                title="Назад към продажбите"
              >
                <ArrowLeft className="size-4 sm:size-5" />
              </Button>
              <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                <Receipt className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:xl font-black tracking-tight text-zinc-950 dark:text-white uppercase truncate">
                    Разписка за Плащане
                  </h1>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      sale?.isPaid
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                        : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60"
                    }`}
                  >
                    {sale?.isPaid ? "Платено" : "Неплатено"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"}
                  </span>
                  <span>•</span>
                  <span>А4 формат (2 екземпляра на 1 лист)</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 sm:flex-none h-10 sm:h-11 rounded-2xl border-zinc-200 px-5 text-xs font-bold uppercase hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-100"
                title="Принтирай на принтер"
              >
                <Printer className="mr-1.5 size-4 text-blue-600 dark:text-blue-400" />
                Принтирай
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex-1 sm:flex-none h-10 sm:h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 text-xs font-bold text-white uppercase shadow-sm shadow-emerald-600/20"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <FileDown className="mr-1.5 size-4" />
                )}
                Изтегли PDF
              </Button>
            </div>
          </div>
        </div>

        {/* RESPONSIVE ON-SCREEN SHEET & PRINT TARGET */}
        <div className="receipt-print-wrapper w-full mx-auto print:max-w-none print:w-full print:m-0 print:p-0">
          <div
            ref={receiptRef}
            className="printable-area pdf-page mx-auto w-full flex flex-col justify-between gap-5 sm:gap-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 md:p-8 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:bg-white print:text-black"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Top Half: 1/2 A4 */}
            <div className="receipt-half top-half w-full flex flex-col justify-between box-border">
              <ReceiptCopy
                label="Екземпляр за получателя"
                sale={sale}
                member={member}
                relatedMember={relatedMember}
                service={service}
                family={family}
                familyMembers={familyMembers}
              />
            </div>

            {/* Midline cutting marker between the two 1/2 A4 halves */}
            <div className="cut-line-container w-full h-[11mm] relative flex items-center justify-center my-0">
              <div className="absolute inset-x-0 border-t border-dashed border-zinc-300 dark:border-zinc-700 print:border-zinc-400" />
              <div className="relative flex items-center gap-1.5 bg-white dark:bg-zinc-900 print:bg-white px-3 text-zinc-500 dark:text-zinc-400 print:text-zinc-600 text-[9px] sm:text-[10px] font-medium tracking-widest uppercase">
                <Scissors className="size-3.5" />
                <span>Линия за изрязване (1/2 А4)</span>
              </div>
            </div>

            {/* Bottom Half: 1/2 A4 */}
            <div className="receipt-half bottom-half w-full flex flex-col justify-between box-border">
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
