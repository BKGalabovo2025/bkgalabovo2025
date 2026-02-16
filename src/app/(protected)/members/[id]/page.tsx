'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemberProfile } from '@/hooks/useMemberProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO, differenceInYears } from 'date-fns';
import { User, Mail, Phone, Calendar, Home, Users, ArrowLeft, FileEdit } from 'lucide-react';
import { getInitials, formatFullName } from '@/lib/utils'; // Import from utils

// #region Helpers
const getAgeGroup = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'N/A';
    const age = differenceInYears(new Date(), parseISO(dateOfBirth));
    if (age < 18) return 'Дете';
    if (age >= 18 && age < 65) return 'Възрастен';
    return 'Пенсионер';
};
// #endregion

// #region Sub-components
const DetailRow = ({ icon, label, value, children }: { icon: React.ReactNode, label: string, value?: string | null, children?: React.ReactNode }) => (
    <div className="flex items-start p-3 border-b">
        <div className="flex items-center w-1/3 text-sm text-muted-foreground">
            {icon}
            <span className="ml-2">{label}:</span>
        </div>
        <div className="w-2/3 text-sm font-medium">
            {children || value || 'Няма данни'}
        </div>
    </div>
);

const MemberProfileHeader = ({ member }: { member: any }) => {
    const router = useRouter();
    const fullName = formatFullName(member);

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.push('/members')}><ArrowLeft className="mr-2 h-4 w-4"/> Всички членове</Button>
                <Link href={`/members/${member.id}/edit`} passHref>
                    <Button><FileEdit className="mr-2 h-4 w-4" /> Редактирай</Button>
                </Link>
            </div>
            <Card>
                <CardContent className="p-4 flex items-center space-x-4">
                    <Avatar className="h-16 w-16 text-xl">
                        <AvatarImage src={member.avatarUrl ?? undefined} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{fullName}</h1>
                        <p className="text-muted-foreground">Статус: <span className="font-semibold text-primary">{member.status}</span></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const PersonalDataTab = ({ member, familyMembers }: { member: any, familyMembers: any[] }) => (
    <Card>
        <CardContent className="p-0">
            <DetailRow icon={<Mail size={16}/>} label="Имейл" value={member.email} />
            <DetailRow icon={<Phone size={16}/>} label="Телефон" value={member.phone} />
            <DetailRow icon={<Phone size={16}/>} label="Тип на телефона" value={member.phoneType === 'parent' ? 'На родител' : 'Личен'} />
            <DetailRow icon={<Calendar size={16}/>} label="Дата на раждане" value={member.dateOfBirth ? format(parseISO(member.dateOfBirth), 'dd.MM.yyyy г.') : null} />
            <DetailRow icon={<User size={16}/>} label="Възрастова група" value={getAgeGroup(member.dateOfBirth)} />
            <DetailRow icon={<Calendar size={16}/>} label="Дата на регистрация" value={format(parseISO(member.registrationDate), 'dd.MM.yyyy г.')} />
            <DetailRow icon={<Home size={16}/>} label="Адрес" value={member.address} />
            
            <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center"><Users className="mr-2"/>Членове на семейството</h3>
                {familyMembers.length > 0 ? (
                    <ul className="space-y-3">
                        {familyMembers.map(fm => (
                            <li key={fm.id} className="flex items-center space-x-3 p-2 rounded-md border">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={fm.avatarUrl ?? undefined} alt={formatFullName(fm)} />
                                    <AvatarFallback>{getInitials(formatFullName(fm))}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{formatFullName(fm)}</p>
                                    <p className="text-xs text-muted-foreground">{fm.email}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Няма свързани членове.</p>
                )}
            </div>
        </CardContent>
    </Card>
);

const SubscriptionsTab = ({ subscriptions }: { subscriptions: any[] }) => (
     <Card>
        <CardContent className="pt-6">
            {subscriptions.length > 0 ? (
                <ul className="space-y-4">
                    {subscriptions.map(sub => (
                        <li key={sub.id} className="border p-4 rounded-lg">
                            <p className="font-semibold text-md">{sub.serviceName}</p>
                             <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                <span>{format(parseISO(sub.startDate), 'dd.MM.yyyy')}</span>
                                <span>-</span>
                                <span>{format(parseISO(sub.endDate), 'dd.MM.yyyy')}</span>
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                                <p><strong>Статус:</strong> <span className={`font-medium ${sub.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{sub.status}</span></p>
                                <p><strong>Платено:</strong> {(sub.pricePaid / 100).toFixed(2)} / {(sub.price / 100).toFixed(2)} {sub.currency}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground text-center py-4">Няма намерени абонаменти.</p>
            )}
        </CardContent>
    </Card>
);

const AttendancesTab = ({ attendances, memberId }: { attendances: any[], memberId: string }) => {
    const getAttendanceStatus = (event: any) => {
        const attendee = event.attendees.find((att: any) => att.memberId === memberId);
        if (!attendee) return { text: 'Не е отбелязано', color: 'text-gray-500' };
        return attendee.attended ? { text: 'Присъствал', color: 'text-green-600' } : { text: 'Отсъствал', color: 'text-red-600' };
    };

    return (
        <Card>
            <CardContent className="pt-6">
                {attendances.length > 0 ? (
                    <ul className="space-y-4">
                        {attendances.map(event => {
                            const status = getAttendanceStatus(event);
                            return (
                                <li key={event.id} className="border p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-md">{event.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {format(parseISO(event.startDate), 'dd.MM.yyyy HH:mm')} - {format(parseISO(event.endDate), 'HH:mm')}
                                        </p>
                                    </div>
                                    <span className={`font-semibold ${status.color}`}>{status.text}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Няма данни за присъствия.</p>
                )}
            </CardContent>
        </Card>
    );
};
// #endregion

// #region Main Component
const MemberProfilePage = () => {
  const params = useParams();
  const memberId = params.id as string;

  const { member, subscriptions, familyMembers, attendances, loading, error } = useMemberProfile(memberId);

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
        </div>
        <Card><CardContent className="p-4 flex items-center space-x-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-5 w-32" /></div></CardContent></Card>
        <Skeleton className="h-10 w-full" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></CardContent></Card>
    </div>
  );
  if (error) return <div className="p-4 sm:p-6"><Alert variant="destructive"><AlertTitle>Грешка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;
  if (!member) return <div className="p-4 sm:p-6"><Alert><AlertTitle>Не е намерен член</AlertTitle><AlertDescription>Няма член, съответстващ на това ID.</AlertDescription></Alert></div>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <MemberProfileHeader member={member} />
      <Tabs defaultValue="personal-data" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal-data">Лични данни</TabsTrigger>
            <TabsTrigger value="financial-history">Финансова история</TabsTrigger>
            <TabsTrigger value="subscriptions">Абонаменти</TabsTrigger>
            <TabsTrigger value="attendances">Присъствия</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-data">
            <PersonalDataTab member={member} familyMembers={familyMembers} />
        </TabsContent>
        <TabsContent value="financial-history">
            <Card><CardContent className="pt-6"><p className="text-muted-foreground text-center">Няма данни за финансова история.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="subscriptions">
            <SubscriptionsTab subscriptions={subscriptions} />
        </TabsContent>
        <TabsContent value="attendances">
             <AttendancesTab attendances={attendances} memberId={memberId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
// #endregion

export default MemberProfilePage;
