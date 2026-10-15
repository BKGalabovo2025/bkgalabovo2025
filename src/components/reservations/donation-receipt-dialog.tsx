/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { BadgeCheck, Loader2, Mail, Printer, Scissors } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { clubInfo } from "@/config/club";
import { useAuth } from "@/context/auth-context";
import {
  getPackageReservationsAction,
  sendDonationReceiptEmailAction,
} from "@/lib/actions/reservations";
import { formatPrice } from "@/lib/currency";
import { Reservation } from "@/types/reservation";

function getClientDisplayName(reservation: Reservation) {
  if (reservation.client2Name || reservation.client2Zone) {
    const client2 = reservation.client2Name || "Клиент 2";
    return `${reservation.clientName} и ${client2}`;
  }
  return reservation.clientName || "";
}

interface DonationReceiptDialogProps {
  reservation: Reservation;
  children?: React.ReactNode;
}

interface DocumentCopyProps {
  label: string;
  reservation: Reservation;
}

const DocumentCopy = ({
  label,
  reservation,
  reservations,
  totalPrice,
}: DocumentCopyProps & { reservations: Reservation[]; totalPrice: number }) => {
  const isRecovery = reservation.siteId === "recoveryzone";

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
              № {reservation.id.substring(0, 8).toUpperCase()} /{" "}
              {new Date().toLocaleDateString("bg-BG")}
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

        {/* Unified Legal Statement */}
        <div className="mb-3 text-justify text-[10px] leading-relaxed text-zinc-700">
          С настоящия документ се потвърждава постъпило целево дарение от{" "}
          <span className="font-bold text-zinc-900 uppercase">
            {getClientDisplayName(reservation)}
          </span>{" "}
          (тел.{" "}
          {reservation.client2Phone
            ? `${reservation.clientPhone} / ${reservation.client2Phone}`
            : reservation.clientPhone || "непосочен"}
          ) в полза на СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“. Дарените средства ще бъдат
          използвани изцяло за поддържане на материално-техническата база (МТО)
          на клуба и неговите уставни цели
          {isRecovery
            ? ", включително развитие на възстановителния център Recovery zone by ZM"
            : ", включително развитие на детско-юношеската школа по бадминтон"}
          .
        </div>

        {/* Content Table */}
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
                  Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“
                  {isRecovery
                    ? " от възстановителни процедури (от Recovery zone by ZM)"
                    : " за ползване на бадминтон корт"}
                </td>
                <td className="border-r border-zinc-200 p-1.5 text-center font-bold text-zinc-800">
                  {isRecovery
                    ? reservation.serviceName || "Услуга"
                    : reservations
                        .map((r) => r.courtId || "-")
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ")}
                </td>
                <td className="border-r border-zinc-200 p-1.5 text-center text-zinc-800">
                  {reservations.map((r, idx) => {
                    const st = r.startTime.toDate();
                    const et = r.endTime.toDate();
                    return (
                      <div key={idx}>
                        {format(st, "dd.MM.yyyy", { locale: bg })}{" "}
                        {format(st, "HH:mm")} - {format(et, "HH:mm")}
                      </div>
                    );
                  })}
                </td>
                <td className="p-1.5 text-right font-bold text-zinc-800">
                  {formatPrice(totalPrice)}
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
                  {formatPrice(totalPrice)}
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
              Дарител: {getClientDisplayName(reservation)}
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

export function DonationReceiptDialog({
  reservation,
  children,
}: DonationReceiptDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [packageReservations, setPackageReservations] = useState<Reservation[]>(
    [reservation]
  );
  const receiptRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && reservation.packageGroupId) {
      user?.getIdToken().then((token) => {
        getPackageReservationsAction(token, reservation.packageGroupId!).then(
          (res) => {
            if (res.success && res.data.length > 0) {
              // Need to convert string dates back to Timestamps for display compatibility if needed,
              // but the action returns JSON parsed which means string dates.
              // Let's map them to have .toDate() method.
              const mapped = res.data.map((r: any) => ({
                ...r,
                startTime: { toDate: () => new Date(r.startTime) },
                endTime: { toDate: () => new Date(r.endTime) },
              }));
              setPackageReservations(mapped);
            }
          }
        );
      });
    } else {
      setPackageReservations([reservation]);
    }
  }, [isOpen, reservation, user]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!user) return;
    setIsSendingEmail(true);
    try {
      const idToken = await user.getIdToken();
      const result = await sendDonationReceiptEmailAction(
        idToken,
        reservation.id
      );
      if (result.success) {
        toast.success("Документът е изпратен успешно.");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Възникна грешка при изпращането.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const totalPrice = reservation.packageGroupId
    ? (packageReservations[0]?.totalPrice ?? packageReservations[0]?.price ?? 0)
    : packageReservations.reduce(
        (sum, r) => sum + (r.totalPrice ?? r.price ?? 0),
        0
      );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-4xl lg:max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="no-print shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <BadgeCheck className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                Документ за Дарение
              </DialogTitle>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                А4 формат (2 екземпляра за печат)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl border-zinc-200 px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Printer className="mr-1.5 size-3.5" />
              Принтирай
            </Button>
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={isSendingEmail || !reservation.clientEmail}
              className="h-9 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
            >
              {isSendingEmail ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Mail className="mr-1.5 size-3.5" />
              )}
              {isSendingEmail ? "Изпращане..." : "Имейл"}
            </Button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-auto overscroll-contain bg-zinc-100/70 p-4 sm:p-6 min-h-0 dark:bg-zinc-900/40">
          <div
            ref={receiptRef}
            className="printable-area mx-auto flex min-h-[1123px] w-[794px] min-w-[794px] shrink-0 flex-col gap-6 bg-white p-[10mm] font-sans text-zinc-950 shadow-2xl"
          >
            <DocumentCopy
              label="Екземпляр за ДАРИТЕЛЯ"
              reservation={reservation}
              reservations={packageReservations}
              totalPrice={totalPrice}
            />

            <div className="no-print-visible relative flex items-center justify-center py-2">
              <div className="absolute inset-x-0 border-t-2 border-dashed border-zinc-300" />
              <div className="relative bg-white px-4 text-zinc-300">
                <Scissors className="size-5" />
              </div>
            </div>

            <DocumentCopy
              label="Екземпляр за клуба"
              reservation={reservation}
              reservations={packageReservations}
              totalPrice={totalPrice}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
