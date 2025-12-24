'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClubService, ClubServiceHistory, SpecialRight } from '@/types';
import {
  getAllClubServices,
  createClubService,
  updateClubService,
  deleteClubService,
  getHistoryForService
} from '@/services/subscription-service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { History } from 'lucide-react';

const initialServiceState: Omit<ClubService, 'id'> = {
  name: '',
  description: '',
  price: 0,
  currency: 'BGN',
  targetGroups: [],
  type: 'Абонамент',
  billingPeriod: 'Месечен',
  isCoachLed: false,
  durationMinutes: 0,
  requiresBooking: false,
  cancellationPolicy: '',
  minMembers: 1,
  maxMembers: 1,
  specialRights: [],
  paymentRules: { window: { startDay: 1, endDay: 10 } },
};

const targetGroupOptions = ['Деца', 'Любители'];

const specialRightsConfig: { id: SpecialRight['right']; label: string }[] = [
    { id: 'kartoteka', label: 'Дава право на картотека' },
    { id: 'equipment', label: 'Дава право на екипировка' },
];

export default function ServicesPage() {
  const [services, setServices] = useState<ClubService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const [selectedService, setSelectedService] = useState<ClubService | null>(null);
  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [serviceForHistory, setServiceForHistory] = useState<ClubService | null>(null);

  const [formData, setFormData] = useState<Partial<ClubService>>(initialServiceState);
  const [updateNote, setUpdateNote] = useState('');
  const [historyLogs, setHistoryLogs] = useState<ClubServiceHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const fetchedServices = await getAllClubServices();
      setServices(fetchedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на услугите.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      // @ts-ignore
      const checked = e.target.checked;
      
      let processedValue: string | number | boolean = value;
      if (type === 'checkbox') {
          processedValue = checked;
      } else if (type === 'number') {
          processedValue = value === '' ? 0 : Number(value);
      }
      
      setFormData(prev => ({...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTargetGroupChange = (group: string, checked: boolean) => {
    setFormData(prev => {
        const currentGroups = prev.targetGroups || [];
        if (checked) {
            return { ...prev, targetGroups: [...currentGroups, group] };
        } else {
            return { ...prev, targetGroups: currentGroups.filter(g => g !== group) };
        }
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
        setFormData(prev => ({ ...prev, price: Math.round(Number(value) * 100) }));
    }
  };

  const handleSpecialRightToggle = (rightId: SpecialRight['right'], checked: boolean) => {
    setFormData(prev => {
        const currentRights = prev.specialRights || [];
        if (checked) {
            return {
                ...prev,
                specialRights: [
                    ...currentRights,
                    {
                        right: rightId,
                        description: specialRightsConfig.find(r => r.id === rightId)?.label || '',
                        trigger: { condition: 'IMMEDIATELY' }
                    }
                ]
            };
        } else {
            return { ...prev, specialRights: currentRights.filter(r => r.right !== rightId) };
        }
    });
  };

  const handleSpecialRightChange = (rightId: SpecialRight['right'], newConfig: Partial<SpecialRight['trigger']>) => {
    setFormData(prev => {
        const currentRights = prev.specialRights || [];
        return {
            ...prev,
            specialRights: currentRights.map(r => 
                r.right === rightId 
                ? { ...r, trigger: { ...r.trigger, ...newConfig } } 
                : r
            )
        };
    });
  };

  const handlePaymentRulesChange = (field: 'startDay' | 'endDay', value: string) => {
    const numValue = Number(value);
    if (numValue >= 1 && numValue <= 31) {
      setFormData(prev => ({
        ...prev,
        paymentRules: {
          window: {
            ...(prev.paymentRules?.window || { startDay: 1, endDay: 10 }),
            [field]: numValue,
          }
        }
      }));
    }
  };

  const openDialog = (service: ClubService | null) => {
    setSelectedService(service);
    setUpdateNote('');
    if (service) {
      const serviceData: Partial<ClubService> = { 
        ...service, 
        paymentRules: service.paymentRules || initialServiceState.paymentRules 
      };
      setFormData(serviceData);
    } else {
      setFormData(initialServiceState);
    }
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setServiceToDeleteId(id);
    setIsAlertOpen(true);
  };

  const handleOpenHistory = async (service: ClubService) => {
    setServiceForHistory(service);
    setIsHistoryDialogOpen(true);
    setIsHistoryLoading(true);
    try {
      const logs = await getHistoryForService(service.id);
      setHistoryLogs(logs);
    } catch (error) {
      console.error('Error fetching service history:', error);
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на историята.', variant: 'destructive' });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    try {
        const dataToSave: Omit<ClubService, 'id'> = {
            name: formData.name || '',
            price: Number(formData.price) || 0,
            currency: formData.currency || 'BGN',
            type: formData.type || 'Абонамент',
            targetGroups: formData.targetGroups || [],
            specialRights: formData.specialRights || [],
            paymentRules: formData.type === 'Абонамент' ? formData.paymentRules : undefined,
            description: formData.description || '',
            billingPeriod: formData.type === 'Абонамент' ? formData.billingPeriod : null,
            isCoachLed: formData.isCoachLed || false,
            durationMinutes: Number(formData.durationMinutes) || 0,
            requiresBooking: formData.requiresBooking || false,
            cancellationPolicy: formData.cancellationPolicy || '',
            minMembers: Number(formData.minMembers) || 1,
            maxMembers: Number(formData.maxMembers) || 0,
        };

        if (selectedService) {
            await updateClubService(selectedService.id, dataToSave, updateNote);
            toast({ title: 'Успех', description: 'Услугата е актуализирана.' });
        } else {
            await createClubService(dataToSave);
            toast({ title: 'Успех', description: 'Услугата е създадена.' });
        }
        fetchServices();
        setIsDialogOpen(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Възникна неизвестна грешка';
        console.error('Error saving service:', error);
        toast({ title: 'Грешка', description: `Неуспешен запис: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (serviceToDeleteId) {
      try {
        await deleteClubService(serviceToDeleteId);
        toast({ title: 'Успех', description: 'Услугата е изтрита.' });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({ title: 'Грешка', description: 'Неуспешно изтриване на услугата.', variant: 'destructive' });
      } finally {
        setIsAlertOpen(false);
        setServiceToDeleteId(null);
      }
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Управление на услуги</h1>
          <Button onClick={() => openDialog(null)}>Добави нова услуга</Button>
        </div>

        {isLoading ? <p>Зареждане...</p> : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col">
                 <CardHeader>
                   <CardTitle>{service.name}</CardTitle>
                   <CardDescription>{service.type} | {(service.targetGroups || []).join(', ')}</CardDescription>
                 </CardHeader>
                 <CardContent className="flex-grow">
                   <p className="text-2xl font-bold">{(service.price / 100).toFixed(2)} {service.currency}</p>
                   {service.billingPeriod && <p className="text-sm text-gray-500">Таксуване: {service.billingPeriod}</p>}
                   {service.paymentRules?.window && <p className="text-xs text-gray-500">Плащане: {service.paymentRules.window.startDay} - {service.paymentRules.window.endDay} число</p>}
                   <div className="mt-4 pt-4 border-t">
                     {service.specialRights?.map(right => (
                        <p key={right.right} className="text-sm">✓ {right.description}</p>
                     ))}
                   </div>
                 </CardContent>
                 <div className="flex justify-end space-x-2 p-4 bg-gray-50 border-t">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(service)}><History className="h-5 w-5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => openDialog(service)}>Редактирай</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(service.id)}>Изтрий</Button>
                 </div>
               </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-dashed border-2 rounded-lg">
            <p className="text-gray-500">Все още няма добавени услуги.</p>
            <p className="text-gray-400 mt-2">Натиснете бутона 'Добави нова услуга', за да започнете.</p>
           </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <ScrollArea className="max-h-[90vh]">
            <div className='p-6'>
              <DialogHeader className='mb-4'>
                <DialogTitle>{selectedService ? 'Редактиране на услуга' : 'Създаване на услуга'}</DialogTitle>
                <DialogDescription>Попълнете всички детайли за услугата. Натиснете 'Запис', когато сте готови.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6">
                <div className='grid grid-cols-2 gap-4'>
                  <div className="space-y-2"><Label htmlFor="name">Име на услугата</Label><Input id="name" name="name" value={formData.name} onChange={handleFormChange} /></div>
                  <div className="space-y-2"><Label htmlFor='type'>Тип на плащането</Label><Select name='type' value={formData.type} onValueChange={v => handleSelectChange('type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='Абонамент'>Абонамент</SelectItem><SelectItem value='Еднократно плащане'>Еднократно плащане</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Описание</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleFormChange} /></div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className="space-y-2"><Label htmlFor="price">Цена</Label><Input id="price" name="price" type="number" value={(formData.price / 100).toFixed(2)} onChange={handlePriceChange} /></div>
                  <div className="space-y-2"><Label htmlFor='currency'>Валута</Label><Select name='currency' value={formData.currency} onValueChange={v => handleSelectChange('currency',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='BGN'>BGN</SelectItem><SelectItem value='EUR'>EUR</SelectItem></SelectContent></Select></div>
                </div>
                {formData.type === 'Абонамент' && (
                  <div className="space-y-4 rounded-md border p-4">
                    <h4 className='text-sm font-medium'>Настройки за абонамент</h4>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor='billingPeriod'>Период на таксуване</Label>
                        <Select name='billingPeriod' value={formData.billingPeriod || ''} onValueChange={v => handleSelectChange('billingPeriod',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='Месечен'>Месечен</SelectItem><SelectItem value='Годишен'>Годишен</SelectItem></SelectContent></Select>
                      </div>
                      <div className='space-y-2'>
                        <Label>Прозорец за плащане (ден от месеца)</Label>
                        <div className="grid grid-cols-2 gap-4">
                           <Input type="number" placeholder="Начален ден" value={formData.paymentRules?.window?.startDay || ''} onChange={e => handlePaymentRulesChange('startDay', e.target.value)} />
                           <Input type="number" placeholder="Краен ден" value={formData.paymentRules?.window?.endDay || ''} onChange={e => handlePaymentRulesChange('endDay', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2"><Label>Целеви групи</Label><div className='flex items-center space-x-4'>{targetGroupOptions.map(group => (<div key={group} className='flex items-center space-x-2'><Checkbox id={`group-${group}`} checked={(formData.targetGroups || []).includes(group)} onCheckedChange={c => handleTargetGroupChange(group, c as boolean)} /><Label htmlFor={`group-${group}`}>{group}</Label></div>))}</div></div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'><Label htmlFor="minMembers">Мин. членове</Label><Input id="minMembers" name="minMembers" type="number" value={formData.minMembers} onChange={handleFormChange} /></div>
                  <div className='space-y-2'><Label htmlFor="maxMembers">Макс. членове (0 за без лимит)</Label><Input id="maxMembers" name="maxMembers" type="number" value={formData.maxMembers || 0} onChange={handleFormChange} /></div>
                  <div className='space-y-2'><Label htmlFor="durationMinutes">Продължителност (мин.)</Label><Input id="durationMinutes" name="durationMinutes" type="number" value={formData.durationMinutes || 0} onChange={handleFormChange} /></div>
                </div>
                <div className='grid grid-cols-2 gap-4 items-center'><div className='flex items-center space-x-2'><Checkbox id='isCoachLed' name='isCoachLed' checked={formData.isCoachLed} onCheckedChange={c => setFormData(p => ({...p, isCoachLed: c as boolean}))} /><Label htmlFor='isCoachLed'>Водена от треньор</Label></div><div className='flex items-center space-x-2'><Checkbox id='requiresBooking' name='requiresBooking' checked={formData.requiresBooking} onCheckedChange={c => setFormData(p => ({...p, requiresBooking: c as boolean}))} /><Label htmlFor='requiresBooking'>Изисква записване</Label></div></div>
                <div className="space-y-2"><Label htmlFor="cancellationPolicy">Политика за анулиране</Label><Textarea id="cancellationPolicy" name="cancellationPolicy" value={formData.cancellationPolicy || ''} onChange={handleFormChange} /></div>
                
                <div className='space-y-4 rounded-md border p-4'>
                    <h4 className='text-sm font-medium mb-4'>Специални права</h4>
                    <div className='grid gap-6'>
                        {specialRightsConfig.map(({ id, label }) => {
                            const right = formData.specialRights?.find(r => r.right === id);
                            const isEnabled = !!right;

                            return (
                                <div key={id} className='flex flex-col space-y-4'>
                                    <div className='flex items-center space-x-2'>
                                        <Checkbox 
                                            id={`right-${id}`}
                                            checked={isEnabled}
                                            onCheckedChange={(c) => handleSpecialRightToggle(id, c as boolean)}
                                        />
                                        <Label htmlFor={`right-${id}`}>{label}</Label>
                                    </div>
                                    {isEnabled && (
                                        <div className='grid grid-cols-2 gap-4 pl-6'>
                                            <Select 
                                                value={right.trigger.condition}
                                                onValueChange={v => handleSpecialRightChange(id, { condition: v as SpecialRight['trigger']['condition'] })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='IMMEDIATELY'>Веднага</SelectItem>
                                                    <SelectItem value='AFTER_N_PAYMENTS'>След N плащания</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {right.trigger.condition === 'AFTER_N_PAYMENTS' && (
                                                <Input 
                                                    type='number' 
                                                    placeholder='Брой плащания' 
                                                    value={right.trigger.paymentCount || 1}
                                                    onChange={e => handleSpecialRightChange(id, { paymentCount: Number(e.target.value) || 1})}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selectedService && <div className="space-y-2 pt-4 border-t mt-4"><Label htmlFor="updateNote">Бележка към промяната (описва причината)</Label><Textarea id="updateNote" name="updateNote" value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} placeholder="Напр. Актуализация на цените за новия сезон..."/></div>}
              </div>
              <DialogFooter className='p-6 pt-2'><DialogClose asChild><Button variant="outline">Отказ</Button></DialogClose><Button onClick={handleSave}>Запис</Button></DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Наистина ли искате да изтриете тази услуга?</AlertDialogTitle>
                <AlertDialogDescription>
                    Това действие е необратимо. Всички данни за услугата ще бъдат изтрити. Свързаните абонаменти на членове НЯМА да бъдат изтрити, но може да се наложи да ги актуализирате ръчно.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Отказ</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Изтрий</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История за "{serviceForHistory?.name}"</DialogTitle>
            <DialogDescription>Хронологичен списък с всички промени по тази услуга.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-4">
            {isHistoryLoading ? <p>Зареждане на историята...</p> : historyLogs.length > 0 ? (
              <div className="space-y-6">
                {historyLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><History className="w-5 h-5 text-gray-600"/></div></div>
                    <div className="flex-grow border-b pb-4">
                        <div className='flex justify-between items-center'>
                            <p className="font-semibold text-gray-800">{log.userName}</p>
                            <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('bg-BG')}</p>
                        </div>
                        {log.changes && <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-2 rounded-md">{log.changes}</pre>}
                        {log.note && <div className="mt-2 text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3"><p>{log.note}</p></div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className='text-center text-gray-500 py-8'>Няма намерена история за тази услуга.</p>}
          </ScrollArea>
          <DialogFooter><DialogClose asChild><Button variant="outline">Затвори</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
