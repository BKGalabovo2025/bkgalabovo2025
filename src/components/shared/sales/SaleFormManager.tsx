"use client";

import {
  ArrowLeft,
  Loader2,
  Package,
  PlusCircle,
  ShoppingCart,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/currency";
import { getAllMembers } from "@/services/member-service";
import { Member, Product, Sale } from "@/types";

export type SaleItem = Sale["items"][0];

export interface SaleFormManagerProps {
  title: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  cancelUrl: string;
  initialCart?: SaleItem[];
  initialMemberId?: string;
  initialStatus?: Sale["status"];
  initialSale?: Sale | null;
  submitText: string;
  onSubmit: (data: {
    cart: SaleItem[];
    memberId: string;
    status: Sale["status"];
    totalAmount: number;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function SaleFormManager({
  title,
  description,
  breadcrumbs,
  cancelUrl,
  initialCart = [],
  initialMemberId = "none",
  initialStatus = "completed",
  initialSale = null,
  submitText,
  onSubmit,
  isSubmitting,
}: SaleFormManagerProps) {
  const router = useRouter();

  const { products: allProducts, isLoading: productsLoading } = useProducts();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [cart, setCart] = useState<SaleItem[]>(initialCart);
  const [selectedMemberId, setSelectedMemberId] =
    useState<string>(initialMemberId);
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>(initialStatus);

  useEffect(() => {
    setCart(initialCart);
    setSelectedMemberId(initialMemberId || "none");
    setPaymentStatus(initialStatus);
  }, [initialCart, initialMemberId, initialStatus]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = await getAllMembers();
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Грешка при зареждане на членове.");
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    if (!product) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );
      const originalItem = initialSale?.items.find(
        (item) => item.productId === product.id
      );
      const originalQuantity = originalItem?.quantity || 0;
      const stock = (product.stock || 0) + originalQuantity;

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > stock) {
          toast.error(`Само ${stock} броя са налични.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (stock < 1) {
          toast.error("Продуктът е изчерпан.");
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
      toast.error(`Максимално количество: ${stock}`);
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleSubmitClick = () => {
    if (cart.length === 0) {
      toast.error("Моля, добавете поне един продукт.");
      return;
    }
    onSubmit({
      cart,
      memberId: selectedMemberId,
      status: paymentStatus,
      totalAmount,
    });
  };

  const availableProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const itemInCart = cart.find((item) => item.productId === p.id);
      const cartQuantity = itemInCart?.quantity || 0;
      const originalItem = initialSale?.items.find(
        (item) => item.productId === p.id
      );
      const originalQuantity = originalItem?.quantity || 0;
      const currentStock = (p.stock || 0) + originalQuantity;
      return currentStock - cartQuantity > 0;
    });
  }, [allProducts, cart, initialSale]);

  const isLoading = productsLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      >
        <Button
          variant="outline"
          onClick={() => router.push(cancelUrl)}
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Package className="size-5" />
              </div>
              <h2 className="font-bento text-xl font-bold tracking-tight">
                Налични продукти
              </h2>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-900">
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
                      className="border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                    >
                      <TableCell className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-950 dark:text-zinc-50">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${
                            (product.stock || 0) < 5
                              ? "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border border-transparent bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                          }`}
                        >
                          {product.stock} бр.
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-lg text-zinc-400 transition-all hover:scale-105 hover:bg-primary/10 hover:text-primary active:scale-95 dark:text-zinc-600"
                          onClick={() => addToCart(product)}
                        >
                          <PlusCircle className="size-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View: Product Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 transition-colors active:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:active:bg-zinc-900"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {product.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {formatPrice(product.price)}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                          (product.stock || 0) < 5
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        {product.stock} налични
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="pointer-events-none size-10 shrink-0 rounded-full text-primary transition-all hover:bg-primary/10"
                  >
                    <PlusCircle className="size-6" strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <div className="space-y-6">
          <BentoCard className="sticky top-24 rounded-4xl border border-zinc-100 bg-white p-8 shadow-2xl shadow-zinc-100/40 dark:border-zinc-900 dark:bg-zinc-950 dark:shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h3 className="font-bento text-lg font-bold">Количка</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                {cart.length} артикула
              </span>
            </div>

            <div className="mb-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Клиент
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                  >
                    <SelectTrigger className="h-11 rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-900 shadow-none focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <UserPlus className="size-4 shrink-0 text-slate-400" />
                        <SelectValue placeholder="Изберете член" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                      <SelectItem value="none">Външен клиент</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="divider my-4 h-px bg-zinc-100 dark:bg-zinc-900" />

              <div className="custom-scrollbar max-h-75 space-y-3 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-50/50 py-8 text-center dark:bg-zinc-900/30">
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                      Количката е празна
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="group flex items-center justify-between rounded-xl border border-transparent bg-slate-50/30 p-2 transition-all hover:border-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
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
                          className="h-8 w-12 rounded-lg border-none bg-white px-1 text-center text-sm font-bold shadow-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="space-y-6 border-t border-slate-50 pt-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
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
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
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
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
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

                <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
                  <span className="font-bold opacity-60">Общо:</span>
                  <span className="text-xl font-black">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                <Button
                  onClick={handleSubmitClick}
                  className="hover:scale-1.02 h-12 w-full rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-5 animate-spin" />
                  ) : (
                    submitText
                  )}
                </Button>
              </div>
            )}
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
