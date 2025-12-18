'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Member } from '@/types';
import { useMembers } from '@/hooks/useMembers';
import { getFamilyById, createFamily, addMemberToFamily, removeMemberFromFamily } from '@/services/family-service';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ManageFamilyDialog } from './manage-family-dialog';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'Името трябва да е поне 2 символа.' }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, { message: 'Фамилията трябва да е поне 2 символа.' }),
  email: z.string().email({ message: 'Невалиден имейл адрес.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneType: z.enum(['personal', 'parent']).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  educationInstitution: z.string().optional(),
  notes: z.string().optional(),
  personalId: z.string().optional(),
  registrationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
});

interface MemberFormProps {
  member?: Member;
  onSave: (data: Omit<Member, 'id'>) => Promise<void> | void;
  onClose: () => void;
}

export const MemberForm = ({ member, onSave, onClose }: MemberFormProps) => {
  const [isFamilyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { members: allMembers, loading: loadingMembers } = useMembers();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: member ? {
        ...member,
        dateOfBirth: member.dateOfBirth.split('T')[0],
        registrationDate: member.registrationDate.split('T')[0],
    } : {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneType: 'personal',
      dateOfBirth: '',
      address: '',
      status: 'active',
      educationInstitution: '',
      notes: '',
      personalId: '',
      registrationDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (member && member.familyId && allMembers.length > 0) {
        const fetchFamily = async () => {
            const family = await getFamilyById(member.familyId!);
            if (family) {
                const membersInFamily = allMembers.filter(m => family.memberIds.includes(m.id));
                setFamilyMembers(membersInFamily);
            }
        };
        fetchFamily();
    }
  }, [member, allMembers]);


  const handleSaveFamily = async (selectedMemberIds: string[]) => {
    if (!member) return;
    setIsSaving(true);

    try {
        const currentFamilyId = member.familyId;
        const memberId = member.id;

        if (!currentFamilyId && selectedMemberIds.length > 0) {
            const newFamilyId = await createFamily([memberId, ...selectedMemberIds]);
            member.familyId = newFamilyId;
        } else if (currentFamilyId) {
            const initialMemberIds = familyMembers.map(m => m.id);
            const membersToAdd = selectedMemberIds.filter(id => !initialMemberIds.includes(id));
            for (const id of membersToAdd) {
                await addMemberToFamily(currentFamilyId, id);
            }

            const membersToRemove = initialMemberIds.filter(id => !selectedMemberIds.includes(id) && id !== memberId);
            for (const id of membersToRemove) {
                await removeMemberFromFamily(currentFamilyId, id);
            }
        }

        const updatedFamily = member.familyId ? await getFamilyById(member.familyId) : null;
        if (updatedFamily) {
            const membersInFamily = allMembers.filter(m => updatedFamily.memberIds.includes(m.id));
            setFamilyMembers(membersInFamily);
        } else {
            setFamilyMembers([]);
        }
    } finally {
        setIsSaving(false);
        setFamilyDialogOpen(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
        await onSave({ ...values, familyId: member?.familyId } as Omit<Member, 'id'>);
    } finally {
        setIsSaving(false);
    }
  };

  const otherFamilyMembers = familyMembers.filter(m => m.id !== member?.id);
  const isButtonDisabled = isSaving || loadingMembers;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Име</FormLabel><FormControl><Input placeholder="Иван" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="middleName" render={({ field }) => (<FormItem><FormLabel>Презиме</FormLabel><FormControl><Input placeholder="Иванов" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Фамилия</FormLabel><FormControl><Input placeholder="Петров" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Имейл (опционално)</FormLabel><FormControl><Input type="email" placeholder="ivan.petrov@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Телефон (опционално)</FormLabel><FormControl><Input placeholder="0888123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="phoneType" render={({ field }) => (<FormItem><FormLabel>Тип на телефона</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="personal">Личен</SelectItem><SelectItem value="parent">На родител</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>Дата на раждане</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="registrationDate" render={({ field }) => (<FormItem><FormLabel>Дата на регистрация</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Статус</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Избери статус" /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Активен</SelectItem><SelectItem value="inactive">Неактивен</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="educationInstitution" render={({ field }) => (<FormItem><FormLabel>Образователна институция</FormLabel><FormControl><Input placeholder="СУ Св. Климент Охридски" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Адрес (опционално)</FormLabel><FormControl><Input placeholder="гр. София, ул. Примерна 1" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Бележки</FormLabel><FormControl><Textarea placeholder="Допълнителна информация..." {...field} /></FormControl><FormMessage /></FormItem>)} />

        {member && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Семейство</CardTitle>
                    <CardDescription>
                        Свържете този член с други членове от същото семейство (братя, сестри).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border p-4 min-h-[60px]">
                        {otherFamilyMembers.length > 0 ? (
                            <ul className="space-y-1">
                                {otherFamilyMembers.map(m => (
                                    <li key={m.id} className="text-sm font-medium">{m.firstName} {m.lastName}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                Няма свързани членове на семейството.
                            </p>
                        )}
                    </div>
                    <Button type="button" variant="outline" className="mt-4" onClick={() => setFamilyDialogOpen(true)} disabled={isButtonDisabled}>
                        {loadingMembers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Управление на семейство
                    </Button>
                </CardContent>
            </Card>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Отказ</Button>
          <Button type="submit" disabled={isButtonDisabled}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Запази
          </Button>
        </div>
      </form>

      {member && (
        <ManageFamilyDialog 
            isOpen={isFamilyDialogOpen}
            onClose={() => setFamilyDialogOpen(false)}
            onSave={handleSaveFamily}
            currentMember={member}
            allMembers={allMembers}
        />
      )}

    </Form>
  );
};
