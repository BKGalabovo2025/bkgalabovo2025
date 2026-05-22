"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { updateSubscriptionAction } from "@/lib/actions/subscriptions";
import { findOrCreateSaleForSubscriptionAction } from "@/lib/actions/sales";
import { Subscription } from "@/types";
import {
  Loader2,
  CalendarIcon,
  CreditCard,
  Banknote,
  Check,
  ArrowRight,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { formatPrice } from "@/lib/currency";

interface RegisterPaymentDialogProps {
  sub: Subscription & { serviceName?: string };
  onPaymentSuccess: () => void;
  idToken: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const RegisterPaymentDialog = ({
  sub,
  onPaymentSuccess,
  idToken,
  open,
  onOpenChange,
  trigger,
}: RegisterPaymentDialogProps) => {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  const amountDue = sub.price - sub.pricePaid;

  const [payAmount, setPayAmount] = useState<number>(amountDue);
  const [paymentMethod, setPaymentMethod] = useState<string>("В брой");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [note, setNote] = useState<string>("");
  const [generateReceipt, setGenerateReceipt] = useState<boolean>(true);
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPayAmount(amountDue);
      setPaymentMethod("В брой");
      setPaymentDate(new Date());
      setNote("");
      setGenerateReceipt(true);
      setStep(1);
      setCreatedSaleId(null);
    }
  }, [isOpen, amountDue]);

  const handleNextStep1 = () => {
    if (payAmount <= 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна сума за плащане.",
      });
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (payAmount <= 0) return;
    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Грешка", { description: "Липсва токен за оторизация." });
        return;
      }

      const newPayment = {
        date: paymentDate.toISOString(),
        amount: payAmount,
        paymentId: crypto.randomUUID(),
        paymentMethod: paymentMethod,
        note: note,
      };

      const updatedPaymentHistory = [...(sub.paymentHistory || []), newPayment];
      const newPricePaid = sub.pricePaid + payAmount;
      const newStatus =
        newPricePaid >= sub.price ? "active" : "pending_payment";

      // 1. Update subscription
      const updateRes = await updateSubscriptionAction(idToken, sub.id, {
        status: newStatus,
        pricePaid: newPricePaid,
        paymentHistory: updatedPaymentHistory,
        paymentsMadeCount: (sub.paymentsMadeCount || 0) + 1,
      });

      if (!updateRes.success) {
        toast.error("Грешка", {
          description: updateRes.message || "Грешка при запис на абонамента.",
        });
        setIsLoading(false);
        return;
      }

      // 2. Create Sale / Receipt
      const updatedSub = {
        ...sub,
        status: newStatus,
        pricePaid: newPricePaid,
        paymentHistory: updatedPaymentHistory,
        paymentsMadeCount: (sub.paymentsMadeCount || 0) + 1,
      };

      // 2. Create/Update Sale / Receipt (Always update the sale to completed/paid in db)
      const saleRes = await findOrCreateSaleForSubscriptionAction(
        idToken,
        updatedSub
      );
      const data = saleRes.data as { id: string } | undefined;
      if (saleRes.success && data?.id && generateReceipt) {
        setCreatedSaleId(data.id);
      }

      toast.success("Успех!", {
        description: "Плащането е регистрирано успешно.",
      });
      onPaymentSuccess();
      setStep(3);
    } catch {
      toast.error("Грешка", {
        description: "Възникна проблем при регистриране на плащането.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { id: "В брой", label: "В брой", icon: <Banknote className="h-4 w-4" /> },
    {
      id: "Revolut",
      label: "Revolut",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] rounded-4xl border-zinc-100 shadow-none p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-light tracking-tight text-zinc-950">
            Регистриране на плащане
          </DialogTitle>
          <DialogDescription className="text-xs font-light text-zinc-400">
            {sub.serviceName || "Абонамент"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 mb-8 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100/80">
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${
              step === 1
                ? "text-zinc-950"
                : step > 1
                  ? "text-emerald-600 font-normal"
                  : "text-zinc-300"
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                step === 1
                  ? "bg-zinc-950 text-white"
                  : step > 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {step > 1 ? <Check className="h-3 w-3" /> : 1}
            </span>
            Детайли
          </div>
          <div className="flex-1 h-px bg-zinc-200 mx-3" />
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${
              step === 2
                ? "text-zinc-950"
                : step > 2
                  ? "text-emerald-600 font-normal"
                  : "text-zinc-300"
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                step === 2
                  ? "bg-zinc-950 text-white"
                  : step > 2
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {step > 2 ? <Check className="h-3 w-3" /> : 2}
            </span>
            Потвърждение
          </div>
          <div className="flex-1 h-px bg-zinc-200 mx-3" />
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${
              step === 3 ? "text-emerald-600 font-medium" : "text-zinc-300"
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                step === 3
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-200 text-zinc-500"
              }`}
            >
              3
            </span>
            Успех
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium tracking-widest uppercase text-zinc-400">
                <span>Сума за плащане (EUR)</span>
                <span className="text-zinc-600 font-semibold">
                  Дължимо: {formatPrice(amountDue)}
                </span>
              </div>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(parseFloat(e.target.value) || 0)
                  }
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-lg font-medium pl-4 pr-24 shadow-sm text-zinc-900"
                />
                <div className="absolute right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px] px-2.5 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    onClick={() => setPayAmount(amountDue)}
                  >
                    Пълна
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px] px-2.5 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    onClick={() =>
                      setPayAmount(parseFloat((amountDue / 2).toFixed(2)))
                    }
                  >
                    50%
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Метод на плащане
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      paymentMethod === m.id
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-md font-medium"
                        : "border-zinc-200/80 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 font-light"
                    }`}
                  >
                    <div
                      className={
                        paymentMethod === m.id ? "text-white" : "text-zinc-500"
                      }
                    >
                      {m.icon}
                    </div>
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Дата на плащане
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-left font-light text-xs sm:text-sm rounded-2xl border-zinc-200 bg-zinc-50/50 text-zinc-900"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                    {format(paymentDate, "PPP", { locale: bg })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl border-zinc-100 shadow-lg"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(d) => d && setPaymentDate(d)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Бележка / Основание (по избор)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Напр. платено на каса, № превод..."
                className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm font-light text-zinc-900"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="h-11 rounded-xl border-zinc-200 font-medium text-[11px] uppercase tracking-widest2"
              >
                Отказ
              </Button>
              <Button
                onClick={handleNextStep1}
                className="h-11 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest2 shadow-none flex items-center gap-2"
              >
                Напред
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100/80 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  Абонамент
                </span>
                <span className="text-sm font-medium text-zinc-900">
                  {sub.serviceName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">
                  Сума за плащане
                </span>
                <span className="text-lg font-semibold text-zinc-950">
                  {formatPrice(payAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">
                  Метод на плащане
                </span>
                <span className="text-xs font-medium px-2.5 py-1 bg-white rounded-lg border border-zinc-200/80 text-zinc-800">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">Дата</span>
                <span className="text-xs text-zinc-800 font-light">
                  {format(paymentDate, "dd.MM.yyyy")}
                </span>
              </div>
              {note && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-zinc-500 font-light">
                    Бележка
                  </span>
                  <span className="text-xs text-zinc-600 italic font-light">
                    {note}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200/60">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  Оставащ дълг
                </span>
                <span className="text-xs font-semibold text-zinc-600">
                  {formatPrice(
                    Math.max(0, sub.price - (sub.pricePaid + payAmount))
                  )}
                </span>
              </div>
            </div>

            {/* Receipt Checkbox */}
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 cursor-pointer hover:bg-zinc-100/50 transition-colors">
              <input
                type="checkbox"
                checked={generateReceipt}
                onChange={(e) => setGenerateReceipt(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-4 w-4"
              />
              <span className="text-xs sm:text-sm font-light text-zinc-700">
                Генерирай електронна квитанция след плащането
              </span>
            </label>

            {/* Footer */}
            <div className="flex justify-between gap-3 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 px-5 rounded-xl border-zinc-200 font-medium text-[11px] uppercase tracking-widest2 flex items-center gap-2 text-zinc-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Назад
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="h-11 px-8 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-medium text-[11px] uppercase tracking-widest2 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Потвърди и плати
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-light tracking-tight text-zinc-950">
                Плащането е прието!
              </h3>
              <p className="text-sm font-light text-zinc-500 max-w-sm mx-auto">
                Сумата от{" "}
                <span className="font-semibold text-zinc-900">
                  {formatPrice(payAmount)}
                </span>{" "}
                е успешно регистрирана към досието.
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
              {generateReceipt && createdSaleId && (
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/sales/${createdSaleId}/receipt`);
                  }}
                  className="h-12 px-6 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-xs sm:text-sm shadow-md flex items-center gap-2 justify-center"
                >
                  <Receipt className="h-4 w-4" />
                  Отвори квитанция
                </Button>
              )}
              <Button
                variant={
                  generateReceipt && createdSaleId ? "outline" : "default"
                }
                onClick={() => setIsOpen(false)}
                className={`h-12 px-6 rounded-2xl font-medium text-xs sm:text-sm justify-center ${
                  !(generateReceipt && createdSaleId)
                    ? "bg-zinc-950 text-white hover:bg-zinc-800 shadow-md"
                    : "border-zinc-200 text-zinc-700"
                }`}
              >
                Затвори
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
