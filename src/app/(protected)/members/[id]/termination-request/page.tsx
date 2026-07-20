"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatFullName } from "@/lib/utils";
import { MemberDocumentShell } from "@/components/shared/members/MemberDocumentShell";

const TerminationRequestPage = () => {
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
      documentSubtitle='за прекратяване на членство в СНЦ „Бадминтон клуб Гълъбово" град Гълъбово'
      fullName={fullName}
      today={today}
    >
      <div className="space-y-4 text-sm">
        <p className="font-bold">Уважаема госпожо Председател,</p>

        <p>Моля, да прекратите членството на</p>

        <div className="text-center">
          <p className="border-b border-dotted border-slate-400 min-h-[1.2rem] font-bold text-base inline-block px-8">
            {fullName}
          </p>
          <p className="text-[9px] text-slate-500 italic mt-0.5">
            (име на детето/члена)
          </p>
        </div>

        <p>
          в СНЦ „Бадминтон клуб Гълъбово", считано от
          ......................................................................
          20............ г.
        </p>

        <div className="space-y-4 my-6">
          <p className="font-bold">Декларирам, че (отбележете с ✔):</p>
          <div className="space-y-3 ml-4 text-xs">
            <p className="flex gap-3">
              <span className="shrink-0">☐</span>
              <span>
                Всички финансови задължения към клуба са уредени към датата на
                подаване на настоящата молба;
              </span>
            </p>

            <div className="space-y-2">
              <p className="font-bold underline">
                Предоставена е клубната екипировка:
              </p>
              <p className="flex gap-3">
                <span className="shrink-0">☐</span>
                <span>
                  Екип (горнище + долнище), размер
                  ............................................
                </span>
              </p>
              <div className="flex gap-4 items-center">
                <span className="shrink-0">☐ Тениски:</span>
                <p className="flex gap-2 items-center">
                  <span>☐ бяла клубна,</span> <span>☐ синя клубна,</span>{" "}
                  <span>☐ друга клубна тениска</span>
                </p>
              </div>
              <p className="flex gap-3">
                <span className="shrink-0">☐</span>
                <span>
                  Клубната екипировка, предоставена от клуба е върната в добро
                  състояние.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MemberDocumentShell>
  );
};

export default TerminationRequestPage;
