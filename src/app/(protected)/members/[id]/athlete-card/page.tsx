"use client";

import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { getValidAvatarUrl } from "@/lib/utils";
import { Member } from "@/types/member.types";

const AthleteCard = ({ member }: { member: Member }) => {
  return (
    <div className="athlete-card-container flex flex-col justify-between border border-slate-400 bg-white p-3 font-serif text-slate-900 leading-snug">
      <div className="w-full">
        {/* Top Section: Photo and Centered Title */}
        <div className="mb-2 flex items-start justify-between gap-3">
          {/* Снимка 3x4 */}
          <div className="flex h-28 w-22 shrink-0 items-center justify-center overflow-hidden border border-slate-700 bg-slate-50">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getValidAvatarUrl(member.avatarUrl)}
                alt={`${member.firstName} ${member.lastName}`}
                className="object-cover size-full"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="text-center text-[10pt] text-slate-400 italic">
                Снимка
              </div>
            )}
          </div>

          {/* Centered Federative Title */}
          <div className="flex-1 pr-4 pt-1 text-center">
            <h1 className="text-base font-bold tracking-tight uppercase text-slate-950 sm:text-lg">
              Българска Федерация Бадминтон
            </h1>
            <h2 className="mt-0.5 text-xs font-bold tracking-widest uppercase text-slate-900 sm:text-sm">
              Картон на състезателя
            </h2>
          </div>
        </div>

        {/* Info Grid: Club on Left, Athlete on Right */}
        <div className="mb-2 grid grid-cols-12 gap-x-4 text-[9pt]">
          {/* Club Column */}
          <div className="col-span-5 space-y-1.5">
            <div>
              <p className="border-b border-dotted border-slate-800 pb-0.5 font-bold text-[9.5pt] leading-normal min-h-[1.4em]">
                „Бадминтон клуб Гълъбово”
              </p>
              <p className="text-[7pt] text-slate-600 italic">/клуб/</p>
            </div>
            <div>
              <p className="border-b border-dotted border-slate-800 pb-0.5 text-[9pt] leading-normal min-h-[1.4em]">
                гр. Гълъбово
              </p>
              <p className="text-[7pt] text-slate-600 italic">/град/</p>
            </div>
            <div className="pt-0.5">
              <div className="flex items-end justify-between border-b border-dotted border-slate-800 pb-0.5 min-h-[1.4em]">
                <span className="text-[8.5pt]">Председател:</span>
                <span className="font-semibold text-[8.5pt]">
                  Мира Георгиева
                </span>
              </div>
              <p className="text-[7pt] text-slate-600 italic">
                /Подпис, печат/
              </p>
            </div>
          </div>

          {/* Athlete Column */}
          <div className="col-span-7 space-y-1.5 border-l border-slate-200 pl-3">
            <div className="flex items-end gap-1.5 min-h-[1.6em]">
              <span className="text-[8.5pt] whitespace-nowrap font-normal">
                Име:
              </span>
              <span className="flex-1 border-b border-dotted border-slate-800 px-1 font-bold text-[9.5pt] leading-normal min-h-[1.4em] overflow-visible">
                {member.firstName}
              </span>
              <span className="text-[8.5pt] whitespace-nowrap font-normal">
                бащино:
              </span>
              <span className="flex-1 border-b border-dotted border-slate-800 px-1 font-bold text-[9.5pt] leading-normal min-h-[1.4em] overflow-visible">
                {member.middleName || "\u00A0"}
              </span>
            </div>

            <div className="flex items-end gap-1.5 min-h-[1.6em]">
              <span className="text-[8.5pt] whitespace-nowrap font-normal">
                фамилия:
              </span>
              <span className="flex-1 border-b border-dotted border-slate-800 px-1 font-bold text-[9.5pt] leading-normal min-h-[1.4em] overflow-visible">
                {member.lastName}
              </span>
              <span className="text-[8.5pt] whitespace-nowrap font-normal">
                ЕГН:
              </span>
              <span className="min-w-28 border-b border-dotted border-slate-800 px-1 text-center font-bold tracking-wider text-[9.5pt] leading-normal min-h-[1.4em] overflow-visible">
                {member.egn || "\u00A0"}
              </span>
            </div>

            <div>
              <div className="flex items-end gap-1.5 min-h-[1.6em]">
                <span className="text-[8.5pt] whitespace-nowrap font-normal">
                  Адрес:
                </span>
                <span className="flex-1 border-b border-dotted border-slate-800 px-1 text-[8.5pt] font-medium leading-normal min-h-[1.4em] overflow-visible">
                  {member.address || "\u00A0"}
                </span>
              </div>
              <p className="pl-12 text-[7pt] text-slate-600 italic">
                /Град, ул. № вх. ап./
              </p>
            </div>
          </div>
        </div>

        {/* Table Section: 6 Columns x 2 Rows */}
        <div className="w-full mt-2">
          <table className="w-full border-collapse border border-slate-900 text-[7pt] leading-snug">
            <thead>
              <tr className="divide-x divide-slate-900 border-b border-slate-900">
                {[...Array(6)].map((_, i) => (
                  <th
                    key={i}
                    className="w-1/6 space-y-0.5 bg-slate-50/50 p-1 text-left font-normal"
                  >
                    <p className="font-bold text-[7.5pt]">Мед. преглед</p>
                    <p>Дата: ________</p>
                    <p>Периодичен</p>
                    <div className="flex items-end justify-between pt-1">
                      <span>Подпис: ____</span>
                      <span className="text-[6pt] italic">печат</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-900">
                {[...Array(6)].map((_, i) => (
                  <td key={i} className="h-16 w-1/6 space-y-0.5 p-1 align-top">
                    <p className="font-bold text-[7.5pt]">Заверка за</p>
                    <p className="font-bold text-[7.5pt]">Правоучастие</p>
                    <p>Дата: ________</p>
                    <p>Въз. група: ____</p>
                    <div className="flex items-end justify-between pt-1">
                      <span>Председател: ____</span>
                      <span className="text-[6pt] italic">печат</span>
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
      <div className="animate-pulse p-8 text-center text-slate-400">
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
      await generatePdfFromElement(
        printRef.current,
        `Kartoteka_${member.firstName}_${member.lastName}.pdf`,
        "portrait"
      );
      toast.success("PDF документът е изтеглен успешно!", { id: toastId });
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Грешка при генериране на PDF", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const fullName = `${member.firstName} ${member.lastName}`;

  const handleBack = () => {
    const hasHistory =
      typeof window !== "undefined" &&
      ((window.history.state && window.history.state.idx > 0) ||
        (window.history.length > 1 &&
          document.referrer &&
          document.referrer.includes(window.location.host)));

    if (hasHistory) {
      router.back();
    } else {
      router.push(`/members/${memberId}?tab=documents`);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[210mm] overflow-hidden bg-white p-0 font-serif print:overflow-visible">
      {/* Non-printable header */}
      <div className="flex items-center justify-between border-b bg-slate-50 p-8 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <div className="text-center">
          <p className="text-sm font-bold tracking-widest text-slate-950 uppercase">
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
            className="rounded-xl border-slate-200 hover:border-zinc-950 hover:bg-white"
          >
            {isExporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            PDF Сваляне
          </Button>
          <Button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          >
            <Printer className="mr-2 size-4" /> Принтирай
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print-area bg-white p-[8mm]">
        <AthleteCard member={member} />

        <div className="my-2.5 flex items-center justify-center gap-2 text-slate-400 text-[8pt] print:my-2">
          <span>✂</span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span className="uppercase tracking-widest text-[7pt]">
            Линия за изрязване (2 карти на лист А4)
          </span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span>✂</span>
        </div>

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
            min-height: 297mm;
            padding: 8mm;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .athlete-card-container {
            height: 128mm;
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
