'use client';

import { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, Users, Building, ArrowLeft, Pencil, FileText, Home, PhoneCall, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MemberSalesHistory } from './member-sales-history';
import { MemberAttendanceHistory } from './MemberAttendanceHistory';
import { MemberSubscriptionsTab } from './member-subscriptions-tab';
import { getAgeGroup, getInitials, formatFullName } from '@/lib/utils';
import { updateMember } from '@/services/member-service';

interface MemberDetailsCardProps {
    member: Member;
    familyMembers: Member[];
}

const formatPhoneType = (phoneType: string | null | undefined) => {
    if (!phoneType) return null;
    return phoneType === 'personal' ? 'Личен' : 'На родител';
};

export const MemberDetailsCard = ({ member, familyMembers }: MemberDetailsCardProps) => {
    const router = useRouter();

    const fullName = formatFullName(member);
    const ageGroup = member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null;
    const formattedBirthDate = member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('bg-BG') : null;
    const formattedRegistrationDate = member.registrationDate ? new Date(member.registrationDate).toLocaleDateString('bg-BG') : null;

    // 1. Изчисляваме статуса
    const lastPayment = member.lastPaymentDate ? new Date(member.lastPaymentDate) : null;
    const isOverdue = !lastPayment || 
    (Math.floor((new Date().getTime() - lastPayment.getTime()) / (1000 * 3600 * 24)) > 30);

    // 2. Функцията за плащане
    const handlePayment = async () => {
    if (!confirm('Маркиране на месечната такса като платена?')) return;
    // Тук викаме логиката от нашия payment-service
    await updateMember(member.id, { lastPaymentDate: new Date().toISOString() });
    alert('Успешно платено!');
    window.location.reload(); 
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.push('/members')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Всички членове
                </Button>
                <Button onClick={() => router.push(`/members/${member.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" /> Редактирай
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={member.avatarUrl ?? undefined} alt={fullName} />
                            <AvatarFallback className="text-2xl">{getInitials(fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl font-bold">{fullName}</CardTitle>
                            <CardDescription className="text-lg">Статус: {member.status === 'active' ? 'Активен' : 'Неактивен'}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">Финансов статус</h4>
                    <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isOverdue ? "destructive" : "success"}>
                        {isOverdue ? "Дължи такса" : "Редовен"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                        Последно: {lastPayment ? lastPayment.toLocaleDateString('bg-BG') : 'няма данни'}
                    </span>
                    </div>
                </div>
                {isOverdue && (
                    <Button size="sm" onClick={handlePayment} className="bg-green-600 hover:bg-green-700 text-white">
                    Плати такса
                    </Button>
                )}
            </div>

            <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Лични данни</TabsTrigger>
                    <TabsTrigger value="sales">Финансова история</TabsTrigger>
                    <TabsTrigger value="subscriptions">Абонаменти</TabsTrigger>
                    <TabsTrigger value="attendance">Присъствия</TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <InfoRow icon={Mail} label="Имейл" value={member.email} />
                            <InfoRow icon={Phone} label="Телефон" value={member.phone} />
                            <InfoRow icon={PhoneCall} label="Тип на телефона" value={formatPhoneType(member.phoneType)} />
                            <InfoRow icon={Phone} label="Спешен контакт" value={member.emergencyContactName ? `${member.emergencyContactName} (${member.emergencyContactPhone || '—'})` : null} />
                            <InfoRow icon={Calendar} label="Дата на раждане" value={formattedBirthDate} />
                            <InfoRow icon={BarChart2} label="Възрастова група" value={member.ageGroup || ageGroup} />
                            <InfoRow icon={Calendar} label="Дата на регистрация" value={formattedRegistrationDate} />
                            <InfoRow icon={Building} label="Учебно заведение" value={member.educationInstitution} />
                            <InfoRow icon={Users} label="Размер екипировка" value={member.apparelSize} />
                            <InfoRow icon={FileText} label="ЕГН" value={member.personalId} />
                            <InfoRow icon={Home} label="Адрес" value={member.address} />
                            <InfoRow icon={FileText} label="Бележки" value={member.notes} isBlock={true} />

                            {familyMembers && familyMembers.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center">
                                        <Users className="mr-2 h-5 w-5" />
                                        Членове на семейството
                                    </h3>
                                    <div className="space-y-3">
                                        {familyMembers.map(familyMember => (
                                            <div 
                                                key={familyMember.id} 
                                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                                                onClick={() => router.push(`/members/${familyMember.id}`)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        router.push(`/members/${familyMember.id}`);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={familyMember.avatarUrl ?? undefined} alt={formatFullName(familyMember)} />
                                                    <AvatarFallback>{getInitials(formatFullName(familyMember))}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{formatFullName(familyMember)}</p>
                                                    <p className="text-xs text-muted-foreground">{familyMember.email || 'Няма имейл'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sales">
                    <MemberSalesHistory memberId={member.id} />
                </TabsContent>
                
                <TabsContent value="subscriptions">
                    <MemberSubscriptionsTab memberId={member.id} />
                </TabsContent>

                <TabsContent value="attendance">
                    <MemberAttendanceHistory memberId={member.id} />
                </TabsContent>

            </Tabs>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value, isBlock = false }: { icon: React.ElementType, label: string, value: string | null | undefined, isBlock?: boolean }) => {
    if (value === null || value === undefined || value === '') return null;
    
    const layoutClass = isBlock ? 'flex-col items-start space-y-2' : 'flex-row items-center';

    return (
        <div className={`flex text-sm py-2 border-b last:border-b-0 ${layoutClass}`}>
            <div className="flex items-center w-full">
                <Icon className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                <span className="font-semibold mr-2 w-40 flex-shrink-0">{label}:</span>
                {!isBlock && <span className="text-muted-foreground break-all">{value}</span>}
            </div>
            {isBlock && <span className="text-muted-foreground pl-7 text-sm whitespace-pre-wrap">{value}</span>}
        </div>
    );
};
