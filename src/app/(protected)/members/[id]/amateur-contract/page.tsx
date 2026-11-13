"use client";

import { ArrowLeft, Calendar, Loader2, PenLine, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SignatureDialog } from "@/components/members/signature-dialog";
import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";

const AmateurContractPage = () => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading, refetch } = useMemberProfile(memberId);
  const { idToken, getFreshToken } = useAuth();
  const chairperson = useChairpersonSignature();

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const displayDate = useMemo(() => {
    if (!selectedDate) return new Date().toLocaleDateString("bg-BG");
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}.${parts[0]}`;
    }
    return new Date().toLocaleDateString("bg-BG");
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        Зареждане...
      </div>
    );
  }
  if (!member) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 text-rose-600 dark:bg-zinc-950 dark:text-rose-400">
        Членът не е намерен.
      </div>
    );
  }

  const fullName = formatFullName(member);
  const existingSignatureUrl =
    signatureUrl ||
    member.amateurContractSignatureUrl ||
    member.amateurContractUrl ||
    null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/members/${memberId}/documents`);
    }
  };

  const handleSignatureSave = async (file: File) => {
    setIsSaving(true);
    try {
      const token = idToken || (await getFreshToken());
      if (!token) {
        toast.error("Грешка при оторизация");
        return;
      }

      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const nowIso = new Date().toISOString();
      const result = await updateMemberAction(memberId, token, {
        amateurContractSignatureUrl: url,
        amateurContractHandedAt: nowIso,
        hasAmateurContract: true,
      });

      if (result.success) {
        setSignatureUrl(url);
        toast.success("Подписът е запазен успешно!");
        if (refetch) refetch();
        router.refresh();
      } else {
        toast.error("Грешка при запазване на подписа");
      }
    } catch (err) {
      console.error("Signature save error:", err);
      toast.error("Грешка при качване на подписа");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8 dark:bg-zinc-950 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* Compact PageHeader */}
        <PageHeader
          title="Договор с аматьорски статут"
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: fullName, href: `/members/${memberId}` },
            { label: "Документи", href: `/members/${memberId}/documents` },
            { label: "Договор с аматьорски статут" },
          ]}
          className="print:hidden"
        />

        {/* Non-printable toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xs backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="mr-2 size-4" /> Назад
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {/* Editable Date Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                Дата:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="cursor-pointer rounded bg-transparent font-medium text-zinc-900 outline-none dark:bg-zinc-800 dark:text-zinc-100"
                title="Редактирай датата на договора"
              />
            </div>

            <ChairpersonSignatureControl {...chairperson} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignatureOpen(true)}
              disabled={isSaving}
              className="rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <PenLine className="mr-2 size-4" />
              )}
              {existingSignatureUrl ? "Подписан" : "Подпиши"}
            </Button>

            <span className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
              (2 стр. А4)
            </span>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Printer className="mr-2 size-4" /> Принтирай
            </Button>
          </div>
        </div>

        {/* Printable Area - Exactly 2 Pages */}
        <div className="print-area rounded-2xl bg-white p-6 font-serif leading-snug text-justify text-slate-900 shadow-sm md:p-10 print:rounded-none print:p-0 print:shadow-none">
          {/* ================= PAGE 1 ================= */}
          <div className="page-sheet page-1 flex min-h-[265mm] flex-col justify-between">
            <div>
              <ClubOfficialDocumentHeader
                documentKey="amateurContract"
                overrideDate={displayDate}
              />

              <div className="mb-4 text-center">
                <h1 className="text-lg font-bold tracking-[0.25em] text-slate-950 uppercase">
                  Д О Г О В О Р
                </h1>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  / за спортисти с аматьорски статут /
                </p>
              </div>

              <div className="space-y-3 text-[9pt] leading-tight">
                <p className="indent-4">
                  Днес, <span className="font-semibold">{displayDate} г.</span>{" "}
                  в гр. Гълъбово между „Бадминтон клуб Гълъбово” и лицето:
                </p>
                <p className="border-b border-dotted border-slate-800 pb-0.5 text-center font-bold text-[10pt]">
                  {fullName}
                </p>
                <p className="text-right text-[8pt] text-slate-700 italic">
                  представляван/а от лицата:
                </p>

                <div className="space-y-1.5 pl-2">
                  <p>
                    1. Баща:{" "}
                    <span className="font-semibold underline">
                      {member.fatherName ||
                        member.parentName ||
                        "__________________________________________________"}
                    </span>
                  </p>
                  <p>
                    2. Майка:{" "}
                    <span className="font-semibold underline">
                      {member.motherName ||
                        "__________________________________________________"}
                    </span>
                  </p>
                </div>

                <p className="indent-4 text-justify">
                  наричан/а за по-кратко „Състезател”, се сключи настоящият
                  договор, чиято цел е уреждането на отношенията между
                  „Бадминтон клуб Гълъбово” и „Състезателят” за периода от една
                  година от деня на подписването на настоящия договор.
                </p>

                <div className="pt-2">
                  <h2 className="mb-1 text-xs font-bold tracking-wide uppercase text-slate-950">
                    ЗАДЪЛЖЕНИЯ И ПРАВА НА СТРАНИТЕ
                  </h2>
                  <h3 className="mb-1.5 text-[9.5pt] font-bold text-slate-900">
                    I. „БАДМИНТОН КЛУБ ГЪЛЪБОВО”:
                  </h3>
                  <ul className="space-y-1.5 pl-2 text-justify">
                    <li>
                      - „Бадминтон клуб Гълъбово” се задължава да предоставя
                      необходимата методическа помощ и условия за провеждането
                      на тренировъчна дейност на „Състезателя”, да го
                      картотекира в БФБадминтон и да му предостави по този начин
                      възможност да участва в прояви от календара на БФБ /
                      вътрешен и международен/.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” се задължава да защитава
                      интересите на „Състезателя” пред БФБадминотон, пред
                      Националния треньор, Националния Селекционер и пред
                      средствата за масово осведомяване.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” няма право да извършва
                      действия или бездействия, които водят до накърняване на
                      интересите и уронване на престижа на „Състезателя”.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” има право да продава или
                      отдава състезателните права на „Състезателя” в
                      съответствие с наредбите на БФБадминтон, с неговото и на
                      родителите му знание.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” има право да използва
                      „Състезателя” във всички прояви от календара на
                      БФБадминтон / вътрешни и международни/ за срока, посочен в
                      този договор в съответствие в наредбата, одобрена от
                      БФБадминтон.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” има право за използва
                      „Състезателя” и името му за реклама на „Бадминтон клуб
                      Гълъбово” и на дейността му за периода, в който договора е
                      валиден със знанието и съгласието на „Състезателя”.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” има право да премира
                      „Състезателя” за постигнати резултати с решение на
                      треньора, Председателя или Управителния съвет на
                      „Бадминтон клуб Гълъбово”.
                    </li>
                    <li>
                      - „Бадминтон клуб Гълъбово” има право да прекрати
                      едностранно договора със „Състезателя” при неизпълнение на
                      неговите задължения, уронване престижа на „Бадминтон клуб
                      Гълъбово” или неспазване правилата, установени и изискуеми
                      в „Бадминтон клуб Гълъбово” и БФБадминтон.
                    </li>
                  </ul>
                </div>

                <div className="pt-1">
                  <h3 className="mb-1 text-[9.5pt] font-bold text-slate-900">
                    II. „СЪСТЕЗАТЕЛЯТ”
                  </h3>
                  <ul className="space-y-1.5 pl-2 text-justify">
                    <li>
                      - „Състезателят” се задължава да участва редовно в
                      тренировъчния процес, с необходимата сериозност и
                      дисциплинираност, изискана от ръководителите на „Бадминтон
                      клуб Гълъбово”.
                    </li>
                    <li>
                      - „Състезателят” се задължава да вземе участие в спортните
                      прояви определени от „Бадминтон клуб Гълъбово”, като се
                      задължава да го направи по възможно най-добрия отговорен
                      начин.
                    </li>
                    <li>
                      - „Състезателят” се задължава да информира „Бадминтон клуб
                      Гълъбово” своевременно за заболявания и контузии.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-2 text-right text-[7.5pt] text-slate-400">
              Стр. 1 от 2 &bull; „Бадминтон клуб Гълъбово”
            </div>
          </div>

          {/* Explicit page break between page 1 and page 2 */}
          <div className="page-break my-8 border-b-2 border-dashed border-slate-300 print:m-0 print:border-none" />

          {/* ================= PAGE 2 ================= */}
          <div className="page-sheet page-2 flex min-h-[265mm] flex-col justify-between pt-2">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-slate-400 pb-1 font-sans text-[8pt] text-slate-600">
                <span className="font-semibold uppercase tracking-wider">
                  „БАДМИНТОН КЛУБ ГЪЛЪБОВО”
                </span>
                <span>
                  ДОГОВОР ЗА СПОРТИСТИ С АМАТЬОРСКИ СТАТУТ (продължение) — Стр.
                  2 от 2
                </span>
              </div>

              <div className="space-y-2.5 text-[9pt] leading-tight text-justify">
                <ul className="space-y-1.5 pl-2">
                  <li>
                    - „Състезателят” се задължава да информира „Бадминтон клуб
                    Гълъбово” за всичко, което касае спортно-състезателната му
                    дейност в този клуб и в националните отбори, ако бъде
                    повикан в тях.
                  </li>
                  <li>
                    - „Състезателят” се задължава да брани на първо място
                    интересите на „Бадминтон клуб Гълъбово” , в съответствие с
                    политиката му и с негово знание по всички въпроси, които
                    касаят „Бадминтон клуб Гълъбово”.
                  </li>
                  <li>
                    - „Състезателят” се задължава да внася в срок членския си
                    внос, определен от „Бадминтон клуб Гълъбово”.
                  </li>
                  <li>
                    - „Състезателят” няма право да уронва престижа на „Бадминтон
                    клуб Гълъбово” , като извършва действия или бездействия,
                    които могат да доведат до нежелани последствия за „Бадминтон
                    клуб Гълъбово” или за лица, които членуват или са
                    ръководители/треньори, председателя, управителен съвет в
                    „Бадминтон клуб Гълъбово”.
                  </li>
                  <li>
                    - „Състезателят” има право да изисква от „Бадминтон клуб
                    Гълъбово” нужната му информация, свързана с неговото участие
                    в тренировъчно-състезателния процес.
                  </li>
                  <li>
                    - „Състезателят” има право да получава поущрителни награди
                    от „Бадминтон клуб Гълъбово” за постигнати резултати
                    определени от треньора, Председателя и Управителния съвет на
                    „Бадминтон клуб Гълъбово”.
                  </li>
                  <li>
                    - „Състезателят” има право да иска съдействие от „Бадминтон
                    клуб Гълъбово” по въпроси, касаещи неговата подготовка,
                    участието му в състезанията и участието в националните
                    отбори.
                  </li>
                  <li>
                    - „Състезателят” има право да получи помощ от „Бадминтон
                    клуб Гълъбово” в спорове с БФБ във връзка с наложените му
                    дисциплинарни или други наказания.
                  </li>
                  <li>
                    - „Състезателят” има право да прекрати едностранно договора
                    при неспазване на задълженията на „Бадминтон клуб Гълъбово”,
                    посочени по-горе или ако „Бадминтон клуб Гълъбово” не
                    защитава неговите интереси пред необходимите институции.
                  </li>
                </ul>

                <div className="pt-2">
                  <h3 className="mb-1.5 text-xs font-bold tracking-wide uppercase text-slate-950">
                    ДОПЪЛНИТЕЛНИ РАЗПОРЕДБИ
                  </h3>
                  <ul className="space-y-1.5 pl-2">
                    <li>
                      - Застраховките на състезателя се правят от самия него в
                      срок, избран от него и за продължителност, за която той
                      прецени, като „Бадминтон клуб Гълъбово” не носи
                      отговорност за липсата на застраховка при настъпване на
                      болест, контузии, и други застрахователни събития, по
                      време на състезания и тренировки.
                    </li>
                    <li>
                      - Този договор се прекратява автоматично при настъпването
                      на следните събития:
                      <div className="space-y-0.5 pt-1 pl-4">
                        <p>
                          1. При промяна на местоживеенето на „Състезателя” , но
                          при изрично негово настояване.
                        </p>
                        <p>
                          2. При прекратяване на състезателната дейност на
                          „Състезателят”.
                        </p>
                      </div>
                    </li>
                    <li>
                      - Този договор се сключва за срок от една година и съдържа
                      уговорката, че действието му се подновява автоматично за
                      следващ период от една година, освен някоя от страните не
                      отправи писмено предизвестие до другата, в срок от една
                      седмица, считано от датата, на която изтича срока на
                      договора.
                    </li>
                    <li>
                      - Настоящият договор се изготвя в два еднообразни
                      екземпляра, по един за всяка страна.
                    </li>
                    <li>
                      - Споровете, не посочени в този договор се решават според
                      Наредбите и Правилниците на БФБадминтон.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Institutional Signatures Block */}
            <div className="mt-6 border-t border-slate-300 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-8 items-end">
                <div>
                  <p className="font-bold">„Бадминтон клуб Гълъбово”</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span>Председател:</span>
                    <ChairpersonSignatureLine
                      isApplied={chairperson.isApplied}
                      signatureUrl={chairperson.signatureUrl}
                      caption="/ Мира Георгиева /"
                      align="left"
                    />
                  </div>
                </div>

                <div className="space-y-4 text-right">
                  <div>
                    <div className="border-b border-slate-900 pb-0.5 font-semibold">
                      {existingSignatureUrl ? (
                        <div className="flex justify-end items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={existingSignatureUrl}
                            alt="Подпис"
                            className="inline h-7 max-w-25 object-contain"
                          />
                          <span className="font-sans text-[7.5pt] font-bold text-slate-700">
                            ({fullName})
                          </span>
                        </div>
                      ) : (
                        <span>{fullName}</span>
                      )}
                    </div>
                    <p className="text-[7.5pt] text-slate-600 italic">
                      / име на състезателя, подпис /
                    </p>
                  </div>

                  <div>
                    <div className="border-b border-slate-900 pb-0.5 font-semibold min-h-[1.5em]">
                      <span>
                        {member.parentName ||
                          member.fatherName ||
                          member.motherName ||
                          "\u00A0"}
                      </span>
                    </div>
                    <p className="text-[7.5pt] text-slate-600 italic">
                      / име на родителя, подпис /
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-2 text-right text-[7pt] text-slate-400">
                Стр. 2 от 2 &bull; „Бадминтон клуб Гълъбово”
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        title="Електронен подпис – Договор"
        description={`Начертайте електронния подпис за ${fullName} (или родител/настойник).`}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-sheet {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default AmateurContractPage;
