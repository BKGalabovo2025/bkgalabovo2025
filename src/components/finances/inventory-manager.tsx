"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  History, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings2,
  Trash2,
  AlertTriangle,
  Pencil,
  ShoppingCart,
  Calendar
} from "lucide-react";
import { Product, InventoryEvent, Member } from "@/types";
import { 
  getProducts, 
  getInventoryEvents, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  restockProduct,
  adjustProductStock
} from "@/services/inventory-service";
import { addSale } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getInventoryEventTypeLabel = (type: string) => {
  const normalizedType = type?.trim().toLowerCase();
  switch (normalizedType) {
    case "restock": return "Презареждане";
    case "correction": return "Корекция";
    case "sale": return "Продажба";
    case "initial": return "Първоначално";
    case "price_update": return "Промяна цена";
    default: return type || "Няма данни";
  }
};

export const InventoryManager = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [actionType, setActionType] = useState<"restock" | "correction" | "sell">("restock");
  
  const [productData, setProductData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "Екипировка",
    restockThreshold: 5
  });

  const [actionData, setActionData] = useState({
    quantity: 1,
    notes: "",
    memberId: "",
    saleDate: new Date().toISOString().split("T")[0],
    isPaid: true
  });

  const fetchData = async () => {
    try {
      const [pData, eData, mData] = await Promise.all([
        getProducts(), 
        getInventoryEvents(),
        getAllMembers()
      ]);
      setProducts(pData);
      setEvents(eData);
      setMembers(mData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Грешка при зареждане на инвентара");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductData(product);
    } else {
      setEditingProduct(null);
      setProductData({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "Екипировка",
        restockThreshold: 5
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    if (!productData.name) {
      toast.error("Името е задължително");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData, user.uid, user.displayName || "Админ");
        toast.success("Продуктът е обновен");
      } else {
        await addProduct(productData as Omit<Product, "id">, user.uid, user.displayName || "Админ");
        toast.success("Продуктът е добавен");
      }
      setIsProductDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Грешка при запис");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Изтриване на продукта? Това няма да изтрие историята на събитията.")) return;
    try {
      await deleteProduct(id);
      toast.success("Продуктът е изтрит");
      fetchData();
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  const handleOpenActionDialog = (product: Product, type: "restock" | "correction") => {
    setSelectedProduct(product);
    setActionType(type);
    setActionData({ 
      ...actionData,
      quantity: type === "restock" ? 0 : product.stock, 
      notes: "" 
    });
    setIsActionDialogOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!user || !selectedProduct) return;
    
    if (actionType === "sell" && !actionData.memberId) {
      toast.error("Моля, изберете член за продажбата");
      return;
    }

    try {
      if (actionType === "restock") {
        await restockProduct(selectedProduct.id, actionData.quantity, user.uid, user.displayName || "Админ", actionData.notes);
        toast.success("Зареждането е отразено");
      } else if (actionType === "correction") {
        await adjustProductStock(selectedProduct.id, actionData.quantity, user.uid, user.displayName || "Админ", actionData.notes);
        toast.success("Коригирането е извършено");
      } else if (actionType === "sell") {
        const saleData = {
          memberId: actionData.memberId,
          saleDate: new Date(actionData.saleDate).toISOString(),
          items: [{
            productId: selectedProduct.id,
            name: selectedProduct.name,
            quantity: actionData.quantity,
            price: selectedProduct.price,
            totalPrice: selectedProduct.price * actionData.quantity
          }],
          status: (actionData.isPaid ? "completed" : "pending") as "completed" | "pending",
          currency: "EUR" as const,
          totalAmount: selectedProduct.price * actionData.quantity,
          isPaid: actionData.isPaid
        };
        
        await addSale(saleData, user.uid, user.displayName || "Админ");
        toast.success("Продажбата е записана");
      }
      setIsActionDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Грешка при изпълнение");
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="stock" className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-[2rem] h-[4.5rem] shadow-inner backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger 
              value="stock" 
              className="rounded-[1.5rem] px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-3 transition-all duration-300"
            >
              <Package className="h-5 w-5" /> Наличности
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-[1.5rem] px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest gap-3 transition-all duration-300"
            >
              <History className="h-5 w-5" /> Оперативна История
            </TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => handleOpenProductDialog()} 
            className="rounded-[2rem] bg-orange-600 hover:bg-orange-700 text-white font-black px-8 h-14 shadow-xl shadow-orange-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Нов Артикул
          </Button>
        </div>

        <TabsContent value="stock" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-zinc-50/80 dark:bg-zinc-950/80">
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8 pl-10">Артикул</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8">Категория</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8 text-center">Наличност</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8 text-right pr-10">Управление</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Зареждане на инвентар...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package className="h-12 w-12 text-zinc-200" />
                        <p className="text-zinc-400 font-medium italic">Няма намерени артикули</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id} className="border-zinc-100 dark:border-zinc-800/50 group hover:bg-white dark:hover:bg-zinc-800/30 transition-all duration-300">
                      <TableCell className="py-8 pl-10">
                        <div className="font-black text-xl text-zinc-900 dark:text-white group-hover:text-orange-600 transition-colors">{p.name}</div>
                        <div className="text-sm font-bold text-blue-600 mt-1">{formatPrice(p.price)}</div>
                      </TableCell>
                      <TableCell className="py-8">
                        <Badge variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-black uppercase text-[10px] px-3 py-1 tracking-tighter shadow-sm">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-8 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className={`text-3xl font-black ${p.stock <= (p.restockThreshold || 0) ? "text-red-500" : "text-zinc-900 dark:text-white"}`}>
                            {p.stock}
                          </div>
                          {p.stock <= (p.restockThreshold || 0) && (
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                            </div>
                          )}
                        </div>
                        {p.stock <= (p.restockThreshold || 0) && (
                          <div className="text-[10px] font-black uppercase text-red-500 mt-1 tracking-tighter">Ниско ниво</div>
                        )}
                      </TableCell>
                      <TableCell className="py-8 text-right pr-10">
                        <div className="flex justify-end gap-3">
                          <Button 
                            onClick={() => {
                              setActionType("sell");
                              setSelectedProduct(p);
                              setActionData({
                                quantity: 1,
                                notes: "",
                                memberId: "",
                                saleDate: new Date().toISOString().split("T")[0],
                                isPaid: true
                              });
                              setIsActionDialogOpen(true);
                            }} 
                            className="rounded-2xl bg-zinc-900 dark:bg-zinc-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest px-6 h-11 transition-all shadow-lg hover:shadow-emerald-600/20"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" /> Продай
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setActionType("restock");
                              setSelectedProduct(p);
                              setActionData({ ...actionData, quantity: 0, notes: "" });
                              setIsActionDialogOpen(true);
                            }} 
                            className="h-11 w-11 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 text-zinc-400 transition-all"
                          >
                            <ArrowUpRight className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setActionType("correction");
                              setSelectedProduct(p);
                              setActionData({ ...actionData, quantity: 0, notes: "" });
                              setIsActionDialogOpen(true);
                            }} 
                            className="h-11 w-11 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 text-zinc-400 transition-all"
                          >
                            <Settings2 className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenProductDialog(p)} 
                            className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-all"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteProduct(p.id)} 
                            className="h-11 w-11 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-zinc-400 transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-zinc-50/80 dark:bg-zinc-950/80">
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8 pl-10">Дата и Час</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8">Събитие / Артикул</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8">Промяна</TableHead>
                  <TableHead className="font-black text-zinc-500 uppercase tracking-[0.2em] text-[10px] py-8 pr-10">Отговорник</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id} className="border-zinc-100 dark:border-zinc-800/50 group hover:bg-white dark:hover:bg-zinc-800/30 transition-all duration-300">
                    <TableCell className="py-6 pl-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="text-sm font-bold text-zinc-500">
                          {new Date(e.createdAt).toLocaleString("bg-BG")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="font-black text-lg text-zinc-900 dark:text-white">{e.productName}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mt-0.5">{getInventoryEventTypeLabel(e.type)}</div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={`font-black text-xl flex items-center gap-2 ${e.quantityChange > 0 ? "text-emerald-600" : e.quantityChange < 0 ? "text-red-600" : "text-zinc-500"}`}>
                        {e.quantityChange > 0 ? "+" : ""}{e.quantityChange}
                        {e.quantityChange > 0 ? (
                          <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><ArrowUpRight className="h-4 w-4" /></div>
                        ) : e.quantityChange < 0 ? (
                          <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-lg"><ArrowDownLeft className="h-4 w-4" /></div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 pr-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xs">
                          {e.userName?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="text-sm font-black text-zinc-700 dark:text-zinc-300">
                          {(e.userName?.trim().toLowerCase() === "admin") ? "Админ" : (e.userName?.trim().toLowerCase() === "system" ? "Система" : e.userName)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Edit/Create Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[650px] w-[95vw] p-0 rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-3xl overflow-hidden flex flex-col max-h-[95vh] text-zinc-900 dark:text-zinc-100">
          <DialogHeader className="p-10 pb-8 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-600/20">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white">
                  {editingProduct ? "Редактирай Артикул" : "Нов Артикул"}
                </DialogTitle>
                <p className="text-zinc-500 font-medium mt-1">Дефинирайте параметрите на инвентарния запис</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Наименование</Label>
                <Input 
                  value={productData.name} 
                  onChange={(e) => setProductData({...productData, name: e.target.value})} 
                  className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold px-6 focus:bg-white dark:focus:bg-zinc-900" 
                  placeholder="напр. Хилка за бадминтон"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Категория</Label>
                <Input 
                  value={productData.category} 
                  onChange={(e) => setProductData({...productData, category: e.target.value})} 
                  className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold px-6 focus:bg-white dark:focus:bg-zinc-900" 
                  placeholder="напр. Екипировка"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Цена (EUR)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={productData.price} 
                    onChange={(e) => setProductData({...productData, price: parseFloat(e.target.value)})} 
                    className="h-14 rounded-2xl font-black text-xl px-6 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 font-black">€</div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Наличност</Label>
                <Input 
                  type="number" 
                  value={productData.stock} 
                  onChange={(e) => setProductData({...productData, stock: parseInt(e.target.value)})} 
                  className="h-14 rounded-2xl font-black text-xl px-6 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900" 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Праг за поръчка</Label>
                <Input 
                  type="number" 
                  value={productData.restockThreshold || 0} 
                  onChange={(e) => setProductData({...productData, restockThreshold: parseInt(e.target.value)})} 
                  className="h-14 rounded-2xl font-black text-xl px-6 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Описание</Label>
              <textarea 
                value={productData.description} 
                onChange={(e) => setProductData({...productData, description: e.target.value})}
                className="w-full min-h-[100px] rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500 font-medium px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/30 transition-all focus:bg-white dark:focus:bg-zinc-900 resize-none outline-none"
                placeholder="Допълнителна информация за артикула..."
              />
            </div>
          </div>

          <DialogFooter className="p-10 pt-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest px-10 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Отказ</Button>
            <Button onClick={handleSaveProduct} className="h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest px-12 shadow-xl shadow-orange-600/20 transition-all hover:scale-105">Запази Артикул</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Restock/Correction/Sell) */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[650px] w-[95vw] p-0 rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-3xl overflow-hidden flex flex-col max-h-[95vh] text-zinc-900 dark:text-zinc-100">
          <DialogHeader className="p-10 pb-8 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-2xl text-white shadow-lg ${actionType === "sell" ? "bg-emerald-600 shadow-emerald-600/20" : actionType === "restock" ? "bg-orange-600 shadow-orange-600/20" : "bg-blue-600 shadow-blue-600/20"}`}>
                {actionType === "sell" ? <ShoppingCart className="h-6 w-6" /> : actionType === "restock" ? <ArrowUpRight className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white">
                  {actionType === "restock" ? "Зареждане на стока" : actionType === "sell" ? "Продажба на Артикул" : "Корекция на наличност"}
                </DialogTitle>
                <p className="text-zinc-500 font-medium mt-1">Отразете промените в наличностите</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
            {selectedProduct && (
              <div className={`p-8 rounded-[2rem] border-2 shadow-inner flex justify-between items-center ${actionType === "sell" ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30" : actionType === "restock" ? "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30" : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"}`}>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${actionType === "sell" ? "text-emerald-600" : actionType === "restock" ? "text-orange-600" : "text-blue-600"}`}>Избран Артикул</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white">{selectedProduct.name}</div>
                  <div className="text-sm font-bold text-zinc-500 mt-1 italic">Категория: {selectedProduct.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Текуща Наличност</div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">{selectedProduct.stock}</div>
                </div>
              </div>
            )}

            {actionType === "sell" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Избери Член</Label>
                  <Select 
                    value={actionData.memberId} 
                    onValueChange={(val) => setActionData({...actionData, memberId: val})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold px-6">
                      <SelectValue placeholder="Търси член..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-64 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id} className="py-3 font-bold">{m.firstName} {m.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Дата на продажба</Label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <Input 
                      type="date" 
                      value={actionData.saleDate} 
                      onChange={(e) => setActionData({...actionData, saleDate: e.target.value})}
                      className="h-14 rounded-2xl pl-14 font-black border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">
                  {actionType === "restock" ? "Количество за добавяне" : actionType === "sell" ? "Количество за продажба" : "Нова наличност"}
                </Label>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActionData({...actionData, quantity: Math.max(0, actionData.quantity - 1)})}
                    className="h-16 w-16 rounded-2xl border-2 font-black text-2xl"
                  >-</Button>
                  <Input 
                    type="number" 
                    value={actionData.quantity} 
                    onChange={(e) => setActionData({...actionData, quantity: parseInt(e.target.value) || 0})} 
                    className="h-16 rounded-2xl text-3xl font-black text-center border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setActionData({...actionData, quantity: actionData.quantity + 1})}
                    className="h-16 w-16 rounded-2xl border-2 font-black text-2xl"
                  >+</Button>
                </div>
              </div>
              
              {actionType === "sell" ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-900/30 shadow-inner flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Общо за плащане</div>
                      <div className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">
                        {selectedProduct ? formatPrice(selectedProduct.price * actionData.quantity) : "0.00 €"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Select 
                      value={actionData.isPaid ? "paid" : "deferred"} 
                      onValueChange={(val) => setActionData({...actionData, isPaid: val === "paid"})}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/50 font-black text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-emerald-100 dark:border-emerald-800 bg-white dark:bg-zinc-950">
                        <SelectItem value="paid" className="font-bold">ПЛАЩАНЕ В БРОЙ / КАРТА</SelectItem>
                        <SelectItem value="deferred" className="font-bold">ДОБАВИ КЪМ МЕСЕЧНА СМЕТКА</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Бележки / Причина</Label>
                  <textarea 
                    value={actionData.notes} 
                    onChange={(e) => setActionData({...actionData, notes: e.target.value})} 
                    className="w-full h-full min-h-[100px] rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 font-medium px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/30 transition-all focus:bg-white dark:focus:bg-zinc-900 resize-none outline-none"
                    placeholder="Защо се извършва тази корекция?"
                  />
                </div>
              )}
            </div>
            
            {actionType === "sell" && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Бележки към продажбата</Label>
                <Input 
                  value={actionData.notes} 
                  onChange={(e) => setActionData({...actionData, notes: e.target.value})} 
                  className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold px-6 focus:bg-white dark:focus:bg-zinc-900" 
                  placeholder="Допълнителна информация..."
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-10 pt-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest px-10 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">Отказ</Button>
            <Button 
              onClick={handleExecuteAction} 
              className={`h-14 rounded-2xl font-black uppercase text-xs tracking-widest px-12 shadow-2xl transition-all hover:scale-105 active:scale-95 ${actionType === "sell" ? "bg-emerald-600 hover:bg-emerald-700" : actionType === "restock" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
            >
              {actionType === "sell" ? "Финализирай Продажба" : "Изпълни Операция"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
