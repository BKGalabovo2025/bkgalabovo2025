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

interface ReceiptClientPageProps {
  saleId: string;
  initialDetails: {
    sale: Sale | null;
    member: Member | null;
    relatedMember: Member | null;
    service: ClubService | null;
    family?: Family | null;
    familyMembers?: Member[];
  };
}

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

const CourtRentalReceipt = ({ label, sale, member }: ReceiptCopyProps) => {
  const { issueDate } = getReceiptDates(sale);
  const hours = sale?.items?.[0]?.quantity || 1;
  const totalAmount = sale?.totalAmount || 0;
  const clientName =
    sale?.clientName ||
    (member ? `${member.firstName} ${member.lastName}` : "Външен клиент");
  const clientPhone = member?.phone || sale?.note || ""; // fallback

  const start = sale?.saleDate ? new Date(sale.saleDate) : new Date();
  const end = new Date(start.getTime() + hours * 3600000);

  const formattedDate = start.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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

  return (
    <div
      className="flex flex-col flex-1 border border-black p-4 bg-white relative animate-in fade-in duration-300"
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        wordSpacing: "2px",
      }}
    >
      <div className="flex flex-col h-full text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-2 mb-2">
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase tracking-tight">
              ДОКУМЕНТ ЗА ДАРЕНИЕ
            </h2>
            <p className="text-[9px] font-bold">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
            </p>
            <p className="text-[9px] font-bold uppercase text-zinc-500">
              {label}
            </p>
          </div>
          <div className="text-right text-[9px] space-y-0.5">
            <p className="font-bold uppercase">{clubInfo.name}</p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Legal statement */}
        <div className="mb-2 text-[10px] leading-relaxed text-justify">
          С настоящия документ се потвърждава постъпило целево дарение от{" "}
          <span className="font-bold uppercase">{clientName}</span>{" "}
          {clientPhone && `(тел. ${clientPhone})`} в полза на СНЦ „БАДМИНТОН
          КЛУБ ГЪЛЪБОВО“. Дарените средства ще бъдат използвани изцяло за
          поддържане на материално-техническата база (МТО) на клуба и неговите
          уставни цели, включително развитие на детско-юношеската школа по
          бадминтон.
        </div>

        {/* Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-zinc-100 border-b border-black text-[9px] font-bold uppercase">
                <th className="p-2 text-left border-r border-black">
                  Описание на дарението
                </th>
                <th className="p-2 text-center border-r border-black">Корт</th>
                <th className="p-2 text-center border-r border-black">
                  Дата / Час
                </th>
                <th className="p-2 text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black font-bold">
                  Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“ за
                  ползване на бадминтон корт
                </td>
                <td className="p-2 text-center border-r border-black font-bold">
                  {courtId}
                </td>
                <td className="p-2 text-center border-r border-black">
                  {formattedDate}
                  <br />
                  {timeRange} ({hours} ч.)
                </td>
                <td className="p-2 text-right font-bold">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="p-2 text-right border-r border-black font-bold uppercase text-[9px]"
                >
                  Обща стойност:
                </td>
                <td className="p-2 text-right font-bold text-xs">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-2 flex justify-between gap-16">
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              За Клуба: {clubInfo.name}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              Дарител: {clientName}
            </p>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest">
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
  family,
  familyMembers,
}: ReceiptCopyProps) => {
  const { paymentDate, issueDate } = getReceiptDates(sale);

  return (
    <div
      className="flex flex-col flex-1 border border-black p-4 bg-white relative"
      // eslint-disable-next-line react/forbid-dom-props
      style={{ fontFamily: "Arial, Helvetica, sans-serif", wordSpacing: "2px" }}
    >
      <div className="flex flex-col h-full text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-2 mb-2">
          <div className="space-y-1">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              РАЗПИСКА ЗА ПЛАЩАНЕ
            </h2>
            <p className="text-[10px] font-bold uppercase text-[#475569]">
              № {sale?.id ? sale.id.substring(0, 8).toUpperCase() : "N/A"} /{" "}
              {issueDate}
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
        <div className="mb-2 text-[10px] flex justify-between items-start bg-[#f8fafc] p-2 border border-[#e2e8f0]">
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
            {family && (
              <p className="text-[#475569] font-bold mt-0.5">
                Семейство: {family.name || "Без име"}
              </p>
            )}
            {familyMembers && familyMembers.length > 0 && (
              <p className="text-[#64748b] text-[9px] mt-0.5 italic">
                Свързани лица: {familyMembers.map(formatFullName).join(", ")}
              </p>
            )}
            <p className="text-[#64748b] mt-1 text-[9px]">
              {member?.address || "Адрес: (не е посочен)"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">
              Детайли за плащане
            </p>
            <p className="font-bold text-[#0f172a]">
              Дата на плащане: {paymentDate}
            </p>

            <p className="font-bold text-[#0f172a] mt-0.5">
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
          </div>
        </div>

        {/* Note Block */}
        {sale?.note && (
          <div className="mb-2 p-2 bg-[#fffbeb] border border-[#fde68a] text-[10px]">
            <span className="font-bold uppercase text-[#d97706] tracking-widest mr-2">
              Бележка:
            </span>
            <span className="text-[#92400e] italic font-medium">
              {sale.note}
            </span>
          </div>
        )}

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
                      {sale?.targetMonthLabels &&
                        sale.targetMonthLabels.length > 0 && (
                          <span className="ml-1 text-[9px] text-[#475569] font-semibold">
                            ({sale.targetMonthLabels.join(", ")})
                          </span>
                        )}

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
        <div className="mt-2 mb-1 text-center">
          <p className="text-[8px] text-[#64748b] italic">
            Документът е издаден от автоматизираната административна система на
            Бадминтон клуб Гълъбово
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-2 flex justify-between gap-16">
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

        <div className="mt-2 text-center">
          <p className="text-[7px] text-[#94a3b8] font-bold uppercase tracking-widest">
            ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
          </p>
        </div>
      </div>
    </div>
  );
};

const ReceiptCopy = (props: ReceiptCopyProps) => {
  const isCourtRental =
    props.sale?.items?.[0]?.productId?.startsWith("court_rental") ||
    props.sale?.items?.[0]?.name?.toLowerCase()?.includes("наем на корт");

  if (isCourtRental) {
    return <CourtRentalReceipt {...props} />;
  }
  return <StandardReceipt {...props} />;
};

export default function ReceiptClientPage({
  saleId,
  initialDetails,
}: ReceiptClientPageProps) {
  const [details, setDetails] = useState<
    ReceiptClientPageProps["initialDetails"] | null
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
        <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-3xl overflow-x-auto">
          <div
            ref={receiptRef}
            className="mx-auto bg-white text-zinc-950 shadow-2xl w-[794px] min-w-[794px] shrink-0 min-h-[1123px] p-8 flex flex-col justify-between gap-6 printable-area"
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
