
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClubService } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

// A new component for the submit button that shows a pending state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
      Запази услугата
    </Button>
  );
}


export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createClubService, initialState);

  const [serviceType, setServiceType] = useState<'Абонамент' | 'Еднократно плащане'>('Абонамент');
  const [grantsLicense, setGrantsLicense] = useState(false);
  const [licenseCondition, setLicenseCondition] = useState<'Веднага' | 'След N плащания'>('След N плащания');
  const [grantsApparel, setGrantsApparel] = useState(false);
  const [apparelCondition, setApparelCondition] = useState<'Веднага' | 'След N плащания'>('След N плащания');

  useEffect(() => {
    if (state?.message) {
        toast({
            title: state.success ? "Успех!" : "Грешка",
            description: state.message,
            variant: state.success ? 'default' : 'destructive',
        });

        if (state.success) {
            // Redirect only on success
            router.push('/finances/services');
        }
    }
}, [state, toast, router]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Добавяне на нова услуга</h1>
      <form action={formAction} className="space-y-8 max-w-2xl">
        
        <Card>
          <CardHeader><CardTitle>Основна информация</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Име на услугата</Label>
              <Input id="name" name="name" placeholder="Напр. Индивидуален месечен абонамент" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" placeholder="Въведете подробно описание на услугата..." rows={5} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (в EUR)</Label>
                <Input id="price" name="price" type="number" placeholder="Напр. 20.00" required step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Валута</Label>
                <Input id="currency" name="currency" value="EUR" readOnly className="bg-gray-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Насоченост и Тип</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4">
              <div className="space-y-3">
                  <Label>Целева група (една или повече)</Label>
                  <div className="flex items-center space-x-4 pt-2">
                      <div className="flex items-center space-x-2">
                          <Checkbox id="targetGroup-children" name="targetGroups" value="Деца" />
                          <Label htmlFor="targetGroup-children" className="font-normal">Деца</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <Checkbox id="targetGroup-amateurs" name="targetGroups" value="Любители" />
                          <Label htmlFor="targetGroup-amateurs" className="font-normal">Любители</Label>
                      </div>
                  </div>
              </div>
              <div className="space-y-3">
                  <Label>Тип на услугата</Label>
                  <RadioGroup name="type" required value={serviceType} onValueChange={(value) => setServiceType(value as any)} className="pt-2">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Абонамент" id="type-subscription" />
                          <Label htmlFor="type-subscription" className="font-normal">Абонамент</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Еднократно плащане" id="type-one-time" />
                          <Label htmlFor="type-one-time" className="font-normal">Еднократно плащане</Label>
                      </div>
                  </RadioGroup>
              </div>
          </CardContent>
        </Card>


        {/* -- УСЛОВНИ ПОЛЕТА -- */}
        {serviceType === 'Абонамент' && (
          <Card className="animate-in fade-in">
            <CardHeader><CardTitle>Настройки за абонамент</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label>Период на таксуване</Label>
                  <Select name="billingPeriod" defaultValue="Месечен">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Месечен">Месечен</SelectItem>
                          <SelectItem value="Годишен">Годишен</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              
              <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                      <Label htmlFor="grantsLicense">Дава право на картотека</Label>
                      <Checkbox id="grantsLicense" name="grantsLicense" checked={grantsLicense} onCheckedChange={(checked: CheckedState) => setGrantsLicense(checked === true)} />
                  </div>
                  {grantsLicense && (
                      <div className="space-y-2 pl-2 pt-2 animate-in fade-in">
                          <Label>Условие за получаване</Label>
                          <Select name="licenseCondition" value={licenseCondition} onValueChange={(val) => setLicenseCondition(val as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="След N плащания">След N плащания</SelectItem>
                                <SelectItem value="Веднага">Веднага</SelectItem>
                            </SelectContent>
                          </Select>
                          {licenseCondition === 'След N плащания' && (
                            <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                                <Input name="licensePaymentCount" type="number" className="w-24" placeholder="Брой" />
                                <span>месечни плащания</span>
                            </div>
                          )}
                      </div>
                  )}
              </div>

              <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                      <Label htmlFor="grantsApparel">Дава право на екипировка</Label>
                      <Checkbox id="grantsApparel" name="grantsApparel" checked={grantsApparel} onCheckedChange={(checked: CheckedState) => setGrantsApparel(checked === true)} />
                  </div>
                  {grantsApparel && (
                      <div className="space-y-2 pl-2 pt-2 animate-in fade-in">
                          <Label>Условие за получаване</Label>
                          <Select name="apparelCondition" value={apparelCondition} onValueChange={(val) => setApparelCondition(val as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="След N плащания">След N плащания</SelectItem>
                                <SelectItem value="Веднага">Веднага</SelectItem>
                            </SelectContent>
                          </Select>
                          {apparelCondition === 'След N плащания' && (
                            <div className="flex items-center space-x-2 pt-2 animate-in fade-in">
                                <Input name="apparelPaymentCount" type="number" className="w-24" placeholder="Брой" />
                                <span>месечни плащания</span>
                            </div>
                          )}
                      </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {serviceType === 'Еднократно плащане' && (
          <Card className="animate-in fade-in">
            <CardHeader><CardTitle>Настройки за еднократно плащане</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Продължителност (в минути)</Label>
                  <Input id="durationMinutes" name="durationMinutes" type="number" placeholder="Напр. 60" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4 pt-4">
            <SubmitButton />
        </div>
      </form>
    </div>
  );
}
