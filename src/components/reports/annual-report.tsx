"use client";

import {
  Award,
  Calendar,
  Check,
  Copy,
  Download,
  Dumbbell,
  FileDown,
  Flame,
  Globe,
  Loader2,
  Medal,
  Plus,
  RefreshCw,
  Save,
  Tent,
  Trash2,
  Trophy,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAnnualReportAction,
  saveAnnualReportAction,
} from "@/lib/actions/annual-report";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { cn } from "@/lib/utils";
import type {
  AnnualReportData,
  CompetitionMedal,
} from "@/types/annual-report.types";

interface AnnualReportProps {
  initialYear?: number;
  initialCoachId?: string;
  siteId?: string;
}

const AVAILABLE_YEARS = [2027, 2026, 2025, 2024, 2023];

export default function AnnualReport({
  initialYear = 2025,
  initialCoachId = "mira_georgieva",
  siteId = "bkgalabovo",
}: AnnualReportProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [coachName, setCoachName] = useState<string>("МИРА ГЕОРГИЕВА");
  const [coachRole, setCoachRole] = useState<string>("Треньор по бадминтон");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [report, setReport] = useState<AnnualReportData | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  // Нова форма за добавяне на медал
  const [newMedalAthlete, setNewMedalAthlete] = useState("");
  const [newMedalTournament, setNewMedalTournament] = useState("");
  const [newMedalType, setNewMedalType] = useState<
    "zonal" | "state" | "national" | "international"
  >("national");
  const [newMedalPlace, setNewMedalPlace] = useState<1 | 2 | 3 | 4>(1);

  // Зареждане на отчета за избраната година
  const loadReport = async (year: number) => {
    setIsLoading(true);
    try {
      const res = await getAnnualReportAction(year, initialCoachId, siteId);
      if (res.success && res.data) {
        setReport(res.data);
        if (res.data.coachName) setCoachName(res.data.coachName);
        if (res.data.coachRole) setCoachRole(res.data.coachRole);
      } else {
        toast.error("Неуспешно зареждане на отчета");
      }
    } catch {
      toast.error("Грешка при връзка със сървъра");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Запис на промените
  const handleSave = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const payload: AnnualReportData = {
        ...report,
        year: selectedYear,
        coachName,
        coachRole,
      };
      const res = await saveAnnualReportAction(payload);
      if (res.success) {
        toast.success("Годишният отчет е запазен успешно!");
      } else {
        toast.error(res.error || "Грешка при запис");
      }
    } catch {
      toast.error("Възникна системна грешка при запис");
    } finally {
      setIsSaving(false);
    }
  };

  // Редакция на месечен брой тренировки
  const handleUpdateMonthTraining = (monthIdx: number, count: number) => {
    if (!report) return;
    const newMonthly = [...report.trainings.monthly];
    newMonthly[monthIdx] = {
      ...newMonthly[monthIdx],
      conductedCount: Math.max(0, count),
    };
    const totalCount = newMonthly.reduce((s, m) => s + m.conductedCount, 0);
    setReport({
      ...report,
      trainings: {
        ...report.trainings,
        monthly: newMonthly,
        totalCount,
      },
    });
  };

  // Добавяне на медал
  const handleAddMedal = () => {
    if (!report || !newMedalAthlete.trim() || !newMedalTournament.trim()) {
      toast.error("Моля, въведете състезател и име на турнира");
      return;
    }

    const newMedal: CompetitionMedal = {
      id: `custom_${Date.now()}`,
      tournamentName: newMedalTournament.trim(),
      tournamentType: newMedalType,
      date: `${selectedYear}-12-01`,
      athleteName: newMedalAthlete.trim(),
      category: "singles",
      place: newMedalPlace,
    };

    const updatedList = [newMedal, ...report.medalsAnalysis.medalsList];
    const zonal =
      updatedList.filter((m) => m.tournamentType === "zonal").length ||
      report.medalsAnalysis.zonalCount;
    const state =
      updatedList.filter((m) => m.tournamentType === "state").length ||
      report.medalsAnalysis.stateCount;
    const national =
      updatedList.filter((m) => m.tournamentType === "national").length ||
      report.medalsAnalysis.nationalCount;
    const international =
      updatedList.filter((m) => m.tournamentType === "international").length ||
      report.medalsAnalysis.internationalCount;

    setReport({
      ...report,
      medalsAnalysis: {
        ...report.medalsAnalysis,
        medalsList: updatedList,
        zonalCount: newMedalType === "zonal" ? zonal + 1 : zonal,
        stateCount: newMedalType === "state" ? state + 1 : state,
        nationalCount: newMedalType === "national" ? national + 1 : national,
        internationalCount:
          newMedalType === "international" ? international + 1 : international,
        totalMedals: report.medalsAnalysis.totalMedals + 1,
      },
    });

    setNewMedalAthlete("");
    setNewMedalTournament("");
    toast.success("Медалът е добавен успешно!");
  };

  // Премахване на медал
  const handleRemoveMedal = (id: string) => {
    if (!report) return;
    const item = report.medalsAnalysis.medalsList.find((m) => m.id === id);
    const updatedList = report.medalsAnalysis.medalsList.filter(
      (m) => m.id !== id
    );

    let zonal = report.medalsAnalysis.zonalCount;
    let state = report.medalsAnalysis.stateCount;
    let national = report.medalsAnalysis.nationalCount;
    let international = report.medalsAnalysis.internationalCount;

    if (item) {
      if (item.tournamentType === "zonal") zonal = Math.max(0, zonal - 1);
      if (item.tournamentType === "state") state = Math.max(0, state - 1);
      if (item.tournamentType === "national")
        national = Math.max(0, national - 1);
      if (item.tournamentType === "international")
        international = Math.max(0, international - 1);
    }

    setReport({
      ...report,
      medalsAnalysis: {
        ...report.medalsAnalysis,
        medalsList: updatedList,
        zonalCount: zonal,
        stateCount: state,
        nationalCount: national,
        internationalCount: international,
        totalMedals: Math.max(0, report.medalsAnalysis.totalMedals - 1),
      },
    });
  };

  // Експорт към PDF
  const handleExportPdf = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdfFromElement(
        printableRef.current,
        `Otchet_Deynost_${selectedYear}_${coachName.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("PDF отчетът е генериран успешно!");
    } catch (e) {
      console.error(e);
      toast.error("Грешка при генериране на PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Експорт към DOC (Word)
  const handleExportWord = () => {
    if (!report) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>ОТЧЕТ ЗА ДЕЙНОСТТА ПРЕЗ ${selectedYear} ГОДИНА</title>
        <style>
          body { font-family: 'Calibri', 'Times New Roman', sans-serif; font-size: 11pt; line-height: 1.4; color: #111; }
          h1 { font-size: 16pt; text-align: center; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
          h2 { font-size: 12pt; text-align: center; font-weight: bold; margin-top: 0; color: #333; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
          th, td { border: 1px solid #888; padding: 6px 10px; font-size: 10.5pt; }
          th { background-color: #f2f2f2; text-align: left; }
          ul { margin-top: 4px; margin-bottom: 8px; }
          li { margin-bottom: 3px; }
          .signature-box { margin-top: 40px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>ОТЧЕТ ЗА ДЕЙНОСТТА ПРЕЗ ${selectedYear} ГОДИНА</h1>
        <h2>от ${coachName} – ${coachRole}<br>към ${report.organizationName}</h2>
        <br>
        <p>Дейността ми като треньор по бадминтон към ${report.organizationName} за ${selectedYear} година бе в няколко основни направления:</p>
        <ol>
          <li>Организиране и провеждане на тренировки по бадминтон.</li>
          <li>Подготовка и участие в състезания.</li>
          <li>Организиране и провеждане на състезания по бадминтон.</li>
          <li>Организиране и провеждане на летен спортен лагер.</li>
          <li>Организиране и/или провеждане и участие в/на демонстрации по бадминтон.</li>
          <li>Анализ на постигнатите резултати.</li>
        </ol>

        <h3>1. и 2. Организиране и провеждане на тренировки и участие в състезания</h3>
        <p>${report.trainings.description}</p>
        <p><strong>За ${selectedYear} година тренировките се проведоха както следва (Общо ${report.trainings.totalCount} тренировки):</strong></p>
        <table>
          <tr><th>Месец</th><th>Проведени тренировки</th></tr>
          ${report.trainings.monthly.map((m) => `<tr><td>м. ${m.monthName.toUpperCase()}</td><td>${m.conductedCount} тренировки</td></tr>`).join("")}
          <tr><td><strong>ОБЩО ЗА ГОДИНАТА</strong></td><td><strong>${report.trainings.totalCount} тренировки</strong></td></tr>
        </table>

        <h3>3. Организиране и провеждане на състезания</h3>
        <p>${report.organizedTournaments.description}</p>
        <ul>
          ${report.organizedTournaments.list.map((t) => `<li><strong>${t.month}:</strong> ${t.title} (${t.ageGroups})</li>`).join("")}
        </ul>

        <h3>4. Организиране и провеждане на летен спортен лагер</h3>
        <p><strong>${report.sportsCamp.title}</strong> – ${report.sportsCamp.dateRange} – ${report.sportsCamp.facility}, ${report.sportsCamp.location}.</p>
        <p>В рамките на лагера се осъществиха общо <strong>${report.sportsCamp.sessionsCount} интензивни тренировъчни занимания</strong>, посветени на цялостната подготовка на състезателите за предстоящите отборни първенства.</p>
        <p><strong>Основни акценти:</strong></p>
        <ul>
          ${report.sportsCamp.focusAreas.map((f) => `<li>${f}</li>`).join("")}
        </ul>

        <h3>5. Организиране и провеждане на демонстрации и други събития</h3>
        <p>${report.demonstrations.description}</p>
        <ul>
          ${report.demonstrations.list.map((d) => `<li><strong>${d.title} (${d.date}):</strong> ${d.description} (Партньор: ${d.partner})</li>`).join("")}
        </ul>

        <h3>6. Анализ на резултатите (Спечелени медали)</h3>
        <p>${report.medalsAnalysis.description}</p>
        <table>
          <tr><th>Ниво на първенството</th><th>Брой спечелени медали</th></tr>
          <tr><td>Зонални първенства</td><td><strong>${report.medalsAnalysis.zonalCount} медала</strong></td></tr>
          <tr><td>Държавни първенства</td><td><strong>${report.medalsAnalysis.stateCount} медал</strong></td></tr>
          <tr><td>Национални турнири</td><td><strong>${report.medalsAnalysis.nationalCount} медала</strong></td></tr>
          <tr><td>Международни турнири</td><td><strong>${report.medalsAnalysis.internationalCount} медала</strong></td></tr>
          <tr><td><strong>ОБЩО МЕДАЛИ</strong></td><td><strong>${report.medalsAnalysis.totalMedals} медала</strong></td></tr>
        </table>

        <div class="signature-box">
          <p>Изготвил:<br>....................................................<br>${coachName} – ${coachRole}<br>„Бадминтон клуб Гълъбово”</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Otchet_Deynost_${selectedYear}_${coachName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Word документът е изтеглен успешно!");
  };

  // Копиране на текст
  const handleCopyText = () => {
    if (!report) return;
    const text = `ОТЧЕТ ЗА ДЕЙНОСТТА ПРЕЗ ${selectedYear} ГОДИНА
от ${coachName} – ${coachRole}
КЪМ ${report.organizationName}

Дейността ми като треньор по бадминтон към ${report.organizationName} за ${selectedYear} година бе в няколко основни направления:
1. Организиране и провеждане на тренировки по бадминтон.
2. Подготовка и участие в състезания.
3. Организиране и провеждане на състезания по бадминтон.
4. Организиране и провеждане на летен спортен лагер.
5. Организиране и/или провеждане и участие в/на демонстрации по бадминтон.
6. Анализ на постигнатите резултати.

1. и 2. Организиране и провеждане на тренировки по бадминтон. Подготовка и участие в състезания.
${report.trainings.description}
За ${selectedYear} година, тренировките се проведоха както следва (Общо ${report.trainings.totalCount}):
${report.trainings.monthly.map((m) => `• м. ${m.monthName.toUpperCase()} – ${m.conductedCount} тренировки`).join("\n")}

3. Организиране и провеждане на състезания.
${report.organizedTournaments.list.map((t) => `• Месец ${t.month} – ${t.title} (${t.ageGroups})`).join("\n")}

4. Организиране и провеждане на летен спортен лагер
${report.sportsCamp.title} – ${report.sportsCamp.dateRange} – ${report.sportsCamp.facility} ${report.sportsCamp.location}.
Общо ${report.sportsCamp.sessionsCount} интензивни тренировъчни занимания.
${report.sportsCamp.focusAreas.map((f) => `• ${f}`).join("\n")}

5. Организиране и/или провеждане на демонстрации и други събития
${report.demonstrations.list.map((d) => `• ${d.title} (${d.date}): ${d.description}`).join("\n")}

6. Анализ на резултатите:
• Зонални първенства – ${report.medalsAnalysis.zonalCount} медала
• Държавни първенства – ${report.medalsAnalysis.stateCount} медал
• Национални турнири – ${report.medalsAnalysis.nationalCount}
• Международни турнири – ${report.medalsAnalysis.internationalCount}
ОБЩО: ${report.medalsAnalysis.totalMedals} медала`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Отчетът е копиран в клипборда!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 size-8" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Зареждане на годишния отчет и сканиране на резултатите...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Няма налични данни за избраната година.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS (Golden Hybrid Bar)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 size-10">
              <Award className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
                Официален годишен отчет за дейността
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Автоматизирано извличане на тренировки, състезания, лагери и
                медали по Златен стандарт
              </p>
            </div>
          </div>
        </div>

        {/* Избор на година и треньор */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <Calendar className="text-zinc-400 size-4" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Година:
            </span>
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger className="h-7 border-none bg-transparent px-2 text-xs font-semibold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y} година
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="h-8 gap-1.5 text-xs rounded-lg dark:border-zinc-800"
            >
              {copied ? (
                <Check className="text-emerald-500 size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Копирано" : "Копирай"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWord}
              className="h-8 gap-1.5 text-xs rounded-lg dark:border-zinc-800"
            >
              <FileDown className="text-blue-500 size-3.5" />
              Word (.doc)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="h-8 gap-1.5 text-xs rounded-lg border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
            >
              {isGeneratingPdf ? (
                <Loader2 className="animate-spin size-3.5" />
              ) : (
                <Download className="size-3.5" />
              )}
              Официален PDF
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="animate-spin size-3.5" />
              ) : (
                <Save className="size-3.5" />
              )}
              Запази
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ТРЕНЬОР И ОРГАНИЗАЦИЯ (Редактируеми реквизити)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <Label className="text-xs text-zinc-500">Треньор / Докладчик:</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className="h-8 text-xs font-semibold uppercase bg-white dark:bg-zinc-900"
            />
            <Input
              value={coachRole}
              onChange={(e) => setCoachRole(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-zinc-900"
              placeholder="Длъжност"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <Label className="text-xs text-zinc-500">Организация / Клуб:</Label>
          <div className="mt-1">
            <Input
              value={report.organizationName}
              onChange={(e) =>
                setReport({ ...report, organizationName: e.target.value })
              }
              className="h-8 text-xs font-medium bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BENTO KPI КАРТИ НА ГОДИНАТА
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Тренировки
            </span>
            <div className="flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 size-7">
              <Dumbbell className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.trainings.totalCount}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Целогодишни занимания
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Спечелени медали
            </span>
            <div className="flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 size-7">
              <Trophy className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {report.medalsAnalysis.totalMedals}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Зонални, Държавни и Нац.
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Организирани турнири
            </span>
            <div className="flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 size-7">
              <Medal className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.organizedTournaments.list.length}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Национални и клубни
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Спортни лагери
            </span>
            <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 size-7">
              <Tent className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            1
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Приморско (12 сесии)
          </p>
        </BentoCard>

        <BentoCard className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Обществени събития
            </span>
            <div className="flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 size-7">
              <Globe className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.demonstrations.list.length}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Be Active, ДАЗД, ЕДС
          </p>
        </BentoCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. РАЗДЕЛ 1 & 2: ТРЕНИРОВЪЧЕН ПРОЦЕС И МЕСЕЦИ
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 size-8">
              <Dumbbell className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                1. и 2. Организиране и провеждане на тренировки и състезания
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                График по месеци и обща статистика на тренировъчната дейност
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border-none font-semibold text-xs"
          >
            Общо: {report.trainings.totalCount} тренировки
          </Badge>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Въведение и описание на тренировъчния процес:
          </Label>
          <Textarea
            value={report.trainings.description}
            onChange={(e) =>
              setReport({
                ...report,
                trainings: {
                  ...report.trainings,
                  description: e.target.value,
                },
              })
            }
            className="mt-1 min-h-[75px] text-xs leading-relaxed dark:bg-zinc-950"
          />
        </div>

        {/* Мрежа с месеците */}
        <div className="mt-4">
          <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Разпределение на тренировките по месеци през {selectedYear} година:
          </Label>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {report.trainings.monthly.map((m, idx) => (
              <div
                key={m.month}
                className="flex flex-col rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-indigo-800"
              >
                <span className="text-[11px] font-semibold text-zinc-600 uppercase dark:text-zinc-400">
                  м. {m.monthName}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={m.conductedCount}
                    onChange={(e) =>
                      handleUpdateMonthTraining(idx, Number(e.target.value))
                    }
                    className="h-7 w-16 text-center text-xs font-bold bg-white dark:bg-zinc-900"
                  />
                  <span className="text-[11px] text-zinc-400">тренировки</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          5. РАЗДЕЛ 3: ОРГАНИЗИРАНЕ И ПРОВЕЖДАНЕ НА СЪСТЕЗАНИЯ
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 size-8">
              <Medal className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                3. Организиране и провеждане на състезания
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Национални вериги, вътрешни първенства и тематични коледни
                турнири
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Описание на турнирната дейност:
          </Label>
          <Textarea
            value={report.organizedTournaments.description}
            onChange={(e) =>
              setReport({
                ...report,
                organizedTournaments: {
                  ...report.organizedTournaments,
                  description: e.target.value,
                },
              })
            }
            className="mt-1 min-h-15 text-xs leading-relaxed dark:bg-zinc-950"
          />
        </div>

        <div className="mt-4 space-y-2">
          {report.organizedTournaments.list.map((tour, idx) => (
            <div
              key={tour.id || idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold uppercase border-none",
                    tour.type === "national"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : tour.type === "thematic"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  )}
                >
                  {tour.month}
                </Badge>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {tour.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {tour.ageGroups}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          6. РАЗДЕЛ 4: ЛЕТЕН СПОРТЕН ЛАГЕР
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 size-8">
              <Tent className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                4. Организиране и провеждане на летен спортен лагер
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Подготовка на състезателите в ММЦ „Хелиос“ Приморско
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-none font-semibold text-xs"
          >
            {report.sportsCamp.sessionsCount} занимания
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-[10px] text-zinc-400">Период:</span>
            <Input
              value={report.sportsCamp.dateRange}
              onChange={(e) =>
                setReport({
                  ...report,
                  sportsCamp: {
                    ...report.sportsCamp,
                    dateRange: e.target.value,
                  },
                })
              }
              className="mt-0.5 h-7 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-[10px] text-zinc-400">Локация и база:</span>
            <Input
              value={`${report.sportsCamp.facility}, ${report.sportsCamp.location}`}
              onChange={(e) =>
                setReport({
                  ...report,
                  sportsCamp: {
                    ...report.sportsCamp,
                    facility: e.target.value,
                  },
                })
              }
              className="mt-0.5 h-7 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-[10px] text-zinc-400">
              Брой интензивни тренировки:
            </span>
            <Input
              type="number"
              value={report.sportsCamp.sessionsCount}
              onChange={(e) =>
                setReport({
                  ...report,
                  sportsCamp: {
                    ...report.sportsCamp,
                    sessionsCount: Number(e.target.value),
                  },
                })
              }
              className="mt-0.5 h-7 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Основни физически качества и акценти:
          </Label>
          <div className="mt-2 space-y-2">
            {report.sportsCamp.focusAreas.map((f, fIdx) => (
              <div
                key={fIdx}
                className="flex items-start gap-2 rounded-lg bg-zinc-50/80 p-2 text-xs text-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300"
              >
                <Flame className="mt-0.5 shrink-0 text-amber-500 size-3.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          7. РАЗДЕЛ 5: ДЕМОНСТРАЦИИ И ДРУГИ СЪБИТИЯ
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 size-8">
              <Globe className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                5. Организиране и провеждане на демонстрации и събития
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Популяризиране на бадминтона сред училищата и общността в гр.
                Гълъбово
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {report.demonstrations.list.map((demo) => (
            <div
              key={demo.id}
              className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-none bg-purple-50 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    {demo.date}
                  </Badge>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {demo.title}
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Партньор: {demo.partner}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {demo.description}
              </p>
              {demo.participants && (
                <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                  Участници: {demo.participants}
                </p>
              )}
            </div>
          ))}
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          8. РАЗДЕЛ 6: АНАЛИЗ НА РЕЗУЛТАТИТЕ (МЕДАЛИ И СЪВПАДЕНИЯ)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 size-8">
              <Trophy className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                6. Анализ на резултатите (Спечелени медали)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Автоматично съпоставяне на състезателите от командировките и
                класиранията на „БК Гълъбово“
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReport(selectedYear)}
              className="h-7 gap-1 text-[11px] rounded-lg dark:border-zinc-800"
            >
              <RefreshCw className="size-3" />
              Пресканирай
            </Button>
          </div>
        </div>

        {/* Резюме на медалите по нива */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Зонални първенства
              </span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {report.medalsAnalysis.zonalCount} медала
              </div>
            </div>
            <span className="text-xl">🥉</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Държавни първенства
              </span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {report.medalsAnalysis.stateCount} медал
              </div>
            </div>
            <span className="text-xl">🥈</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Национални турнири
              </span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {report.medalsAnalysis.nationalCount} медала
              </div>
            </div>
            <span className="text-xl">🥇</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Международни турнири
              </span>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {report.medalsAnalysis.internationalCount} медала
              </div>
            </div>
            <span className="text-xl">🌍</span>
          </div>
        </div>

        {/* Форма за бързо добавяне / корекция на медал */}
        <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            + Добави медалист / състезател от първенство:
          </h4>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-5">
            <Input
              placeholder="Име на състезател..."
              value={newMedalAthlete}
              onChange={(e) => setNewMedalAthlete(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-zinc-900 sm:col-span-2"
            />
            <Input
              placeholder="Име на състезание..."
              value={newMedalTournament}
              onChange={(e) => setNewMedalTournament(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-zinc-900"
            />
            <Select
              value={newMedalType}
              onValueChange={(
                val: "zonal" | "state" | "national" | "international"
              ) => setNewMedalType(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zonal" className="text-xs">
                  Зонално първенство
                </SelectItem>
                <SelectItem value="state" className="text-xs">
                  Държавно първенство
                </SelectItem>
                <SelectItem value="national" className="text-xs">
                  Национален турнир
                </SelectItem>
                <SelectItem value="international" className="text-xs">
                  Международен турнир
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select
                value={String(newMedalPlace)}
                onValueChange={(val) =>
                  setNewMedalPlace(Number(val) as 1 | 2 | 3 | 4)
                }
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs">
                    🥇 1-во място (Злато)
                  </SelectItem>
                  <SelectItem value="2" className="text-xs">
                    🥈 2-ро място (Сребро)
                  </SelectItem>
                  <SelectItem value="3" className="text-xs">
                    🥉 3-то място (Бронз)
                  </SelectItem>
                  <SelectItem value="4" className="text-xs">
                    3-4 място
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddMedal}
                className="h-8 shrink-0 bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Списък с идентифицирани медалисти */}
        {report.medalsAnalysis.medalsList.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-xs font-medium text-zinc-500">
              Идентифицирани медалисти от състезания:
            </Label>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {report.medalsAnalysis.medalsList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/60 bg-white p-2 text-xs shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {m.place === 1
                        ? "🥇"
                        : m.place === 2
                          ? "🥈"
                          : m.place === 3
                            ? "🥉"
                            : "🏅"}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {m.athleteName}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {m.tournamentName}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-none text-[9px] uppercase bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {m.tournamentType === "zonal"
                        ? "Зонално"
                        : m.tournamentType === "state"
                          ? "Държавно"
                          : m.tournamentType === "international"
                            ? "Международно"
                            : "Национално"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMedal(m.id)}
                    className="p-0 text-zinc-400 hover:text-red-500 size-6"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          9. ОФИЦИАЛНА БЛАНКА ЗА ПЕЧАТ (Скрита, рендира се при PDF експорт)
      ───────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden size-0">
        <div
          ref={printableRef}
          className="p-10 bg-white text-zinc-900 font-sans w-200 max-w-200 mx-auto text-xs leading-relaxed"
        >
          {/* Официална шапка на Бадминтон Клуб Гълъбово */}
          <div className="border-b-2 border-indigo-900 pb-4 text-center">
            <h1 className="text-base font-bold uppercase tracking-wider text-indigo-950">
              {report.organizationName}
            </h1>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase mt-0.5">
              ОТЧЕТ ЗА ДЕЙНОСТТА ПРЕЗ {selectedYear} ГОДИНА
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              от {coachName} – {coachRole}
            </p>
          </div>

          <p className="mt-4">
            Дейността ми като треньор по бадминтон към {report.organizationName}{" "}
            за {selectedYear} година бе в следните основни направления:
          </p>

          <ol className="list-decimal pl-5 space-y-0.5 mt-2 font-medium">
            <li>Организиране и провеждане на тренировки по бадминтон.</li>
            <li>Подготовка и участие в състезания.</li>
            <li>Организиране и провеждане на състезания по бадминтон.</li>
            <li>Организиране и провеждане на летен спортен лагер.</li>
            <li>
              Организиране и/или провеждане и участие в/на демонстрации по
              бадминтон.
            </li>
            <li>Анализ на постигнатите резултати.</li>
          </ol>

          {/* 1 & 2. Тренировки */}
          <div className="mt-5">
            <h3 className="font-bold border-b border-zinc-300 pb-1 uppercase text-indigo-900">
              1. и 2. Организиране и провеждане на тренировки и състезания
            </h3>
            <p className="mt-1.5 text-justify">
              {report.trainings.description}
            </p>
            <p className="mt-2 font-semibold">
              За {selectedYear} година тренировките се проведоха както следва
              (Общо {report.trainings.totalCount} тренировки):
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 border border-zinc-200 p-2 text-[11px] bg-zinc-50">
              {report.trainings.monthly.map((m) => (
                <div key={m.month}>
                  • м. {m.monthName.toUpperCase()}:{" "}
                  <strong>{m.conductedCount} тр.</strong>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Състезания */}
          <div className="mt-5">
            <h3 className="font-bold border-b border-zinc-300 pb-1 uppercase text-indigo-900">
              3. Организиране и провеждане на състезания
            </h3>
            <p className="mt-1.5">{report.organizedTournaments.description}</p>
            <ul className="list-disc pl-5 space-y-1 mt-1.5">
              {report.organizedTournaments.list.map((t, idx) => (
                <li key={idx}>
                  <strong>Месец {t.month}:</strong> {t.title} ({t.ageGroups})
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Лагер */}
          <div className="mt-5">
            <h3 className="font-bold border-b border-zinc-300 pb-1 uppercase text-indigo-900">
              4. Организиране и провеждане на летен спортен лагер
            </h3>
            <p className="mt-1.5">
              <strong>{report.sportsCamp.title}</strong> –{" "}
              {report.sportsCamp.dateRange} – {report.sportsCamp.facility},{" "}
              {report.sportsCamp.location}.
            </p>
            <p className="mt-1">
              В рамките на лагера се осъществиха общо{" "}
              <strong>
                {report.sportsCamp.sessionsCount} интензивни тренировъчни
                занимания
              </strong>
              , посветени на цялостната физическа и тактическа подготовка.
            </p>
            <ul className="list-disc pl-5 space-y-0.5 mt-1">
              {report.sportsCamp.focusAreas.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>

          {/* 5. Демонстрации */}
          <div className="mt-5">
            <h3 className="font-bold border-b border-zinc-300 pb-1 uppercase text-indigo-900">
              5. Организиране и провеждане на демонстрации и събития
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 mt-1.5">
              {report.demonstrations.list.map((d, idx) => (
                <li key={idx}>
                  <strong>
                    {d.title} ({d.date}):
                  </strong>{" "}
                  {d.description}
                </li>
              ))}
            </ul>
          </div>

          {/* 6. Резултати */}
          <div className="mt-5">
            <h3 className="font-bold border-b border-zinc-300 pb-1 uppercase text-indigo-900">
              6. Анализ на резултатите (Спечелени медали)
            </h3>
            <p className="mt-1.5">{report.medalsAnalysis.description}</p>
            <div className="mt-2 border border-zinc-300 p-2.5 bg-zinc-50 font-medium">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  • Зонални първенства:{" "}
                  <strong>{report.medalsAnalysis.zonalCount} медала</strong>
                </div>
                <div>
                  • Държавни първенства:{" "}
                  <strong>{report.medalsAnalysis.stateCount} медал</strong>
                </div>
                <div>
                  • Национални турнири:{" "}
                  <strong>{report.medalsAnalysis.nationalCount} медала</strong>
                </div>
                <div>
                  • Международни турнири:{" "}
                  <strong>
                    {report.medalsAnalysis.internationalCount} медала
                  </strong>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-200 text-center text-sm font-bold text-indigo-950">
                ОБЩО СПЕЧЕЛЕНИ МЕДАЛИ ПРЕЗ {selectedYear} Г.:{" "}
                {report.medalsAnalysis.totalMedals} МЕДАЛА
              </div>
            </div>
          </div>

          {/* Подпис */}
          <div className="mt-8 flex justify-end">
            <div className="text-right">
              <p className="font-semibold">Изготвил:</p>
              <div className="h-10"></div>
              <p className="font-bold uppercase">{coachName}</p>
              <p className="text-zinc-500">{coachRole}</p>
              <p className="text-zinc-500">{report.organizationName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
