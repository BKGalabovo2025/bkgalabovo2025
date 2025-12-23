'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllMembers } from '@/services/member-service';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2 } from 'lucide-react';

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const allMembers = await getAllMembers();
        // Сортираме членовете по дата на регистрация, най-новите първи
        allMembers.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
        setMembers(allMembers);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Зареждане на членове...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Членове на клуба</h1>
          <p className="text-muted-foreground">Списък с всички регистрирани членове.</p>
        </div>
        {/* Този бутон временно ще води към несъществуваща страница, докато не я създадем */}
        <Button onClick={() => router.push('/members/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добави нов член
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell w-[80px]">Аватар</TableHead>
                <TableHead>Име</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden md:table-cell">Дата на регистрация</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length > 0 ? (
                members.map((member) => (
                  <TableRow key={member.id} className="cursor-pointer" onClick={() => router.push(`/members/${member.id}`)}>
                    <TableCell className="hidden md:table-cell">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                        <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                      <div className="text-sm text-muted-foreground break-all">{member.email || 'Няма имейл'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'destructive'}>
                        {member.status === 'active' ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(member.registrationDate).toLocaleDateString('bg-BG')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/members/${member.id}`); }}>
                        Преглед
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Няма намерени членове. Натиснете бутона горе, за да добавите първия.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersPage;
