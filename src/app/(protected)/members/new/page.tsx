'use client';

import { useRouter } from 'next/navigation';
import { addMember } from '@/services/member-service';
import { useToast } from '@/components/ui/use-toast';
import { MemberForm } from '@/components/members/member-form';
import { MemberSchema, Member } from '@/types/member.types';
import { z } from 'zod';

const MemberFormSchema = MemberSchema.omit({ id: true, name: true, registrationDate: true, updatedAt: true });
type MemberFormValues = z.infer<typeof MemberFormSchema>;

const NewMemberPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (data: MemberFormValues) => {
    try {
      const newMemberId = await addMember(data);
      toast({ title: 'Успех!', description: 'Нов член е добавен успешно.' });
      router.push(`/members/${newMemberId}`);
      router.refresh(); // Refresh the members list page
    } catch (e) {
      console.error("Failed to create member:", e);
      toast({ title: 'Грешка', description: 'Неуспешно създаване на член.', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Добавяне на нов член</h1>
      <MemberForm onSave={handleSave} onClose={handleClose} />
    </div>
  );
};

export default NewMemberPage;
