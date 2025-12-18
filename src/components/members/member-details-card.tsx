
import { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Home, Cake, Briefcase, Info, Users } from 'lucide-react'; // Added Users icon
import { getAgeGroup } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MemberDetailsCardProps {
  member: Member;
  familyMembers: Member[];
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined | null }) => (
    value ? (
        <div className="flex items-start py-3 border-b border-gray-100 last:border-b-0">
            <Icon className="h-5 w-5 mr-4 text-gray-500 mt-1"/> 
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    ) : null
);


export const MemberDetailsCard = ({ member, familyMembers }: MemberDetailsCardProps) => {
  const router = useRouter();
  const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
  const dateOfBirthFormatted = member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('bg-BG') : 'Няма данни';
  const registrationDateFormatted = member.registrationDate ? new Date(member.registrationDate).toLocaleDateString('bg-BG') : 'Няма данни';

  const handleFamilyMemberClick = (id: string) => {
    router.push(`/members/${id}`);
  };

  return (
    <Card>
        <CardHeader className="items-center text-center pb-4 border-b">
            <Avatar className="h-28 w-28 mb-3">
                <AvatarImage src={member.avatarUrl} alt={fullName} />
                <AvatarFallback className="text-4xl">{member.firstName?.[0]}{member.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold">{fullName}</CardTitle>
            <Badge variant={member.status === 'active' ? 'secondary' : 'destructive'} className="mt-2">
                {member.status === 'active' ? 'Активен' : 'Неактивен'}
            </Badge>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 p-0">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Лични данни</h3>
              <DetailRow icon={User} label="Пълно име" value={fullName} />
              <DetailRow icon={Mail} label="Имейл" value={member.email} />
              <DetailRow icon={Phone} label="Телефон" value={member.phone ? `${member.phone} (${member.phoneType === 'parent' ? 'родител' : 'личен'})` : null} />
              <DetailRow icon={Cake} label="Дата на раждане" value={dateOfBirthFormatted} />
              <DetailRow icon={Info} label="Възрастова група" value={getAgeGroup(member.dateOfBirth)} />
              <DetailRow icon={Home} label="Адрес" value={member.address} />
              <DetailRow icon={Briefcase} label="Професия" value={member.occupation} />
              <DetailRow icon={Info} label="ЕГН" value={member.egn} />
              <DetailRow icon={Info} label="Дата на регистрация" value={registrationDateFormatted} />
            </div>
            
            {familyMembers && familyMembers.length > 0 && (
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-800"><Users className="h-5 w-5 mr-3"/> Семейство</h3>
                <div className="space-y-3">
                  {familyMembers.map(fm => (
                      <div key={fm.id} onClick={() => handleFamilyMemberClick(fm.id)} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={fm.avatarUrl} />
                              <AvatarFallback>{fm.firstName?.[0]}{fm.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-700">{[fm.firstName, fm.lastName].join(' ')}</p>
                            <p className="text-sm text-gray-500">{getAgeGroup(fm.dateOfBirth)}</p>
                          </div>
                      </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
    </Card>
  );
}
