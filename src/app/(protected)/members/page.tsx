"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import { getAllMembers } from '@/services/member-service';
// import { Member } from '@/types/member.types';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const ITEMS_PER_PAGE = 20;

interface PageHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddMember: () => void;
}

const PageHeader = ({ searchTerm, onSearchChange, onAddMember }: PageHeaderProps) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold flex items-center"><User className="mr-2" />Членове на клуба</h1>
        <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Търсене по име или имейл..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Button onClick={onAddMember}>
                <PlusCircle className="mr-2 h-4 w-4" /> Добави член
            </Button>
        </div>
    </div>
);

const MembersPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Using SWR for automated caching and revalidation
    const { data: members = [], error, isLoading } = useSWR('members', () => getAllMembers(), {
        revalidateOnFocus: false, // Prevents excessive Firestore usage on tab switch
        dedupingInterval: 60000,   // Cache for 60 seconds
    });

    useEffect(() => {
        if (error) {
            console.error("Грешка при зареждане на членовете:", error);
            toast.error("Грешка", { description: "Неуспешно зареждане на списъка с членове." });
        }
    }, [error]);

    const filteredMembers = useMemo(() => {
        let result = members;
        if (searchTerm) {
            result = members.filter(member =>
                `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return result;
    }, [members, searchTerm]);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    const paginatedMembers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMembers, currentPage]);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6">
                <PageHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddMember={() => router.push('/members/new')} />
                <div className="border rounded-lg flex items-center justify-center h-96">
                    <LoadingSpinner size={48} />
                </div>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="p-4 sm:p-6">
                <PageHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddMember={() => router.push('/members/new')} />
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
            <PageHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddMember={() => router.push('/members/new')} />

            <div className="border rounded-lg mb-4 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Име</TableHead>
                            <TableHead>Имейл</TableHead>
                            <TableHead>Възрастова група</TableHead>
                            <TableHead>Дата на регистрация</TableHead>
                            <TableHead>Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedMembers.length > 0 ? (
                            paginatedMembers.map(member => (
                                <TableRow
                                    key={member.id}
                                    onClick={() => router.push(`/members/${member.id}`)}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        {member.ageGroup ? (
                                            <Badge variant="outline">{member.ageGroup}</Badge>
                                        ) : 'N/A'}
                                    </TableCell>
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
                                <TableCell colSpan={5} className="text-center h-24">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Показани {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} от {filteredMembers.length} членове
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Предишна
                        </Button>
                        <div className="text-sm font-medium">
                            Страница {currentPage} от {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Следваща <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;
