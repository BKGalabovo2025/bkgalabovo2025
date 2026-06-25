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
    <div className="flex flex-col flex-1 border border-black p-10 bg-white relative">
      <div className="flex flex-col h-full text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-4 mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              ДОКУМЕНТ ЗА ДАРЕНИЕ
            </h2>
            <p className="text-[10px] font-bold">
              № {reservation.id.substring(0, 8).toUpperCase()} /{" "}
              {new Date().toLocaleDateString("bg-BG")}
            </p>
            <p className="text-[10px] font-bold uppercase mt-1 text-zinc-500">
              {label}
            </p>
          </div>
          <div className="text-right text-[10px] space-y-0.5">
            <p className="font-bold uppercase">{clubInfo.name}</p>
            <p className="uppercase">{clubInfo.address}</p>
            <p className="uppercase">{clubInfo.contact}</p>
          </div>
        </div>

        {/* Unified Legal Statement */}
        <div className="mb-8">
          <p className="text-[11px] leading-relaxed text-justify">
            С настоящия документ се потвърждава постъпило целево дарение от{" "}
            <span className="font-bold uppercase">
              {reservation.client2Name || reservation.client2Zone
                ? `${reservation.clientName} и ${reservation.client2Name || "Клиент 2"}`
                : reservation.clientName}
            </span>{" "}
            (тел.{" "}
            {reservation.client2Phone
              ? `${reservation.clientPhone} / ${reservation.client2Phone}`
              : reservation.clientPhone || "непосочен"}
            ) в полза на СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“. Дарените средства ще
            бъдат използвани изцяло за поддържане на материално-техническата
            база (МТО) на клуба и неговите уставни цели
            {isRecovery
              ? ", включително развитие на възстановителния център"
              : ", включително развитие на детско-юношеската школа по бадминтон"}
            .
          </p>
        </div>

        {/* Content Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-zinc-100 border-b border-black text-[9px] font-bold uppercase">
                <th className="p-2 text-left border-r border-black">
                  Описание на дарението
                </th>
                <th className="p-2 text-center border-r border-black">
                  {isRecovery ? "Услуга" : "Корт"}
                </th>
                <th className="p-2 text-center border-r border-black">
                  Дата / Час
                </th>
                <th className="p-2 text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              <tr className="border-b border-black">
                <td className="p-3 border-r border-black">
                  Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“
                  {isRecovery
                    ? " от възстановителни процедури"
                    : " за ползване на бадминтон корт"}
                </td>
                <td className="p-3 text-center border-r border-black font-bold">
                  {isRecovery
                    ? reservation.serviceName || "Услуга"
                    : reservations
                        .map((r) => r.courtId || "-")
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ")}
                </td>
                <td className="p-3 text-center border-r border-black">
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
                <td className="p-3 text-right font-bold">
                  {formatPrice(totalPrice)}
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
                  {formatPrice(totalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-12 flex justify-between gap-20">
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              За Клуба: {clubInfo.name}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-px bg-black w-full" />
            <p className="text-[8px] font-bold mt-1 uppercase text-center">
              Дарител:{" "}
              {reservation.client2Name || reservation.client2Zone
                ? `${reservation.clientName} и ${reservation.client2Name || "Клиент 2"}`
                : reservation.clientName}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest">
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 rounded-4xl border-none shadow-2xl bg-zinc-100 dark:bg-zinc-950">
        <DialogHeader className="p-8 pb-4 no-print bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <BadgeCheck className="text-white w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase">
                  Документ за Дарение
                </DialogTitle>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  А4 формат (2 екземпляра)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrint}
                className="rounded-2xl border-zinc-200 hover:bg-zinc-50 h-12 px-6 font-bold uppercase tracking-widest text-[10px]"
              >
                <Printer className="mr-2 h-4 w-4" />
                Принтирай
              </Button>
              <Button
                size="lg"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !reservation.clientEmail}
                className="bg-primary text-white hover:bg-primary/90 rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {isSendingEmail ? "Изпращане..." : "Изпрати по Имейл"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-8 overflow-x-auto bg-zinc-50 dark:bg-zinc-950/50">
          <div
            ref={receiptRef}
            className="mx-auto bg-white text-zinc-950 shadow-2xl w-[794px] min-w-[794px] shrink-0 min-h-[1123px] p-[10mm] flex flex-col gap-6 printable-area font-sans"
          >
            <DocumentCopy
              label="Екземпляр за клиента"
              reservation={reservation}
              reservations={packageReservations}
              totalPrice={totalPrice}
            />

            <div className="relative py-2 no-print-visible flex items-center justify-center">
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-zinc-300" />
              <div className="relative bg-white px-4 text-zinc-300">
                <Scissors className="w-5 h-5" />
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
