'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getAllMembers } from '@/services/member-service';
import { Member } from '@/types/member.types'; // <-- КОРЕКЦИЯ НА ИМПОРТА

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, User, Users } from 'lucide-react';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const MembersPage = () => {
    const router = useRouter();
    const { toast } = useToast();

    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const membersData = await getAllMembers();
                setMembers(membersData);
            } catch (error) {
                console.error("Грешка при зареждане на членовете:", error);
                toast({ title: "Грешка", description: "Неуспешно зареждане на списъка с членове.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembers();
    }, [toast]);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) {
            return members;
        }
        return members.filter(member =>
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [members, searchTerm]);

    const PageHeader = () => (
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h1 className="text-2xl font-bold flex items-center"><User className="mr-2"/>Членове на клуба</h1>
            <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Търсене по име или имейл..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => router.push('/members/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Добави член
                </Button>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6">
                <PageHeader />
                <div className="border rounded-lg flex items-center justify-center h-96">
                    <LoadingSpinner size={48} />
                </div>
            </div>
        );
    }
    
    if (members.length === 0) {
        return (
             <div className="p-4 sm:p-6">
                <PageHeader />
                <EmptyState 
                    Icon={Users}
                    title="Няма добавени членове"
                    description="Все още не сте добавили нито един член. Започнете, като добавите първия."
                >
                     <Button onClick={() => router.push('/members/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Добави първия член
                    </Button>
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <PageHeader />
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Име</TableHead>
                            <TableHead>Имейл</TableHead>
                            <TableHead>Група (2026)</TableHead>
                            <TableHead>Дата на регистрация</TableHead>
                            <TableHead>Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <TableRow key={member.id} onClick={() => router.push(`/members/${member.id}`)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        {member.ageGroup2026 ? (
                                            <Badge variant="outline">{member.ageGroup2026}</Badge>
                                        ) : 'N/A'}
                                    </TableCell>
                                    {/* Вече сме сигурни, че registrationDate е валиден string */}
                                    <TableCell>{new Date(member.registrationDate).toLocaleDateString('bg-BG')}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                                            {member.status === 'active' ? 'Активен' : 'Неактивен'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                        <p className="font-semibold">Няма намерени резултати</p>
                                        <p className="text-muted-foreground text-sm">Няма членове, съответстващи на търсенето за &quot;{searchTerm}&quot;.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default MembersPage;
