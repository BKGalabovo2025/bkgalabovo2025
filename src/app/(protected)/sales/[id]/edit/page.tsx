"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { getSaleById, updateSale } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { useProducts } from "@/hooks/useProducts";
import { Member, Sale, Product } from "@/types";
import { formatPrice } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  CreditCard,
  Calendar,
  CheckCircle2,
  Pencil,
  History,
} from "lucide-react";

type SaleItem = Sale["items"][0];

const EditSalePage = () => {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;

  const {
    products: allProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("none");
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>("completed");
  const [saleDate, setSaleDate] = useState<string>("");
  const [billingMonth, setBillingMonth] = useState<string>("none");
  const [billingYear, setBillingYear] = useState<string>("");
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
          toast.error("Грешка", { description: "Продажбата не е намерена." });
          router.push("/sales");
          return;
        }

        setInitialSale(saleData);
        setCart(saleData.items);
        setSelectedMemberId(saleData.memberId || "none");
        setPaymentStatus(saleData.status);
        setSaleDate(saleData.saleDate ? saleData.saleDate.split("T")[0] : "");
        setBillingMonth(saleData.billingMonth ? saleData.billingMonth.toString() : "none");
        setBillingYear(saleData.billingYear ? saleData.billingYear.toString() : "");
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Грешка при зареждане", {
          description: "Неуспешно зареждане на данните за редактиране.",
        });
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
          toast.error("Няма наличност", {
            description: `Само ${stock} бр. от ${product.name} са налични.`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (stock < 1) {
          toast.error("Няма наличност", {
            description: `Продуктът ${product.name} е изчерпан.`,
          });
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
      toast.error("Няма наличност", {
        description: `Максималното налично количество е ${stock}.`,
      });
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
      toast.error("Празна количка", {
        description: "Моля, добавете поне един продукт.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSale(saleId, {
        items: cart,
        memberId: selectedMemberId === "none" ? undefined : selectedMemberId,
        status: paymentStatus,
        saleDate: new Date(saleDate).toISOString(),
        billingMonth: billingMonth !== "none" ? parseInt(billingMonth) : undefined,
        billingYear: billingYear !== "" ? parseInt(billingYear) : undefined,
      });

      toast.success("Успех!", {
        description: "Продажбата е актуализирана успешно.",
      });
      router.push(`/sales/${saleId}`);
    } catch (error) {
      const err = error as Error;
      console.error("Error updating sale:", err);
      toast.error("Грешка", {
        description:
          err.message || "Възникна грешка при обновяване на продажбата.",
      });
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
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-6" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">Зареждане на данните...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative h-64 w-full bg-gradient-to-br from-amber-500 to-orange-800 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="w-fit mb-6 text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Отказ от редактиране
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-white font-heading tracking-tight drop-shadow-lg">
                Редактиране
              </h1>
              <p className="text-orange-100/80 text-lg font-medium uppercase tracking-widest">№ {saleId.slice(-8).toUpperCase()}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-orange-100/60 text-[10px] font-black uppercase tracking-widest">Нова сума</p>
                <p className="text-3xl font-black text-white tracking-tighter">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-orange-500/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl overflow-hidden ring-1 ring-zinc-200 dark:ring-white/10">
            <CardHeader className="p-10 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-heading text-zinc-900 dark:text-white uppercase tracking-tight">Промяна на продукти</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold">Актуализирайте съдържанието на поръчката.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-white/5">
                  <TableRow className="border-zinc-100 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="pl-10 py-6 font-black text-zinc-400 text-[10px] uppercase tracking-widest">Артикул</TableHead>
                    <TableHead className="text-right py-6 font-black text-zinc-400 text-[10px] uppercase tracking-widest">Ед. Цена</TableHead>
                    <TableHead className="text-right py-6 font-black text-zinc-400 text-[10px] uppercase tracking-widest">Наличност</TableHead>
                    <TableHead className="pr-10 py-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableProducts.length > 0 ? (
                    availableProducts.map((product) => (
                      <TableRow key={product.id} className="border-zinc-50 dark:border-white/5 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors group">
                        <TableCell className="pl-10 py-6 font-black text-lg text-zinc-900 dark:text-zinc-100 font-heading">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right py-6 font-bold text-zinc-600 dark:text-zinc-400">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell className="text-right py-6">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400`}>
                             {product.stock} налични
                           </span>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <Button
                            size="icon"
                            className="rounded-2xl h-11 w-11 bg-zinc-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-xl transition-all"
                            onClick={() => addToCart(product)}
                          >
                            <PlusCircle className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Няма други налични продукти</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-white/10 overflow-hidden">
            <CardHeader className="p-8 border-b border-zinc-100 dark:border-white/5">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-zinc-900 dark:bg-white dark:text-black text-white flex items-center justify-center shadow-lg">
                   <ShoppingCart className="h-5 w-5" />
                 </div>
                 <CardTitle className="text-xl font-black font-heading uppercase tracking-tight">Текуща количка</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Member Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  <UserPlus className="h-3 w-3" /> Клиент / Член
                </Label>
                <Select
                  onValueChange={setSelectedMemberId}
                  value={selectedMemberId}
                >
                  <SelectTrigger className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-orange-500 shadow-sm transition-all">
                    <SelectValue placeholder="Изберете член" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                    <SelectItem value="none" className="font-bold">Клиент на място</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="font-bold">
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Списък артикули</Label>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-[1.5rem] border border-zinc-100 dark:border-white/5 group transition-all hover:shadow-lg"
                    >
                      <div className="flex-grow min-w-0 pr-4">
                        <p className="font-black text-sm text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-black text-zinc-400 mt-1">
                          {formatPrice(item.price)} / ед.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-14 h-10 rounded-xl border-zinc-200 dark:border-white/10 text-center font-black text-xs bg-white dark:bg-zinc-900"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 text-zinc-300 transition-all"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Config */}
              <div className="space-y-8 pt-8 border-t border-zinc-100 dark:border-white/5">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    <CreditCard className="h-3 w-3" /> Статус на плащане
                  </Label>
                  <RadioGroup
                    value={paymentStatus}
                    onValueChange={(value) =>
                      setPaymentStatus(value as Sale["status"])
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem value="completed" id="r-paid" className="peer sr-only" />
                      <Label 
                        htmlFor="r-paid" 
                        className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950/50 border-2 border-transparent rounded-2xl cursor-pointer peer-data-[state=checked]:border-orange-600 peer-data-[state=checked]:bg-orange-50 dark:peer-data-[state=checked]:bg-orange-900/20 transition-all group"
                      >
                        <CheckCircle2 className={`h-5 w-5 mb-2 ${paymentStatus === 'completed' ? 'text-orange-600' : 'text-zinc-300'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentStatus === 'completed' ? 'text-orange-700' : 'text-zinc-500'}`}>Платено</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="pending" id="r-deferred" className="peer sr-only" />
                      <Label 
                        htmlFor="r-deferred" 
                        className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950/50 border-2 border-transparent rounded-2xl cursor-pointer peer-data-[state=checked]:border-amber-600 peer-data-[state=checked]:bg-amber-50 dark:peer-data-[state=checked]:bg-amber-900/20 transition-all group"
                      >
                        <Calendar className={`h-5 w-5 mb-2 ${paymentStatus === 'pending' ? 'text-amber-600' : 'text-zinc-300'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentStatus === 'pending' ? 'text-amber-700' : 'text-zinc-500'}`}>Отложено</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    <Calendar className="h-3 w-3" /> Дата на транзакция
                  </Label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-orange-500 shadow-sm"
                  />
                </div>

                {(initialSale?.billingMonth || initialSale?.subscriptionId) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        <History className="h-3 w-3" /> Месец
                      </Label>
                      <Select value={billingMonth} onValueChange={setBillingMonth}>
                        <SelectTrigger className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-orange-500 shadow-sm">
                          <SelectValue placeholder="Месец" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                          <SelectItem value="none">Не е такса</SelectItem>
                          {["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"].map((m, i) => (
                            <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Година
                      </Label>
                      <Input
                        type="number"
                        value={billingYear}
                        onChange={(e) => setBillingYear(e.target.value)}
                        className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-orange-500 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-6 border-t-2 border-dashed border-zinc-100 dark:border-white/5">
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">Ново общо:</span>
                  <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{formatPrice(totalAmount)}</span>
                </div>
                
                <Button
                  onClick={handleUpdateSale}
                  className="w-full h-16 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-[0.15em] text-sm shadow-2xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : <Pencil className="mr-3 h-5 w-5" />}
                  Запази промените
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditSalePage;
