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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { 
  ShoppingCart,
  Calendar,
  Clock,
  PlusCircle,
  User,
  Pencil,
  Trash2
} from "lucide-react";
import { ClubGeneralService, Member } from "@/types";
import { 
  getGeneralServices, 
  addGeneralService, 
  updateGeneralService, 
  deleteGeneralService 
} from "@/services/general-services";
import { getAllMembers } from "@/services/member-service";
import { addSale } from "@/services/sales-service";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ServiceHistory from "./ServiceHistory";

export const GeneralServicesManager = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ClubGeneralService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClubGeneralService | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    pricingUnit: "fixed" as "fixed" | "per_hour" | "per_unit",
    priceUnit: "",
    performerType: "internal" as "internal" | "external",
    performerName: "",
    durationMinutes: "",
    description: ""
  });

  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ClubGeneralService | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [sellData, setSellData] = useState({
    memberId: "",
    saleDate: new Date().toISOString().split("T")[0],
    quantity: 1,
    isPaid: true
  });
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      const [sData, mData] = await Promise.all([
        getGeneralServices(),
        getAllMembers()
      ]);
      setServices(sData);
      setMembers(mData);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Грешка при зареждане на услугите");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenDialog = (service?: ClubGeneralService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        price: service.price.toString(),
        pricingUnit: service.pricingUnit || "fixed",
        priceUnit: service.priceUnit || "",
        performerType: service.performerType,
        performerName: service.performerName,
        durationMinutes: service.durationMinutes?.toString() || "",
        description: service.description || ""
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        price: "",
        pricingUnit: "fixed",
        priceUnit: "",
        performerType: "internal",
        performerName: "",
        durationMinutes: "",
        description: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name || !formData.price || !formData.performerName) {
      toast.error("Моля, попълнете всички задължителни полета");
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        price: parseFloat(formData.price),
        currency: "EUR" as const,
        pricingUnit: formData.pricingUnit,
        ...(formData.pricingUnit === "per_unit" ? { priceUnit: formData.priceUnit || "бр." } : {}),
        ...(formData.durationMinutes ? { durationMinutes: parseInt(formData.durationMinutes) } : {}),
        performerType: formData.performerType,
        performerName: formData.performerName,
        description: formData.description || "",
      };

      if (editingService) {
        await updateGeneralService(editingService.id, serviceData, user.uid, user.displayName || user.email || "Система");
        toast.success("Услугата е обновена");
      } else {
        await addGeneralService(serviceData, user.uid, user.displayName || user.email || "Система");
        toast.success("Услугата е добавена");
      }
      
      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Грешка при запис");
    }
  };

  const confirmDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    
    try {
      const sToDelete = services.find(s => s.id === serviceToDelete);
      if (user && sToDelete) {
        await deleteGeneralService(serviceToDelete, user.uid, user.displayName || user.email || "Система");
        toast.success("Услугата е изтрита");
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Грешка при изтриване");
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleRecordSale = async () => {
    if (!user || !selectedService || !sellData.memberId) {
      toast.error("Моля, изберете член за продажбата");
      return;
    }

    try {
      const saleData = {
        memberId: sellData.memberId,
        saleDate: new Date(sellData.saleDate).toISOString(),
        items: [{
          productId: selectedService.id,
          name: selectedService.name,
          quantity: sellData.quantity,
          price: selectedService.price,
        }],
        status: (sellData.isPaid ? "completed" : "pending") as "completed" | "pending",
        currency: "EUR" as const,
        totalAmount: selectedService.price * sellData.quantity,
        isPaid: sellData.isPaid
      };
      
      await addSale(saleData, user.uid, user.displayName || "Админ");
      toast.success("Продажбата е записана");
      setIsSellDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Грешка при запис на продажба");
    }
  };

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-heading text-zinc-900 dark:text-white tracking-tight">Каталог Услуги</h2>
          <p className="text-zinc-500 font-medium text-lg">Еднократни услуги, наеми и професионални дейности</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black px-8 h-14 shadow-lg shadow-blue-600/20 text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]">
          <PlusCircle className="mr-2 h-5 w-5" /> Добави Услуга
        </Button>
      </div>

      <TabsList className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-14 p-1">
        <TabsTrigger value="list" className="rounded-xl font-black text-xs uppercase tracking-widest px-8 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400">Каталог</TabsTrigger>
        <TabsTrigger value="history" className="rounded-xl font-black text-xs uppercase tracking-widest px-8 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400">Оперативна История</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-6">
        <div className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow className="border-zinc-200 dark:border-zinc-800">
                <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-6 pl-8">Услуга</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-6">Изпълнител</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-6 text-right">Цена</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-6 text-right pr-8">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-zinc-400 font-medium italic">Зареждане...</TableCell></TableRow>
              ) : services.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-zinc-400 font-medium italic">Няма намерени услуги</TableCell></TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id} className="border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <TableCell className="py-6 pl-8">
                      <div className="font-black text-lg text-zinc-900 dark:text-white">{service.name}</div>
                      {service.description && <div className="text-sm font-medium text-zinc-500 mt-1 max-w-md truncate">{service.description}</div>}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-zinc-500" />
                        </div>
                        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{service.performerName || "Няма"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-right">
                      <div className="text-xl font-black text-zinc-900 dark:text-white">{formatPrice(service.price)}</div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{service.currency}</div>
                    </TableCell>
                    <TableCell className="py-6 pr-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedService(service); setIsSellDialogOpen(true); }} className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-zinc-400"><ShoppingCart className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)} className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-zinc-400"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(service.id)} className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-zinc-400"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden p-0">
          <DialogHeader className="p-10 pb-6 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white">Нова Продажба</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-8">
            {selectedService && (
              <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/30 flex justify-between items-center shadow-inner">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Избрана Услуга</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white">{selectedService.name}</div>
                  <div className="text-sm font-bold text-zinc-500 mt-1 italic">Изпълнител: {selectedService.performerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Ед. Цена</div>
                  <div className="text-3xl font-black text-blue-600">{formatPrice(selectedService.price)}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Избери Член</Label>
                <Select 
                  value={sellData.memberId} 
                  onValueChange={(val) => setSellData({...sellData, memberId: val})}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold px-6">
                    <SelectValue placeholder="Търси член..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                    <div className="p-2 sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <Input placeholder="Бързо търсене..." className="h-10 rounded-xl mb-2" />
                    </div>
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
                    value={sellData.saleDate} 
                    onChange={(e) => setSellData({...sellData, saleDate: e.target.value})}
                    className="h-14 rounded-2xl pl-14 font-black border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Количество</Label>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSellData({...sellData, quantity: Math.max(1, sellData.quantity - 1)})}
                    className="h-16 w-16 rounded-2xl border-2 font-black text-2xl"
                  >-</Button>
                  <Input 
                    type="number" 
                    value={sellData.quantity} 
                    onChange={(e) => setSellData({...sellData, quantity: parseInt(e.target.value) || 1})} 
                    className="h-16 rounded-2xl text-3xl font-black text-center border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setSellData({...sellData, quantity: sellData.quantity + 1})}
                    className="h-16 w-16 rounded-2xl border-2 font-black text-2xl"
                  >+</Button>
                </div>
              </div>
              
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-900/30 shadow-inner flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Общо за плащане</div>
                    <div className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">
                      {selectedService ? formatPrice(selectedService.price * sellData.quantity) : "0.00 €"}
                    </div>
                  </div>
                  <Badge className={sellData.isPaid ? "bg-emerald-500 text-white border-none" : "bg-orange-500 text-white border-none"}>
                    {sellData.isPaid ? "Платено" : "Отложено"}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <Select 
                    value={sellData.isPaid ? "paid" : "deferred"} 
                    onValueChange={(val) => setSellData({...sellData, isPaid: val === "paid"})}
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
            </div>
          </div>

          <DialogFooter className="px-10 py-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
            <Button variant="outline" onClick={() => setIsSellDialogOpen(false)} className="flex-1 h-12 rounded-2xl border-zinc-200 dark:border-zinc-700 font-bold">
              Отказ
            </Button>
            <Button onClick={handleRecordSale} className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20">
              Потвърди Продажба
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden p-0 flex flex-col max-h-[90dvh]">
          {/* Sticky header */}
          <DialogHeader className="shrink-0 px-8 pt-8 pb-6 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-2xl font-black font-heading text-zinc-900 dark:text-white">
              {editingService ? "Редактирай Услуга" : "Нова Услуга"}
            </DialogTitle>
            <p className="text-sm text-zinc-500 font-medium mt-1">Дефинирайте детайлите на услугата за каталога</p>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">

            {/* Service name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Име на услугата</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Напр. Наем на корт, Наплитане на ракета..."
                className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold"
              />
            </div>

            {/* Pricing type — the key new section */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Начин на ценообразуване</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "fixed",    label: "Фиксирана",  sub: "за 1 изпълнение",  icon: "⚡" },
                  { value: "per_hour", label: "Почасова",   sub: "цена за 1 час",     icon: "🕐" },
                  { value: "per_unit", label: "На бройка",  sub: "цена за единица",  icon: "📦" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({...formData, pricingUnit: opt.value as typeof formData.pricingUnit})}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all ${
                      formData.pricingUnit === opt.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className={`text-xs font-black uppercase tracking-widest ${formData.pricingUnit === opt.value ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-300"}`}>{opt.label}</span>
                    <span className="text-[9px] font-medium text-zinc-400">{opt.sub}</span>
                  </button>
                ))}
              </div>

              {/* Contextual hint for per_hour — links to reservations */}
              {formData.pricingUnit === "per_hour" && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-500 text-base shrink-0 mt-0.5">💡</span>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Ако услугата се казва точно <strong>„Наем на корт"</strong>, цената ще се използва автоматично при резервации на корт.
                  </p>
                </div>
              )}

              {/* Custom unit field — only for per_unit */}
              {formData.pricingUnit === "per_unit" && (
                <div className="space-y-2 pt-1">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Единица мярка</Label>
                  <Input
                    value={formData.priceUnit}
                    onChange={(e) => setFormData({...formData, priceUnit: e.target.value})}
                    placeholder="напр. бр., м., компл., чифт..."
                    className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold"
                  />
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                Цена (EUR){" "}
                {formData.pricingUnit === "per_hour" && <span className="text-amber-500 font-black">· за 1 час</span>}
                {formData.pricingUnit === "per_unit" && <span className="text-blue-500 font-black">· за 1 {formData.priceUnit || "бр."}</span>}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                  className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-black text-lg pr-14"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm pointer-events-none">€</span>
              </div>
            </div>

            {/* Duration (Optional) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                Времетраене (минути)
              </Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                  placeholder="напр. 60"
                  className="h-12 rounded-2xl pl-12 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold"
                />
              </div>
              <p className="text-[10px] font-medium text-zinc-400 ml-1 italic">Оставете празно, ако не е фиксирано</p>
            </div>

            {/* Performer type */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Тип Изпълнител</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "internal", label: "Вътрешен", sub: "служител на клуба" },
                  { value: "external", label: "Външен",   sub: "партньор / изпълнител" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({...formData, performerType: opt.value as "internal" | "external"})}
                    className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                      formData.performerType === opt.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className={`text-xs font-black uppercase tracking-widest ${formData.performerType === opt.value ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-300"}`}>{opt.label}</span>
                    <span className="text-[9px] font-medium text-zinc-400">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Performer name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                {formData.performerType === "internal" ? "Служител" : "Изпълнител / Партньор"}
              </Label>
              <Input
                value={formData.performerName}
                onChange={(e) => setFormData({...formData, performerName: e.target.value})}
                placeholder={formData.performerType === "internal" ? "напр. Иван Петров" : "напр. Наско Маджаров / ООД"}
                className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Описание (Опционално)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Кратко описание на услугата..."
                className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <DialogFooter className="shrink-0 px-8 py-5 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">Отказ</Button>
            <Button onClick={handleSave} className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0 overflow-hidden sm:max-w-md">
          <div className="p-8 space-y-4 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black font-heading text-zinc-900 dark:text-white text-center">Изтриване на услуга?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500 font-medium text-center text-lg">
                Това действие не може да бъде отменено. Услугата ще бъде окончателно премахната от системата.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest px-8 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 m-0">Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest px-8 shadow-2xl shadow-red-600/20 m-0">Изтрий</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TabsContent value="history" className="space-y-6">
        <ServiceHistory />
      </TabsContent>
    </Tabs>
  );
};
