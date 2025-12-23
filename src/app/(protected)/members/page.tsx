'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useMembers } from '@/hooks/useMembers';
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
import { useToast } from "@/components/ui/use-toast";
import { getAgeGroup } from '@/lib/utils';

const MembersPage = () => {
  const { members, isLoading, error, addMember, updateMember, deleteMember } = useMembers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace('/login');
    }
    if (error) {
        toast({ title: "Грешка при зареждане на членовете", description: error.message, variant: "destructive" });
    }
  }, [user, error, router, toast]);

  const handleSaveMember = async (data: Omit<Member, 'id'>) => {
    try {
      if (selectedMember) {
        await updateMember(selectedMember.id, data as Omit<Member, 'id'>);
      } else {
        await addMember(data);
      }
      setIsFormOpen(false);
      setSelectedMember(undefined);
    } catch (error) {
        // The hook handles the error toast, so we just log it here
        console.error("Failed to save member: ", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMember(memberToDelete.id);
      setMemberToDelete(null);
    } catch (error) {
      // The hook handles the error toast, so we just log it here
      console.error("Failed to delete member: ", error);
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

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('bg-BG');
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ 
                                member.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                                <svg className={`-ml-0.5 mr-1.5 h-2 w-2 ${ 
                                    member.status === 'active' ? 'text-green-500' : 'text-gray-500' 
                                }`} fill="currentColor" viewBox="0 0 8 8">
                                    <circle cx="4" cy="4" r="3" />
                                </svg>
                                {member.status === 'active' ? 'Активен' : 'Неактивен'}
                            </span>
                        </TableCell>
                        <TableCell>{formatDate(member.registrationDate)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(member.id)}>Досие</DropdownMenuItem>
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
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default MembersPage;
