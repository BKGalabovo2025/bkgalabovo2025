"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Product, Member } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { createSaleAction } from "@/lib/actions/sales";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { clubInfo } from "@/config/club";
import {
  ShoppingBag,
  Search,
  User,
  Check,
  CreditCard,
  Receipt,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";

interface ProductSaleWizardDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

export const ProductSaleWizardDialog = ({
  product,
  isOpen,
  onClose,
  onSaleSuccess,
}: ProductSaleWizardDialogProps) => {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form states
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [isPaid, setIsPaid] = useState(true);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  const { idToken } = useAuth();

  // Load members
  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        setMembersLoading(true);
        try {
          const fetchedMembers = await getAllMembers();
          setMembers(fetchedMembers);
        } catch (err) {
          console.error("Error loading members:", err);
          toast.error("Грешка", {
            description: "Неуспешно зареждане на клубните членове.",
          });
        } finally {
          setMembersLoading(false);
        }
      };
      fetchMembers();
    }
  }, [isOpen]);

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleNextStep = () => {
    if (step === 1 && !selectedMember) {
      toast.error("Избор на купувач", {
        description: "Моля, изберете член от списъка, за да продължите.",
      });
      return;
    }

    if (step === 2) {
      const qtyVal = parseInt(quantity, 10);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        toast.error("Невалидно количество", {
          description: "Моля, въведете валидно положително количество.",
        });
        return;
      }
      if (qtyVal > product.stock) {
        toast.error("Недостатъчна наличност", {
          description: `Имате само ${product.stock} бр. от този артикул на склад.`,
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleExecuteSale = async () => {
    if (!selectedMember || !idToken) return;
    setIsProcessing(true);
    setStep(4);

    const qty = parseInt(quantity, 10);
    const totalAmount = product.price * qty;

    try {
      const saleData = {
        siteId: product.siteId || "default",
        memberId: selectedMember.id,
        saleDate: new Date().toISOString(),
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity: qty,
            price: product.price,
          },
        ],
        status: "completed",
        isPaid: isPaid,
        totalAmount: totalAmount,
        currency: "EUR",
        paymentMethod: paymentMethod,
        note: note || "",
      };

      const result = await createSaleAction(idToken, saleData);

      if (result.success && result.data) {
        const saleId = (result.data as { id: string }).id;
        setCompletedSaleId(saleId);
        setStep(5);
        if (selectedMember.id !== "GUEST_EXTERNAL") {
          mutate(selectedMember.id);
        }
        toast.success("Готово!", {
          description: "Продажбата бе регистрирана успешно.",
        });
      } else {
        setStep(3);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      setStep(3);
      toast.error("Грешка при продажба", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (completedSaleId) {
      onSaleSuccess();
    } else {
      onClose();
    }
  };

  const qty = parseInt(quantity, 10) || 1;
  const totalAmount = product.price * qty;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-955 dark:text-zinc-50 flex items-center gap-3">
            <ShoppingBag
              className="h-6 w-6 text-emerald-500"
              strokeWidth={1.5}
            />
            Бърза Продажба: {product.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            {step < 5 ? (
              <span>
                Стъпка {step} от 4: Попълнете детайлите за продажба на артикула.
              </span>
            ) : (
              <span>Продажбата е завършена успешно. Благодарим ви!</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* STEP PROGRESS BAR */}
        {step < 5 && (
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* STEP 1: SELECT BUYER */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <User className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Избор на купувач (Член на клуба)
              </h3>
            </div>

            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Търсене по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 rounded-xl h-11 border-zinc-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>

            {/* ВЪНШЕН КЛИЕНТ БУТОН */}
            <button
              type="button"
              onClick={() =>
                setSelectedMember({
                  id: "GUEST_EXTERNAL",
                  firstName: "Външен",
                  lastName: "клиент",
                  email: "guest@external",
                } as any)
              }
              className={`w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors text-sm font-light rounded-2xl border ${
                selectedMember?.id === "GUEST_EXTERNAL"
                  ? "bg-amber-500/10 text-amber-900 border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/35"
                  : "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/15 text-amber-500 rounded-xl">
                  <User className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Продажба на Външен клиент
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-light mt-0.5">
                    Бърза продажба без асоцииране с член на клуба
                  </span>
                </div>
              </div>
              {selectedMember?.id === "GUEST_EXTERNAL" && (
                <Check className="h-4 w-4 text-amber-500" />
              )}
            </button>

            {membersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-30" />
                <p className="text-zinc-400 text-xs font-light">
                  Зареждане на членове...
                </p>
              </div>
            ) : (
              <div className="border border-zinc-100 dark:border-zinc-900 rounded-2xl max-h-[220px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900 custom-scrollbar">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelected = selectedMember?.id === member.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`w-full text-left px-5 py-3.5 flex justify-between items-center transition-colors text-sm font-light ${
                          isSelected
                            ? "bg-emerald-50/55 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-350"
                            : "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-light mt-0.5">
                            {member.email || "Няма имейл"}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-emerald-500" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs font-light">
                    Няма намерени членове по този критерий.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <CreditCard
                className="h-4 w-4 text-emerald-500"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Детайли на транзакцията
              </h3>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="sale-qty"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Количество *
                  </Label>
                  <span className="text-[10px] text-zinc-400">
                    Складова наличност: <strong>{product.stock} бр.</strong>
                  </span>
                </div>
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl h-11 border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="pay-method"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Начин на плащане *
                  </Label>
                  <select
                    id="pay-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="В брой">В брой</option>
                    <option value="Карта">Карта</option>
                    <option value="Банков път">Банков път</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="pay-status"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Статус на плащане *
                  </Label>
                  <select
                    id="pay-status"
                    value={isPaid ? "paid" : "unpaid"}
                    onChange={(e) => setIsPaid(e.target.value === "paid")}
                    className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="paid">Платено</option>
                    <option value="unpaid">Неплатено (Дълг)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="sale-note"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Допълнителна бележка (Незадължително)
                </Label>
                <Textarea
                  id="sale-note"
                  placeholder="Добавете бележка или допълнителен коментар..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Sparkles
                className="h-4 w-4 text-emerald-500"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Преглед и потвърждение
              </h3>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl space-y-4 border border-zinc-100/50 dark:border-zinc-900">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-400">Купувач (Член)</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {selectedMember.firstName} {selectedMember.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-400">Артикул</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {product.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-400">Количество</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {quantity} бр.
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-400">Начин на плащане</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-400">Статус</span>
                <span
                  className={`font-bold uppercase tracking-wider text-[10px] ${
                    isPaid ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isPaid ? "Платено" : "Неплатено"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Обща сума
                </span>
                <span className="text-2xl font-bold text-emerald-500 tracking-tight">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING */}
        {step === 4 && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <Loader2
              className="h-12 w-12 animate-spin text-emerald-500"
              strokeWidth={2}
            />
            <div className="text-center space-y-2">
              <p className="font-light text-zinc-900 dark:text-zinc-100 text-lg">
                Регистриране на продажбата...
              </p>
              <p className="text-zinc-400 text-xs font-light">
                Моля, изчакайте, докато транзакцията се записва в базата данни.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: RECEIPT & PRINT */}
        {step === 5 && selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Receipt className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Касова бележка за продажба
              </h3>
            </div>

            {/* RECEIPT MOCKUP DESIGN - FORMAL A4 COPY PREVIEW */}
            <div
              className="flex flex-col border border-zinc-300 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 rounded-2xl relative text-zinc-950 dark:text-zinc-50 w-full max-w-lg mx-auto shadow-sm"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                wordSpacing: "1px",
              }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 text-[10px]">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
                      РАЗПИСКА ЗА ПЛАЩАНЕ
                    </h4>
                    <p className="text-[9px] font-bold uppercase text-zinc-500">
                      №{" "}
                      {completedSaleId
                        ? completedSaleId.substring(0, 8).toUpperCase()
                        : "N/A"}{" "}
                      / {new Date().toLocaleDateString("bg-BG")} г.
                    </p>
                    <p className="text-[8px] font-bold uppercase text-zinc-400">
                      Преглед на екземпляр
                    </p>
                  </div>
                  <div className="text-right text-[9px] space-y-0.5 text-zinc-500">
                    <p className="font-bold uppercase text-zinc-700 dark:text-zinc-300">
                      {clubInfo.name}
                    </p>
                    <p className="uppercase">{clubInfo.address}</p>
                    <p className="uppercase">{clubInfo.contact}</p>
                  </div>
                </div>

                {/* Info Block (Получател, Статус, Начин на плащане) */}
                <div className="mb-3 text-[9px] flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <div>
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                      Получател
                    </p>
                    <p className="font-bold uppercase text-zinc-850 dark:text-zinc-150">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    <p className="text-zinc-500 text-[8px] mt-0.5">
                      {selectedMember.id === "GUEST_EXTERNAL"
                        ? "Няма имейл (Външен клиент)"
                        : selectedMember.email || "Няма имейл"}
                    </p>
                  </div>

                  <div className="text-right text-zinc-650 dark:text-zinc-350">
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                      Детайли за плащане
                    </p>
                    <p className="font-bold">
                      Дата на плащане: {new Date().toLocaleDateString("bg-BG")}{" "}
                      г.
                    </p>
                    <p className="mt-0.5">Начин: {paymentMethod}</p>
                    <p className="mt-0.5 font-bold">
                      Статус:{" "}
                      <span
                        className={
                          isPaid
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-rose-600 dark:text-rose-400 font-bold"
                        }
                      >
                        {isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                      </span>
                    </p>
                    {note && (
                      <p className="text-[8px] text-zinc-500 italic mt-0.5">
                        Бележка: {note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content Table */}
                <div className="mb-3">
                  <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-800 text-[9px]">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[8px] font-bold uppercase text-zinc-500">
                        <th className="p-1.5 text-left border-r border-zinc-200 dark:border-zinc-800">
                          Описание на услугата / продукта
                        </th>
                        <th className="p-1.5 text-center border-r border-zinc-200 dark:border-zinc-800">
                          К-во
                        </th>
                        <th className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800">
                          Ед. цена
                        </th>
                        <th className="p-1.5 text-right">Общо</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 font-medium">
                        <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800 font-bold text-left text-zinc-800 dark:text-zinc-200">
                          {product.name}
                        </td>
                        <td className="p-1.5 text-center border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {quantity}
                        </td>
                        <td className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {formatPrice(product.price)}
                        </td>
                        <td className="p-1.5 text-right font-bold text-zinc-850 dark:text-zinc-150">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={3}
                          className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[8px] text-zinc-400"
                        >
                          Обща стойност:
                        </td>
                        <td className="p-1.5 text-right font-bold text-[10px] text-zinc-900 dark:text-white">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Unified Legal / Accounting Statement */}
                <div className="text-center mb-2">
                  <p className="text-[7px] text-zinc-400 italic">
                    Документът е издаден от автоматизирана система в
                    съответствие с чл. 7, ал. 1 от Закона за счетоводството.
                  </p>
                </div>

                {/* Signatures */}
                <div className="mt-2 flex justify-between gap-12 text-zinc-500">
                  <div className="flex-1">
                    <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                    <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                      Доставчик: {clubInfo.name}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                    <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                      Получател: {selectedMember.firstName}{" "}
                      {selectedMember.lastName}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-[6px] text-zinc-450 font-bold uppercase tracking-widest">
                    ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И
                    ПЕЧАТ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  if (completedSaleId) {
                    window.open(`/sales/${completedSaleId}/receipt`, "_blank");
                  }
                }}
                className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 text-xs font-semibold flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Отвори за печат (PDF)
              </Button>
            </div>
          </div>
        )}

        {/* DIALOG FOOTER & NAVIGATION BUTTONS */}
        {step < 4 && (
          <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-row justify-between items-center sm:justify-between w-full">
            <div>
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 flex items-center gap-2 text-zinc-500 hover:text-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 text-zinc-500 hover:text-zinc-800"
                >
                  Отказ
                </Button>
              )}
            </div>

            <div>
              {step < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={isProcessing}
                  className="rounded-xl px-6 h-11 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                >
                  Напред <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleExecuteSale}
                  disabled={isProcessing || !selectedMember}
                  className="rounded-xl px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                >
                  Завърши продажбата <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        )}

        {step === 5 && (
          <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
            <Button
              onClick={handleClose}
              className="rounded-xl px-8 h-11 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-[11px] uppercase tracking-widest"
            >
              Затвори
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
