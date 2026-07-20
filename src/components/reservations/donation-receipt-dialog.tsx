/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Mail, Loader2, BadgeCheck, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { Reservation } from "@/types/reservation";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  sendDonationReceiptEmailAction,
  getPackageReservationsAction,
} from "@/lib/actions/reservations";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

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
    <div
      className="relative flex flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-6 font-sans tracking-wide text-zinc-950 shadow-sm"
    >
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
          ) в полза на СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“. Дарените средства ще
          бъдат използвани изцяло за поддържане на материално-техническата
          база (МТО) на клуба и неговите уставни цели
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
              Дарител:{" "}
              {getClientDisplayName(reservation)}
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
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto rounded-4xl border-none bg-zinc-100 p-0 shadow-2xl dark:bg-zinc-950">
        <DialogHeader className="no-print border-b border-zinc-100 bg-white p-8 pb-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <BadgeCheck className="size-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase">
                  Документ за Дарение
                </DialogTitle>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  А4 формат (2 екземпляра)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrint}
                className="h-12 rounded-2xl border-zinc-200 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-50"
              >
                <Printer className="mr-2 size-4" />
                Принтирай
              </Button>
              <Button
                size="lg"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !reservation.clientEmail}
                className="h-12 rounded-2xl bg-primary px-8 text-[10px] font-bold tracking-widest text-white uppercase shadow-xl shadow-primary/20 hover:bg-primary/90"
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                {isSendingEmail ? "Изпращане..." : "Изпрати по Имейл"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto bg-zinc-50 p-4 sm:p-8 dark:bg-zinc-950/50">
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
