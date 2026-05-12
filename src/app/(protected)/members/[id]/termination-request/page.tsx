"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { formatFullName } from "@/lib/utils";

const TerminationRequestPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const today = new Date().toLocaleDateString("bg-BG");

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 bg-white min-h-screen">
      {/* Non-printable header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg"
        >
          <Printer className="mr-2 h-4 w-4" /> Принтирай
        </Button>
      </div>

      {/* Printable Area */}
      <div className="print-area text-slate-900 text-justify leading-snug font-serif">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-tight mb-1">
            М О Л Б А
          </h1>
          <p className="text-base italic">
            за прекратяване на членство в СНЦ „Бадминтон клуб Гълъбово” град
            Гълъбово
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-1/2 space-y-0.5 text-sm">
            <p className="font-bold">ДО</p>
            <p className="font-bold">Председателя на</p>
            <p className="font-bold">СНЦ „Бадминтон клуб Гълъбово”</p>
            <p className="font-bold text-sm">град ГЪЛЪБОВО</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-bold shrink-0">ОТ:</span>
              <span className="border-b border-dotted border-slate-400 flex-1 min-h-[1.2rem]"></span>
            </p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на родителя/настойника, адрес, телефон, e-mail)
            </p>
          </div>

          <div>
            <p className="border-b border-dotted border-slate-400 min-h-[1.2rem] w-full"></p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на втория родител/настойник, адрес, телефон, e-mail –
              ако е приложимо)
            </p>
          </div>

          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-bold shrink-0">ЗА:</span>
              <span className="border-b border-dotted border-slate-400 flex-1 min-h-[1.2rem]">
                <strong>{fullName}</strong>
              </span>
            </p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на детето/члена, ЕГН, адрес)
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <p className="font-bold">Уважаема госпожо Председател,</p>

          <p>Моля, да прекратите членството на</p>

          <div className="text-center">
            <p className="border-b border-dotted border-slate-400 min-h-[1.2rem] font-bold text-base inline-block px-8">
              {fullName}
            </p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (име на детето/члена)
            </p>
          </div>

          <p>
            в СНЦ „Бадминтон клуб Гълъбово”, считано от
            ......................................................................
            20............ г.
          </p>

          <div className="space-y-4 my-6">
            <p className="font-bold">Декларирам, че (отбележете с ✔):</p>
            <div className="space-y-3 ml-4 text-xs">
              <p className="flex gap-3">
                <span className="shrink-0">☐</span>
                <span>
                  Всички финансови задължения към клуба са уредени към датата на
                  подаване на настоящата молба;
                </span>
              </p>

              <div className="space-y-2">
                <p className="font-bold underline">
                  Предоставена е клубната екипировка:
                </p>
                <p className="flex gap-3">
                  <span className="shrink-0">☐</span>
                  <span>
                    Екип (горнище + долнище), размер
                    ............................................
                  </span>
                </p>
                <div className="flex gap-4 items-center">
                  <span className="shrink-0">☐ Тениски:</span>
                  <p className="flex gap-2 items-center">
                    <span>☐ бяла клубна,</span> <span>☐ синя клубна,</span>{" "}
                    <span>☐ друга клубна тениска</span>
                  </p>
                </div>
                <p className="flex gap-3">
                  <span className="shrink-0">☐</span>
                  <span>
                    Клубната екипировка, предоставена от клуба е върната в добро
                    състояние.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-end text-sm">
          <div className="space-y-0.5">
            <p>Спортна зала „Енергетик“ град Гълъбово</p>
            <p>Дата: {today} г.</p>
          </div>
          <div className="text-right">
            <p className="mb-6 italic">С уважение:</p>
            <div className="flex gap-6">
              <div className="text-center">
                <p>........................................</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  1. (подпис на родител/настойник)
                </p>
              </div>
              <div className="text-center">
                <p>........................................</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  2. (подпис на родител/настойник)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-sm">
          <p>Подпис на член (ако е пълнолетен): ……………………………………….</p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 15mm 20mm;
            font-size: 11pt;
            line-height: 1.4;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default TerminationRequestPage;
