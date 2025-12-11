
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberForm } from '@/components/members/member-form';
import { getMembers, addMember, updateMember, deleteMember } from '@/services/member-service';
import { useToast } from "@/components/ui/use-toast";

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = await getMembers();
        setMembers(membersData);
      } catch (error) {
        console.error("Firebase Error: ", error);
        toast({ title: "Грешка при зареждане на членовете", description: "Моля, опитайте отново.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [toast]);

  const handleSaveMember = async (data: Omit<Member, 'id'>) => {
    try {
      if (selectedMember) {
        await updateMember(selectedMember.id, data);
        setMembers(members.map(m => m.id === selectedMember.id ? { ...m, ...data } : m));
        toast({ title: "Успешно обновяване", description: "Данните на члена бяха актуализирани." });
      } else {
        const newId = await addMember(data);
        const newMember = { ...data, id: newId, registrationDate: new Date().toISOString() };
        setMembers([...members, newMember]);
        toast({ title: "Членът е добавен", description: "Новият член беше успешно създаден." });
      }
      setIsFormOpen(false);
      setSelectedMember(undefined);
    } catch (error) {
        console.error("Firebase Error: ", error);
        toast({ title: "Грешка при запис", description: "Възникна грешка при запазването на данните.", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този член?")) return;

    try {
      await deleteMember(id);
      setMembers(members.filter(m => m.id !== id));
      toast({ title: "Членът е изтрит", description: "Данните бяха успешно изтрити от системата." });
    } catch (error) {
      console.error("Firebase Error: ", error);
      toast({ title: "Грешка при изтриване", description: "Възникна грешка при изтриването на члена.", variant: "destructive" });
    }
  }
  
  const handleViewDetails = (id: string) => {
    router.push(`/members/${id}`);
  }

  const openFormForEdit = (member: Member) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const openFormForCreate = () => {
    setSelectedMember(undefined);
    setIsFormOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Управление на членове</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openFormForCreate}>Добави член</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedMember ? 'Редактиране на член' : 'Добавяне на нов член'}</DialogTitle>
              <DialogDescription>
                Попълнете данните в полетата по-долу. Натиснете "Запази", когато сте готови.
              </DialogDescription>
            </DialogHeader>
            <MemberForm 
              member={selectedMember} 
              onSave={handleSaveMember} 
              onClose={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Зареждане на данни...</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Имейл</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата на регистрация</TableHead>
                <TableHead><span className="sr-only">Действия</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length > 0 ? members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(member.registrationDate).toLocaleDateString('bg-BG')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Отвори меню</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(member.id)}>Преглед</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openFormForEdit(member)}>Редактирай</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteMember(member.id)}>Изтрий</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    Няма намерени членове. Започнете, като добавите нов член.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
