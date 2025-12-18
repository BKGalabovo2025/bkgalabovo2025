
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2, Users } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
import { MemberForm } from '@/components/members/member-form';
import { getMembers, addMember, updateMember, deleteMember } from '@/services/member-service';
import { useToast } from "@/components/ui/use-toast";
import { getAgeGroup } from '@/lib/utils';

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const membersData = await getMembers();
      setMembers(membersData);
    } catch (error) {
      console.error("Грешка от Firebase: ", error);
      toast({ title: "Грешка при зареждане на членовете", description: "Моля, опитайте отново.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      router.replace('/login');
      return;
    }

    if (user) {
      fetchMembers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const handleSaveMember = async (data: Omit<Member, 'id'>) => {
    try {
      if (selectedMember) {
        await updateMember(selectedMember.id, data as Omit<Member, 'id'>);
        toast({ title: "Успешно обновяване", description: "Данните на члена бяха актуализирани." });
      } else {
        await addMember(data);
        toast({ title: "Членът е добавен", description: "Новият член беше успешно създаден." });
      }
      setIsFormOpen(false);
      setSelectedMember(undefined);
      await fetchMembers(); // Re-fetch data to reflect all changes
    } catch (error) {
        console.error("Грешка от Firebase: ", error);
        toast({ title: "Грешка при запис", description: "Възникна грешка при запазването на данните.", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMember(memberToDelete.id);
      setMembers(members.filter(m => m.id !== memberToDelete.id));
      toast({ title: "Членът е изтрит", description: "Данните бяха успешно изтрити от системата." });
      setMemberToDelete(null);
    } catch (error) {
      console.error("Грешка от Firebase: ", error);
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

  if (isLoading || !user) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Зареждане на данни...</p>
        </div>
    );
  }

  return (
    <TooltipProvider>
        <div>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Управление на членове</h1>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={openFormForCreate}>Добави член</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
        
        <AlertDialog>
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Възрастова група</TableHead>
                    <TableHead>Имейл</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата на регистрация</TableHead>
                    <TableHead><span className="sr-only">Действия</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {members.length > 0 ? members.map((member) => {
                    const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
                    const phoneInfo = member.phone ? (
                    <span>
                        {member.phone}
                        <span className="text-muted-foreground ml-1">
                        ({member.phoneType === 'parent' ? 'родител' : 'личен'})
                        </span>
                    </span>
                    ) : null;

                    const familyMembers = member.familyId
                        ? members.filter(m => m.id !== member.id && m.familyId === member.familyId)
                        : [];

                    return (
                    <TableRow key={member.id}>
                        <TableCell className="font-medium">
                            <div className='flex items-center gap-2'>
                                <span>{fullName}</span>
                                {familyMembers.length > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Users className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className='font-semibold'>Свързани членове:</p>
                                            <ul className='list-inside list-disc'>
                                                {familyMembers.map(fm => (
                                                    <li key={fm.id}>{`${fm.firstName} ${fm.lastName}`}</li>
                                                ))}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{getAgeGroup(member.dateOfBirth)}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{phoneInfo}</TableCell>
                        <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
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
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={() => setMemberToDelete(member)}>Изтрий</DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    );
                }) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                        Няма намерени членове. Започнете, като добавите нов член.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Наистина ли искате да изтриете този член?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Това действие е необратимо. Данните за {memberToDelete && `${memberToDelete.firstName} ${memberToDelete.lastName}`} ще бъдат изтрити завинаги от сървърите.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Отказ</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</Aler