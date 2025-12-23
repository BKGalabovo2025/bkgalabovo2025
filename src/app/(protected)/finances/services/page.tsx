'use client';

import { useState, useEffect } from 'react';
import { ClubService } from '@/types';
import {
  getAllClubServices,
  createClubService,
  updateClubService,
  deleteClubService,
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
  grantsLicense: false,
  licenseCondition: 'Веднага',
  licensePaymentCount: 0,
  grantsApparel: false,
  apparelCondition: 'Веднага',
  apparelPaymentCount: 0,
};

const targetGroupOptions = ['Деца', 'Любители'];

export default function ServicesPage() {
  const [services, setServices] = useState<ClubService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ClubService | null>(
    null
  );
  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ClubService, 'id'>>(initialServiceState);
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
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на услугите.',
        variant: 'destructive',
      });
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

  const openDialog = (service: ClubService | null) => {
    setSelectedService(service);
    if (service) {
      setFormData({...initialServiceState, ...service});
    } else {
      setFormData(initialServiceState);
    }
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setServiceToDeleteId(id);
    setIsAlertOpen(true);
  };

  const handleSave = async () => {
    try {
      const dataToSave: Omit<ClubService, 'id'> = {
          ...formData,
          price: Number(formData.price) || 0,
          durationMinutes: Number(formData.durationMinutes) || null,
          minMembers: Number(formData.minMembers) || 1,
          maxMembers: Number(formData.maxMembers) || null,
          licensePaymentCount: Number(formData.licensePaymentCount) || null,
          apparelPaymentCount: Number(formData.apparelPaymentCount) || null,
          billingPeriod: formData.type === 'Абонамент' ? formData.billingPeriod : undefined,
      };

      if (selectedService) {
        await updateClubService(selectedService.id, dataToSave);
        toast({ title: 'Успех', description: 'Услугата е актуализирана.' });
      } else {
        // @ts-ignore
        await createClubService(dataToSave);
        toast({ title: 'Успех', description: 'Услугата е създадена.' });
      }
      fetchServices();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Грешка',
        description: `Неуспешен запис на услугата: ${error.message}`,
        variant: 'destructive',
      });
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
        toast({
          title: 'Грешка',
          description: 'Неуспешно изтриване на услугата.',
          variant: 'destructive',
        });
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

        {isLoading ? (
          <p>Зареждане...</p>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col">
                 <CardHeader>
                   <CardTitle>{service.name}</CardTitle>
                   <CardDescription>
                     {service.type} | {service.targetGroups.join(', ')}
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="flex-grow">
                   <p className="text-2xl font-bold">
                     {(service.price / 100).toFixed(2)} {service.currency}
                   </p>
                   {service.billingPeriod && (
                     <p className="text-sm text-gray-500">
                       Таксуване: {service.billingPeriod}
                     </p>
                   )}
                   <div className="mt-4 pt-4 border-t">
                     {service.grantsLicense && <p className="text-sm">✓ Право на картотека</p>}
                     {service.grantsApparel && <p className="text-sm">✓ Право на екипировка</p>}
                   </div>
                 </CardContent>
                 <div className="flex justify-end space-x-2 p-4">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => openDialog(service)}
                     >
                       Редактирай
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={() => openDeleteConfirm(service.id)}
                     >
                       Изтрий
                     </Button>
                   </div>
               </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-dashed border-2 rounded-lg">
            <p className="text-gray-500">Все още няма добавени услуги.</p>
             <p className="text-gray-400 mt-2">
               Натиснете бутона 'Добави нова услуга', за да започнете.
             </p>
           </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <ScrollArea className="max-h-[90vh]">
            <div className='p-6'>
            <DialogHeader className='mb-4'>
              <DialogTitle>
                {selectedService ? 'Редактиране на услуга' : 'Създаване на услуга'}
              </DialogTitle>
              <DialogDescription>
                  Попълнете всички детайли за услугата. Натиснете 'Запис', когато сте готови.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">

              <div className='grid grid-cols-2 gap-4'>
                  <div className="space-y-2">
                    <Label htmlFor="name">Име на услугата</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor='type'>Тип на плащането</Label>
                    <Select name='type' value={formData.type} onValueChange={v => handleSelectChange('type',v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='Абонамент'>Абонамент</SelectItem>
                            <SelectItem value='Еднократно плащане'>Еднократно плащане</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" name="description" value={formData.description || ''} onChange={handleFormChange} />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className="space-y-2">
                    <Label htmlFor="price">Цена</Label>
                    <Input id="price" name="price" type="number" value={(formData.price / 100).toFixed(2)} onChange={handlePriceChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor='currency'>Валута</Label>
                    <Select name='currency' value={formData.currency} onValueChange={v => handleSelectChange('currency',v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='BGN'>BGN</SelectItem>
                            <SelectItem value='EUR'>EUR</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              {formData.type === 'Абонамент' && (
                <div className="space-y-2">
                    <Label htmlFor='billingPeriod'>Период на таксуване</Label>
                    <Select name='billingPeriod' value={formData.billingPeriod || ''} onValueChange={v => handleSelectChange('billingPeriod',v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='Месечен'>Месечен</SelectItem>
                            <SelectItem value='Годишен'>Годишен</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Целеви групи</Label>
                <div className='flex items-center space-x-4'>
                    {targetGroupOptions.map(group => (
                        <div key={group} className='flex items-center space-x-2'>
                            <Checkbox 
                                id={`group-${group}`}
                                checked={(formData.targetGroups || []).includes(group)}
                                onCheckedChange={c => handleTargetGroupChange(group, c as boolean)}
                            />
                            <Label htmlFor={`group-${group}`}>{group}</Label>
                        </div>
                    ))}
                </div>
              </div>
              
              <div class='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor="minMembers">Мин. членове</Label>
                  <Input id="minMembers" name="minMembers" type="number" value={formData.minMembers} onChange={handleFormChange} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor="maxMembers">Макс. членове (0 за без лимит)</Label>
                  <Input id="maxMembers" name="maxMembers" type="number" value={formData.maxMembers || 0} onChange={handleFormChange} />
                </div>
                 <div className='space-y-2'>
                  <Label htmlFor="durationMinutes">Продължителност (мин.)</Label>
                  <Input id="durationMinutes" name="durationMinutes" type="number" value={formData.durationMinutes || 0} onChange={handleFormChange} />
                </div>
              </div>

              <div class='grid grid-cols-2 gap-4 items-center'>
                  <div className='flex items-center space-x-2'>
                      <Checkbox id='isCoachLed' name='isCoachLed' checked={formData.isCoachLed} onCheckedChange={c => setFormData(p => ({...p, isCoachLed: c as boolean}))} />
                      <Label htmlFor='isCoachLed'>Водена от треньор</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                      <Checkbox id='requiresBooking' name='requiresBooking' checked={formData.requiresBooking} onCheckedChange={c => setFormData(p => ({...p, requiresBooking: c as boolean}))} />
                      <Label htmlFor='requiresBooking'>Изисква записване</Label>
                  </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="cancellationPolicy">Политика за анулиране</Label>
                  <Textarea id="cancellationPolicy" name="cancellationPolicy" value={formData.cancellationPolicy || ''} onChange={handleFormChange} />
              </div>

              <div className='space-y-4 rounded-md border p-4'>
                  <h4 class='text-sm font-medium mb-4'>Специални права</h4>
                  <div class='grid gap-6'>
                    <div class='flex flex-col space-y-4'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox id='grantsLicense' name='grantsLicense' checked={formData.grantsLicense} onCheckedChange={c => setFormData(p => ({...p, grantsLicense: c as boolean, licenseCondition: 'Веднага', licensePaymentCount: 0}))} />
                            <Label htmlFor='grantsLicense'>Дава право на картотека</Label>
                        </div>
                        {formData.grantsLicense && (
                           <div class='grid grid-cols-2 gap-4 pl-6'>
                                <Select name='licenseCondition' value={formData.licenseCondition || 'Веднага'} onValueChange={v => handleSelectChange('licenseCondition', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='Веднага'>Веднага</SelectItem>
                                        <SelectItem value='След N плащания'>След N плащания</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.licenseCondition === 'След N плащания' && (
                                    <Input name='licensePaymentCount' type='number' placeholder='Брой плащания' value={formData.licensePaymentCount || 1} onChange={handleFormChange} />
                                )}
                           </div>
                        )}
                    </div>
                    <div class='flex flex-col space-y-4'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox id='grantsApparel' name='grantsApparel' checked={formData.grantsApparel} onCheckedChange={c => setFormData(p => ({...p, grantsApparel: c as boolean, apparelCondition: 'Веднага', apparelPaymentCount: 0}))} />
                            <Label htmlFor='grantsApparel'>Дава право на екипировка</Label>
                        </div>
                         {formData.grantsApparel && (
                           <div class='grid grid-cols-2 gap-4 pl-6'>
                                <Select name='apparelCondition' value={formData.apparelCondition || 'Веднага'} onValueChange={v => handleSelectChange('apparelCondition', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='Веднага'>Веднага</SelectItem>
                                        <SelectItem value='След N плащания'>След N плащания</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.apparelCondition === 'След N плащания' && (
                                    <Input name='apparelPaymentCount' type='number' placeholder='Брой плащания' value={formData.apparelPaymentCount || 1} onChange={handleFormChange} />
                                )}
                           </div>
                        )}
                    </div>
                  </div>
              </div>

            </div>
            <DialogFooter className='p-6 pt-2'>
              <DialogClose asChild>
                <Button variant="outline">Отказ</Button>
              </DialogClose>
              <Button onClick={handleSave}>Запис</Button>
            </DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете тази услуга? Това действие
              не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
