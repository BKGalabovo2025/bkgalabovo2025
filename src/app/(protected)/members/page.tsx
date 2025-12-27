'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { getAllMembers } from '@/services/member-service';
import { Member } from '@/types';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, User } from 'lucide-react';

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
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h1 className="text-2xl font-bold flex items-center"><User className="mr-2"/>Членове на клуба</h1>
                <div className="flex w-full sm:w-auto gap-2">
                    <Input 
                        placeholder="Търсене по име или имейл..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                    />
                    <Button onClick={() => router.push('/members/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Добави член
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Име</TableHead>
                            <TableHead>Имейл</TableHead>
                            <TableHead>Дата на регистрация</TableHead>
                            <TableHead>Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <TableRow key={member.id} onClick={() => router.push(`/members/${member.id}`)} className="cursor-pointer">
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.email || 'N/A'}</TableCell>
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
                                    {searchTerm ? `Няма намерени членове за "${searchTerm}"` : "Няма добавени членове."}
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
