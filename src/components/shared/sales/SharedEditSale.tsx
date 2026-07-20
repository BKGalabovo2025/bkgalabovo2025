"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";

import { getSaleById } from "@/services/sales-service";
import { updateSaleAction } from "@/lib/actions/sales";
import { getAllMembers } from "@/services/member-service";
import { useProducts } from "@/hooks/useProducts";
import { Member, Sale, Product } from "@/types";
import { formatPrice } from "@/lib/currency";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  PlusCircle,
  XCircle,
  ShoppingCart,
  UserPlus,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

type SaleItem = Sale["items"][0];

export interface SharedEditSaleProps {
  saleId: string;
  cancelUrl: string;
  successUrl: string;
  breadcrumbs: { label: string; href?: string }[];
}

export function SharedEditSale({
  saleId,
  cancelUrl,
  successUrl,
  breadcrumbs,
}: SharedEditSaleProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const { products: allProducts, isLoading: productsLoading } = useProducts();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("none");
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>("completed");
  const [initialSale, setInitialSale] = useState<Sale | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setPageLoading] = useState(true);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!saleId) return;
      try {
        setPageLoading(true);
        const [saleData, membersData] = await Promise.all([
          getSaleById(saleId),
          getAllMembers(),
        ]);

        if (!saleData) {
          toast.error("Продажбата не е намерена.");
          router.push(cancelUrl);
          return;
        }

        setInitialSale(saleData);
        setCart(saleData.items);
        setSelectedMemberId(saleData.memberId || "none");
        setPaymentStatus(saleData.status);
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Неуспешно зареждане на данните.");
      } finally {
        setMembersLoading(false);
        setPageLoading(false);
      }
    };

    fetchInitialData();
  }, [saleId, router]);

  const addToCart = (product: Product) => {
    if (!product) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );
      const stock = product.stock || 0;
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > stock) {
          toast.error(`Само ${stock} бр. са налични.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (stock < 1) {
          toast.error(`Продуктът е изчерпан.`);
          return prevCart;
        }
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const productInCart = allProducts.find((p) => p.id === productId);
    const originalItem = initialSale?.items.find(
      (item) => item.productId === productId
    );
    const originalQuantity = originalItem?.quantity || 0;
    const stock = (productInCart?.stock || 0) + originalQuantity;

    if (quantity <= 0) {
      removeFromCart(productId);
    } else if (quantity > stock) {
      toast.error(`Максималното налично количество е ${stock}.`);
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleUpdateSale = async () => {
    if (cart.length === 0) {
      toast.error("Моля, добавете поне един продукт.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!idToken) {
        toast.error("Липсва оторизация. Моля, влезте отново.");
        return;
      }

      const result = await updateSaleAction(saleId, idToken, {
        items: cart,
        memberId: selectedMemberId === "none" ? undefined : selectedMemberId,
        status: paymentStatus,
        totalAmount: totalAmount, // Pass totalAmount if needed, though schema might calculate it
      });

      if (result.success) {
        if (
          initialSale?.memberId &&
          initialSale.memberId !== "GUEST_EXTERNAL"
        ) {
          mutate(initialSale.memberId);
        }
        if (
          selectedMemberId &&
          selectedMemberId !== "none" &&
          selectedMemberId !== "GUEST_EXTERNAL" &&
          selectedMemberId !== initialSale?.memberId
        ) {
          mutate(selectedMemberId);
        }
        toast.success(result.message || "Продажбата е актуализирана успешно.");
        router.push(successUrl);
      } else {
        toast.error(result.message || "Възникна грешка при обновяване.");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Възникна грешка при обновяване.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableProducts = useMemo(
    () =>
      allProducts.filter((p) => {
        const itemInCart = cart.find((item) => item.productId === p.id);
        const cartQuantity = itemInCart?.quantity || 0;
        const originalItem = initialSale?.items.find(
          (item) => item.productId === p.id
        );
        const originalQuantity = originalItem?.quantity || 0;
        const currentStock = (p.stock || 0) + originalQuantity;
        return currentStock - cartQuantity > 0;
      }),
    [allProducts, cart, initialSale]
  );

  const isLoading = productsLoading || membersLoading || isPageLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Редактиране на продажба"
        description={`Редакция на детайлите за продажба #${saleId.substring(0, 8)}.`}
        breadcrumbs={breadcrumbs}
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BentoCard className="p-8 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold font-bento tracking-tight">
                Налични продукти
              </h2>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-100 dark:border-zinc-900 hover:bg-transparent">
                    <TableHead className="font-bold text-zinc-400">
                      Продукт
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-400">
                      Цена
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-400">
                      Наличност
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100 py-4">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-950 dark:text-zinc-50">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-transparent">
                          {product.stock} бр.
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-zinc-400 dark:text-zinc-600 hover:scale-105 active:scale-95"
                          onClick={() => addToCart(product)}
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View: Product Cards */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-zinc-100 dark:border-zinc-900 rounded-2xl flex items-center justify-between active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors bg-white dark:bg-zinc-950"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      {product.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md text-[11px]">
                        {formatPrice(product.price)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                        {product.stock} налични
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-primary/10 text-primary transition-all pointer-events-none"
                  >
                    <PlusCircle className="h-6 w-6" strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <div className="space-y-6">
          <BentoCard className="p-8 sticky top-24 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl shadow-zinc-100/40 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg font-bento">Количка</h3>
              </div>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-black">
                {cart.length} артикула
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  Клиент
                </Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 shadow-none h-11 focus:ring-1 focus:ring-primary/20">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                      <SelectValue placeholder="Изберете член" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                    <SelectItem value="none">Външен клиент</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="divider h-px bg-zinc-100 dark:bg-zinc-900 my-4" />

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-8 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl">
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                      Количката е празна
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between group bg-slate-50/30 p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-12 h-8 px-1 text-center bg-white border-none shadow-sm rounded-lg text-sm font-bold"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-50">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  Статус на плащане
                </Label>
                <RadioGroup
                  value={paymentStatus}
                  onValueChange={(value) =>
                    setPaymentStatus(value as Sale["status"])
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="r-paid"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentStatus === "completed"
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                        : "border-slate-50 bg-slate-50/50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <RadioGroupItem
                      value="completed"
                      id="r-paid"
                      className="sr-only"
                    />
                    <span className="text-xs font-bold">Платено</span>
                  </Label>
                  <Label
                    htmlFor="r-deferred"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentStatus === "pending"
                        ? "border-orange-500 bg-orange-50/50 text-orange-700"
                        : "border-slate-50 bg-slate-50/50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <RadioGroupItem
                      value="pending"
                      id="r-deferred"
                      className="sr-only"
                    />
                    <span className="text-xs font-bold">Отложено</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
                <span className="font-bold opacity-60">Общо:</span>
                <span className="font-black text-xl">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <Button
                onClick={handleUpdateSale}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Запази промените"
                )}
              </Button>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
