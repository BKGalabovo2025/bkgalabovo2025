"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

import { getAllMembers } from "@/services/member-service";
import { addSale } from "@/services/sales-service";
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
} from "lucide-react";

type SaleItem = Sale["items"][0];

const NewSalePage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const {
    products: allProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["status"]>("completed");
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

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
        toast.error("Грешка", {
          description: "Неуспешно зареждане на членове.",
        });
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
          toast.error("Недостатъчна наличност", {
            description: `Само ${stock} броя от ${product.name} са налични.`,
          });
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
      toast.error("Недостатъчна наличност", {
        description: `Максимално количество: ${stock}`,
      });
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
      toast.error("Празна количка", {
        description: "Моля, добавете поне един продукт.",
      });
      return;
    }

    if (!user) {
      toast.error("Грешка при автентикация", {
        description: "Трябва да сте влезли в системата.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addSale(
        {
          saleDate: new Date(saleDate).toISOString(),
          items: cart,
          memberId:
            selectedMemberId && selectedMemberId !== "none"
              ? selectedMemberId
              : "",
          status: paymentStatus,
          isPaid: paymentStatus === "completed",
          totalAmount: totalAmount,
          currency: "EUR",
        } as Omit<Sale, "id">,
        user.uid,
        user.displayName || user.email || "Unknown User"
      );

      toast.success("Успех!", {
        description: "Продажбата беше създадена успешно.",
      });
      router.push("/sales");
    } catch (error) {
      const err = error as Error;
      console.error("Error creating sale:", err);
      toast.error("Грешка", {
        description:
          err.message || "Възникна грешка при създаването на продажбата.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = productsLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-6" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">Подготовка на терминала...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative h-64 w-full bg-gradient-to-br from-blue-600 to-indigo-900 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="w-fit mb-6 text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към списъка
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-white font-heading tracking-tight drop-shadow-lg">
                Нова Продажба
              </h1>
              <p className="text-blue-100/80 text-lg font-medium">Създаване на нова транзакция в системата.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">Обща сума</p>
                <p className="text-3xl font-black text-white tracking-tighter">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-blue-500/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl overflow-hidden ring-1 ring-zinc-200 dark:ring-white/10">
            <CardHeader className="p-10 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-heading text-zinc-900 dark:text-white uppercase tracking-tight">Избор на продукти</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold">Изберете артикули от наличния инвентар.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-white/5 hover:bg-transparent">
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
                      <TableRow key={product.id} className="border-zinc-50 dark:border-white/5 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                        <TableCell className="pl-10 py-6 font-black text-lg text-zinc-900 dark:text-zinc-100 font-heading">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right py-6 font-bold text-zinc-600 dark:text-zinc-400">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell className="text-right py-6">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             (product.stock || 0) < 5 
                               ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" 
                               : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                           }`}>
                             {product.stock} налични
                           </span>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <Button
                            size="icon"
                            className="rounded-2xl h-11 w-11 bg-zinc-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-xl transition-all"
                            onClick={() => addToCart(product)}
                            disabled={(product.stock || 0) === 0}
                          >
                            <PlusCircle className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Няма налични продукти</p>
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
                 <CardTitle className="text-xl font-black font-heading uppercase tracking-tight">Количка</CardTitle>
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
                  defaultValue={selectedMemberId || "none"}
                >
                  <SelectTrigger className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-blue-500 shadow-sm transition-all">
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
                {cart.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-[2rem] border-2 border-dashed border-zinc-100 dark:border-white/5">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-zinc-200" />
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Количката е празна</p>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Transaction Config */}
              {cart.length > 0 && (
                <div className="space-y-8 pt-8 border-t border-zinc-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
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
                          className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950/50 border-2 border-transparent rounded-2xl cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/20 transition-all group"
                        >
                          <CheckCircle2 className={`h-5 w-5 mb-2 ${paymentStatus === 'completed' ? 'text-blue-600' : 'text-zinc-300'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${paymentStatus === 'completed' ? 'text-blue-700' : 'text-zinc-500'}`}>Платено</span>
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
                      className="rounded-2xl border-zinc-200 dark:border-white/10 h-14 font-black text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <div className="flex justify-between items-center py-6 border-t-2 border-dashed border-zinc-100 dark:border-white/5">
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">Общо:</span>
                    <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{formatPrice(totalAmount)}</span>
                  </div>
                  
                  <Button
                    onClick={handleCreateSale}
                    className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.15em] text-sm shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    ) : <ShoppingCart className="mr-3 h-5 w-5" />}
                    Потвърди продажбата
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewSalePage;
