"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatFullName } from "@/lib/utils";
import { MemberDocumentShell } from "@/components/shared/members/MemberDocumentShell";

const MembershipApplicationPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const fullName = formatFullName(member);
  const today = new Date().toLocaleDateString("bg-BG");

  return (
    <MemberDocumentShell
      onBack={() => router.back()}
      documentSubtitle='за членство в СНЦ „Бадминтон клуб Гълъбово" град Гълъбово'
      fullName={fullName}
      today={today}
    >
      <div className="space-y-4 text-sm">
        <p className="font-bold">Уважаема госпожо Председател,</p>

        <p>Моля, да приемете</p>

        <div className="text-center">
          <p className="inline-block min-h-[1.2rem] border-b border-dotted border-slate-400 px-8 text-base font-bold">
            {fullName}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-500 italic">
            (име на детето/члена)
          </p>
        </div>

        <p>
          като член на СНЦ „Бадминтон клуб Гълъбово", считано от
          .................................................. 20........... г.
        </p>

        <div className="my-4 space-y-2">
          <p className="font-bold">
            Избирам/е следната форма на участие (отбележете с ✔):
          </p>
          <div className="ml-4 grid grid-cols-1 gap-1 text-xs">
            <p>☐ Месечен абонамент - едно дете ( 20 EUR / )</p>
            <p>☐ Месечен абонамент - 2 деца ( 30 EUR / )</p>
            <p>☐ Месечен абонамент - 2+ деца ( 40 EUR / )</p>
            <p>☐ Единично посещение ( 3 EUR / )</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <p className="flex gap-3">
            <span className="shrink-0">☐</span>
            <span>
              Декларирам, че съм запознат/а с Вътрешния правилник на клуба и
              се съгласявам с него.
            </span>
          </p>
          <p className="flex gap-3">
            <span className="shrink-0">☐</span>
            <span>
              Запознат/а съм, че при желание за прекратяване на членството е
              необходимо подаване на „Молба за прекратяване на членство" и
              връщане на предоставена клубна екипировка (ако има дадена такава).
            </span>
          </p>
        </div>
      </div>
    </MemberDocumentShell>
  );
};

export default MembershipApplicationPage;
