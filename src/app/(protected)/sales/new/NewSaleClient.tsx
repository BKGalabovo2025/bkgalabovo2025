"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import { useAuth } from "@/context/auth-context";

import { getAllMembers } from "@/services/member-service";
import { createSaleAction } from "@/lib/actions/sales";
import { useProducts } from "@/hooks/useProducts";
import { Member, Sale, Product } from "@/types";
import { formatPrice } from "@/lib/currency";

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
  PlusCircle,
  XCircle,
  ShoppingCart,
  UserPlus,
  ArrowLeft,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

type SaleItem = Sale["items"][0];

export default function NewSaleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMemberId = searchParams.get("memberId");

  const { user, idToken } = useAuth();

  const { products: allProducts, isLoading: productsLoading } = useProducts();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    queryMemberId || "none"
  );
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>("completed");

  useEffect(() => {
    if (queryMemberId) {
      setSelectedMemberId(queryMemberId);
    }
  }, [queryMemberId]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

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

  const availableProducts = allProducts.filter((p) => (p.stock || 0) > 0);

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
          toast.error(`Само ${stock} броя са налични.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
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
    const stock = productInCart?.stock || 0;
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

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error("Добавете поне един продукт.");
      return;
    }

    if (!user) {
      toast.error("Трябва да сте влезли в системата.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!idToken) throw new Error("Missing authentication token.");

      const result = await createSaleAction(idToken, {
        saleDate: new Date().toISOString(),
        items: cart,
        memberId:
          selectedMemberId && selectedMemberId !== "none"
            ? selectedMemberId
            : "unknown", // Changed "" to "unknown" to satisfy schema if needed, or keep it optional
        status: paymentStatus,
        isPaid: paymentStatus === "completed",
        totalAmount: totalAmount,
        currency: "EUR",
        siteId: "default", // Assuming default siteId for now, should ideally come from context
      });

      if (result.success) {
        if (
          selectedMemberId &&
          selectedMemberId !== "none" &&
          selectedMemberId !== "GUEST_EXTERNAL"
        ) {
          mutate(selectedMemberId);
        }
        toast.success(result.message || "Продажбата беше създадена успешно.");
        router.push("/sales");
      } else {
        toast.error(result.message || "Възникна грешка при създаването.");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Възникна грешка при създаването.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = productsLoading || membersLoading;

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
        title="Нова продажба"
        description="Създайте нова продажба на артикули от склада."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Нова" },
        ]}
      >
        <Button
          variant="outline"
          onClick={() => router.push("/sales")}
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BentoCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold font-bento tracking-tight">
                Налични продукти
              </h2>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="font-bold text-slate-400">
                      Продукт
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-400">
                      Цена
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-400">
                      Наличност
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="font-bold py-4">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            (product.stock || 0) < 5
                              ? "bg-orange-50 text-orange-600"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {product.stock} бр.
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => addToCart(product)}
                          disabled={(product.stock || 0) === 0}
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </BentoCard>
        </div>

        <div className="space-y-6">
          <BentoCard className="p-6 sticky top-24 shadow-xl border-primary/10">
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
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={setSelectedMemberId}
                    value={selectedMemberId || "none"}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-50/50 border-none shadow-none h-11 focus:ring-1 focus:ring-primary/20">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                        <SelectValue placeholder="Изберете член" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="none">Клиент от улицата</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="divider h-px bg-slate-50 my-4" />

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/50 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium">
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

            {cart.length > 0 && (
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
                  onClick={handleCreateSale}
                  className="w-full h-12 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Завърши продажбата"
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
