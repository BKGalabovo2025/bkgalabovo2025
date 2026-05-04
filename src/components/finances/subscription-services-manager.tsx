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
import { PlusCircle, Pencil, Trash2, ShieldCheck, Users, Calendar, Settings2, CreditCard } from "lucide-react";
import { ClubService } from "@/types";
import { getAllClubServices, addClubService, updateClubService, deleteClubService } from "@/services/subscription-service";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionHistory from "./SubscriptionHistory";

export const SubscriptionServicesManager = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClubService | null>(null);
  
  // Comprehensive form state matching ClubService type
  const [formData, setFormData] = useState<Partial<ClubService>>({
    name: "",
    description: "",
    price: 0,
    currency: "EUR",
    type: "Абонамент",
    billingPeriod: "Месечен",
    targetGroups: [],
    isCoachLed: false,
    durationMinutes: 60,
    requiresBooking: false,
    minMembers: 1,
    maxMembers: 0,
    specialRights: [],
    cancellationPolicy: {
      isAllowed: true,
      noticePeriodDays: 1,
      feeType: "none",
      feeValue: 0,
      description: "",
      longTermSicknessDiscount: 0.5
    }
  });

  const fetchServices = async () => {
    try {
      const data = await getAllClubServices();
      setServices(data);
    } catch (error) {
      console.error("Error fetching club services:", error);
      toast.error("Грешка при зареждане на абонаментите");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenDialog = (service?: ClubService) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        currency: "EUR",
        type: "Абонамент",
        billingPeriod: "Месечен",
        targetGroups: [],
        isCoachLed: false,
        durationMinutes: 60,
        requiresBooking: false,
        minMembers: 1,
        maxMembers: 0,
        specialRights: [],
        cancellationPolicy: {
          isAllowed: true,
          noticePeriodDays: 1,
          feeType: "none",
          feeValue: 0,
          description: "",
          longTermSicknessDiscount: 0.5
        }
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name || formData.price === undefined) {
      toast.error("Моля, попълнете име и цена");
      return;
    }

    try {
      const userId = user.uid;
      const userName = user.displayName || user.email || "Система";

      if (editingService) {
        await updateClubService(editingService.id, formData, userId, userName);
        toast.success("Абонаментът е обновен");
      } else {
        await addClubService(formData as Omit<ClubService, "id">, userId, userName);
        toast.success("Абонаментът е добавен");
      }
      
      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving club service:", error);
      toast.error("Грешка при запис");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този абонамент?")) return;
    
    try {
      const serviceToDelete = services.find(s => s.id === id);
      await deleteClubService(
        id, 
        user?.displayName || "Unknown User", 
        user?.uid || "unknown-id",
        serviceToDelete?.name || "Неизвестен абонамент"
      );
      toast.success("Абонаментът е изтрит");
      fetchServices();
    } catch (error) {
      console.error("Error deleting club service:", error);
      toast.error("Грешка при изтриване");
    }
  };

  const toggleTargetGroup = (group: "Деца" | "Любители" | "Състезатели" | "Професионалисти") => {
    const current = formData.targetGroups || [];
    if (current.includes(group)) {
      setFormData({ ...formData, targetGroups: current.filter(g => g !== group) });
    } else {
      setFormData({ ...formData, targetGroups: [...current, group] });
    }
  };

  return (
    <Tabs defaultValue="list" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-heading text-zinc-900 dark:text-white">Управление на Абонаменти</h2>
          <p className="text-zinc-500 font-medium text-lg">Конфигурация на клубните планове и членски такси</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black px-8 h-14 shadow-lg shadow-blue-600/20 text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Нов Абонамент
        </Button>
      </div>

      <TabsList className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-14 p-1">
        <TabsTrigger value="list" className="rounded-xl font-black text-xs uppercase tracking-widest px-8 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400">Каталог</TabsTrigger>
        <TabsTrigger value="history" className="rounded-xl font-black text-xs uppercase tracking-widest px-8 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400">Оперативна История</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-6">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] bg-white dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
            <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8 pl-10">Абонамент</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8">Параметри</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8">Цена</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8 pr-10 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-60 text-center text-zinc-400 font-medium italic">Зареждане...</TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-60 text-center text-zinc-400 font-medium italic">Няма намерени абонаменти</TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id} className="border-zinc-100 dark:border-zinc-800/50 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                  <TableCell className="py-8 pl-10">
                    <div className="font-black text-xl text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2">{service.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {service.targetGroups.map(group => (
                        <Badge key={group} variant="outline" className="text-[9px] px-2 py-0.5 border-zinc-200 dark:border-zinc-700 font-black uppercase text-zinc-500">{group}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        {service.type} ({service.billingPeriod || "Еднократно"})
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        <div className="h-6 w-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-zinc-500" />
                        </div>
                        {service.minMembers}-{service.maxMembers === 0 ? "∞" : service.maxMembers} души
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8">
                    <div className="text-2xl font-black text-zinc-900 dark:text-white">{formatPrice(service.price)}</div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">{service.currency}</div>
                  </TableCell>
                  <TableCell className="py-8 pr-10 text-right">
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenDialog(service)}
                        className="h-12 w-12 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 text-zinc-400 transition-all active:scale-90"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(service.id)}
                        className="h-12 w-12 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-zinc-400 transition-all active:scale-90"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] p-0 rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xl text-zinc-900 dark:text-zinc-100">
          <DialogHeader className="p-10 pb-8 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-4xl font-black font-heading text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              {editingService ? "Редактирай Абонамент" : "Нов Абонамент"}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="p-10 pt-8 h-[65vh] bg-white dark:bg-zinc-950">
            <div className="space-y-12 pb-10">
              {/* Basic Info */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-10 bg-blue-600 rounded-full" />
                  <h3 className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400">Основна Информация</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Име на абонамента</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-lg font-bold"
                      placeholder="напр. Интензивно обучение"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Цена (EUR)</Label>
                    <div className="relative">
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-zinc-400">€</span>
                      <Input 
                        type="number"
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                        className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-2xl font-black pr-12"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Описание</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-h-[120px] p-6 text-zinc-700 dark:text-zinc-300 font-medium"
                    placeholder="Опишете какво включва този план..."
                  />
                </div>
              </section>

              {/* Rules & Billing */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-10 bg-emerald-500 rounded-full" />
                  <h3 className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400">Тип и Период</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Тип Услуга</Label>
                    <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800"><SelectItem value="Абонамент">Абонамент</SelectItem><SelectItem value="Еднократно плащане">Еднократно</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 ml-1">Период на таксуване</Label>
                    <Select value={formData.billingPeriod || "Месечен"} onValueChange={(val: any) => setFormData({...formData, billingPeriod: val})}>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800"><SelectItem value="Месечен">Месечен</SelectItem><SelectItem value="Годишен">Годишен</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Target Groups */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-10 bg-orange-500 rounded-full" />
                  <h3 className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400">Целеви Групи</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Деца", "Любители", "Състезатели", "Професионалисти"].map((group) => (
                    <div 
                      key={group} 
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all cursor-pointer ${
                        formData.targetGroups?.includes(group as any) 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-300"
                      }`}
                      onClick={() => toggleTargetGroup(group as any)}
                    >
                      <Checkbox 
                        id={`group-${group}`} 
                        checked={formData.targetGroups?.includes(group as any)}
                        onCheckedChange={() => toggleTargetGroup(group as any)}
                        className="hidden"
                      />
                      <Label htmlFor={`group-${group}`} className="font-black text-[10px] uppercase tracking-widest cursor-pointer">{group}</Label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rights & Policy */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-10 bg-purple-500 rounded-full" />
                  <h3 className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400">Права и Политики</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${formData.isCoachLed ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"}`}
                    onClick={() => setFormData({...formData, isCoachLed: !formData.isCoachLed})}
                  >
                    <div className="space-y-1">
                      <Label className="font-black text-sm cursor-pointer">Треньорско водене</Label>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Включен инструктор</p>
                    </div>
                    <Checkbox checked={formData.isCoachLed} onCheckedChange={(val) => setFormData({...formData, isCoachLed: val === true})} className="h-6 w-6 rounded-lg" />
                  </div>
                  <div 
                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${formData.requiresBooking ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"}`}
                    onClick={() => setFormData({...formData, requiresBooking: !formData.requiresBooking})}
                  >
                    <div className="space-y-1">
                      <Label className="font-black text-sm cursor-pointer">Изисква резервация</Label>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Предварително записване</p>
                    </div>
                    <Checkbox checked={formData.requiresBooking} onCheckedChange={(val) => setFormData({...formData, requiresBooking: val === true})} className="h-6 w-6 rounded-lg" />
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>

          <DialogFooter className="p-10 pt-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest px-10 border-zinc-200 dark:border-zinc-700 w-full sm:w-auto"
            >
              Отказ
            </Button>
            <Button 
              onClick={handleSave} 
              className="h-14 rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 font-black text-xs uppercase tracking-widest px-12 shadow-2xl w-full sm:w-auto hover:scale-[1.02] transition-transform"
            >
              Запази промените
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <SubscriptionHistory />
      </TabsContent>
    </Tabs>
  );
};
