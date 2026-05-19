"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-hot-toast";

import { Member } from "@/types/member.types";

const AthleteCard = ({ member }: { member: Member }) => {
  return (
    <div className="athlete-card-container border-b-2 border-dashed border-slate-300 pb-12 mb-12 last:border-0 last:mb-0 last:pb-0 h-[48vh] flex flex-col justify-between bg-white">
      <div className="w-full">
        {/* Top Section: Photo and Title */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-24 h-32 border-2 border-slate-400 flex items-center justify-center overflow-hidden bg-slate-50">
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={`${member.firstName} ${member.lastName}`}
                fill
                sizes="100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="text-[10px] text-slate-400 uppercase italic text-center px-2">
                Снимка
              </div>
            )}
          </div>
          <div className="text-center flex-1 pr-24">
            <h1 className="text-xl font-bold uppercase tracking-tight mb-1">
              Българска Федерация Бадминтон
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Картон на състезателя
            </h2>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-4 text-[10pt]">
          {/* Club Column */}
          <div className="col-span-4 space-y-3">
            <div>
              <p className="text-[11pt] font-bold border-b border-dotted border-slate-600">
                &quot;Бадминтон клуб Гълъбово&quot;
              </p>
              <p className="text-[8pt] text-slate-500 italic">/ клуб /</p>
            </div>
            <div>
              <p className="text-[11pt] border-b border-dotted border-slate-600">
                гр. Гълъбово
              </p>
              <p className="text-[8pt] text-slate-500 italic">гр.</p>
            </div>
            <div className="pt-4">
              <p className="text-[11pt] border-b border-dotted border-slate-600 min-h-6"></p>
              <p className="text-[8pt] text-slate-500 italic">
                Председател: / Подпис, печат /
              </p>
            </div>
          </div>

          {/* Athlete Column */}
          <div className="col-span-8 space-y-2">
            <div className="flex items-end gap-2">
              <span className="text-[9pt] whitespace-nowrap">Име:</span>
              <span className="flex-1 border-b border-dotted border-slate-600 font-bold">
                {member.firstName}
              </span>
              <span className="text-[9pt] whitespace-nowrap">бащино:</span>
              <span className="flex-1 border-b border-dotted border-slate-600 font-bold">
                {member.middleName || "......................"}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[9pt] whitespace-nowrap">фамилия:</span>
              <span className="flex-3 border-b border-dotted border-slate-600 font-bold">
                {member.lastName}
              </span>
              <span className="text-[9pt] whitespace-nowrap">ЕГН:</span>
              <span className="flex-1 border-b border-dotted border-slate-600 font-bold">
                {member.egn || ""}
              </span>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[9pt] whitespace-nowrap mt-1">Адрес:</span>
              <div className="flex-1">
                <p className="border-b border-dotted border-slate-600 min-h-[1.2rem] text-[9pt]">
                  {member.address || ""}
                </p>
                <p className="text-[7pt] text-slate-500 italic">
                  / Град, ул. № вх. ап. /
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6">
          <table className="w-full border-collapse border border-slate-950 text-[7.5pt]">
            <thead>
              <tr className="divide-x divide-slate-950">
                {[...Array(6)].map((_, i) => (
                  <th
                    key={i}
                    className="p-1 font-normal w-1/6 text-left space-y-1 pb-4 border-b border-slate-950"
                  >
                    <p className="font-bold">Мед. преглед</p>
                    <p>Дата: ...................</p>
                    <p>Периодичен</p>
                    <div className="pt-2">
                      <p>Подпис: .............</p>
                      <p className="text-[6pt] italic ml-4">печат</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-950">
                {[...Array(6)].map((_, i) => (
                  <td key={i} className="p-1 space-y-1 pb-2 h-24 align-top">
                    <p className="font-bold">Заверка за</p>
                    <p className="font-bold">Правоучастие</p>
                    <p>Дата: ...................</p>
                    <p>Възр. група</p>
                    <p>.............................</p>
                    <div className="pt-1">
                      <p>Председател......</p>
                      <p className="text-[6pt] italic ml-4">печат</p>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AthleteCardPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане...
      </div>
    );
  if (!member)
    return (
      <div className="p-8 text-center text-rose-500">Членът не е намерен.</div>
    );

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    setIsExporting(true);
    const toastId = toast.loading("Генериране на PDF...");

    try {
      // Capture the element as a canvas
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true, // Allow cross-origin images (avatars)
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc: Document) => {
          // html2canvas fails on modern CSS color functions like lab() and oklch()
          // which are common in Tailwind v4. We strip them from the cloned document styles.
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (
              style.innerHTML.includes("lab(") ||
              style.innerHTML.includes("oklch(")
            ) {
              style.innerHTML = style.innerHTML
                .replace(/lab\([^)]+\)/g, "#000000")
                .replace(/oklch\([^)]+\)/g, "#000000");
            }
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Kartoteka_${member.firstName}_${member.lastName}.pdf`);

      toast.success("PDF документът е изтеглен успешно!", { id: toastId });
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Грешка при генериране на PDF", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const fullName = `${member.firstName} ${member.lastName}`;

  return (
    <div className="max-w-[210mm] mx-auto p-0 bg-white min-h-screen font-serif overflow-hidden">
      {/* Non-printable header */}
      <div className="flex justify-between items-center p-8 print:hidden bg-slate-50 border-b">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-950 uppercase tracking-widest">
            {fullName}
          </p>
          <p className="text-[10px] text-slate-500 italic">
            Официален картон на състезателя
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="rounded-xl border-slate-200 hover:bg-white hover:border-zinc-950"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF Сваляне
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg"
          >
            <Printer className="mr-2 h-4 w-4" /> Принтирай
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print-area px-[10mm] py-[10mm] bg-white">
        <AthleteCard member={member} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Fix html2canvas parsing issues with modern CSS colors (oklch, lab) */
        .print-area {
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --slate-500: #64748b;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --slate-950: #020617;
            
            --zinc-950: #09090b;

            /* Map Tailwind V4 variables to Hex */
            --color-slate-50: var(--slate-50);
            --color-slate-100: var(--slate-100);
            --color-slate-200: var(--slate-200);
            --color-slate-300: var(--slate-300);
            --color-slate-400: var(--slate-400);
            --color-slate-500: var(--slate-500);
            --color-slate-600: var(--slate-600);
            --color-slate-700: var(--slate-700);
            --color-slate-800: var(--slate-800);
            --color-slate-900: var(--slate-900);
            --color-slate-950: var(--slate-950);
            --color-zinc-950: var(--zinc-950);
        }
        
        /* Direct class overrides for absolute safety */
        .print-area .text-slate-400 { color: #94a3b8 !important; }
        .print-area .text-slate-500 { color: #64748b !important; }
        .print-area .border-slate-300 { border-color: #cbd5e1 !important; }
        .print-area .border-slate-400 { border-color: #94a3b8 !important; }
        .print-area .border-slate-600 { border-color: #475569 !important; }
        .print-area .bg-slate-50 { background-color: #f8fafc !important; }
        .print-area .bg-zinc-950 { background-color: #09090b !important; }

        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .athlete-card-container {
            height: 135mm;
            page-break-inside: avoid;
            background: white !important;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default AthleteCardPage;
