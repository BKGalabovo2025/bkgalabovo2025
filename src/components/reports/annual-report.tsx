"use client";

import {
  AlertTriangle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Dumbbell,
  FileDown,
  FileText,
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
import Link from "next/link";
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
  initialYear = 2026,
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

  // Форма за добавяне на медал
  const [newMedalAthlete, setNewMedalAthlete] = useState("");
  const [newMedalTournament, setNewMedalTournament] = useState("");
  const [newMedalType, setNewMedalType] = useState<
    "zonal" | "state" | "national" | "international"
  >("zonal");
  const [newMedalPlace, setNewMedalPlace] = useState<1 | 2 | 3 | 4>(1);

  // Зареждане на отчета за избраната година
  const loadReport = async (year: number, forceRescan: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await getAnnualReportAction(
        year,
        initialCoachId,
        siteId,
        forceRescan
      );
      if (res.success && res.data) {
        setReport(res.data);
        if (res.data.coachName) setCoachName(res.data.coachName);
        if (res.data.coachRole) setCoachRole(res.data.coachRole);
        if (forceRescan) {
          toast.success(
            "Данните са пресканирани динамично от базата и качените протоколи!"
          );
        }
      } else {
        toast.error(res.error || "Грешка при зареждане на годишния отчет");
      }
    } catch (err) {
      console.error(err);
      toast.error("Възникна непредвидена грешка при зареждане");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Запис на отчета
  const handleSaveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const updatedReport: AnnualReportData = {
        ...report,
        coachName,
        coachRole,
        year: selectedYear,
      };
      const res = await saveAnnualReportAction(updatedReport);
      if (res.success) {
        toast.success("Годишният отчет е записан успешно в базата!");
        setReport(updatedReport);
      } else {
        toast.error(res.error || "Грешка при запис");
      }
    } catch (err) {
      console.error(err);
      toast.error("Неуспешен запис на отчета");
    } finally {
      setIsSaving(false);
    }
  };

  // Редакция на брой тренировки за конкретен месец
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
      toast.error("Моля, въведете състезател и име на състезанието");
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
      placementText: newMedalPlace === 4 ? "3/4" : String(newMedalPlace),
      notes: "Ръчно добавен от треньора",
    };

    const updatedList = [newMedal, ...report.medalsAnalysis.medalsList];
    const zonal = updatedList.filter(
      (m) => m.tournamentType === "zonal"
    ).length;
    const state = updatedList.filter(
      (m) => m.tournamentType === "state"
    ).length;
    const national = updatedList.filter(
      (m) => m.tournamentType === "national"
    ).length;
    const international = updatedList.filter(
      (m) => m.tournamentType === "international"
    ).length;

    setReport({
      ...report,
      medalsAnalysis: {
        ...report.medalsAnalysis,
        medalsList: updatedList,
        zonalCount: zonal,
        stateCount: state,
        nationalCount: national,
        internationalCount: international,
        totalMedals: updatedList.length,
      },
    });

    setNewMedalAthlete("");
    setNewMedalTournament("");
    toast.success("Медалът е добавен успешно!");
  };

  // Премахване на медал
  const handleRemoveMedal = (id: string) => {
    if (!report) return;
    const updatedList = report.medalsAnalysis.medalsList.filter(
      (m) => m.id !== id
    );

    const zonal = updatedList.filter(
      (m) => m.tournamentType === "zonal"
    ).length;
    const state = updatedList.filter(
      (m) => m.tournamentType === "state"
    ).length;
    const national = updatedList.filter(
      (m) => m.tournamentType === "national"
    ).length;
    const international = updatedList.filter(
      (m) => m.tournamentType === "international"
    ).length;

    setReport({
      ...report,
      medalsAnalysis: {
        ...report.medalsAnalysis,
        medalsList: updatedList,
        zonalCount: zonal,
        stateCount: state,
        nationalCount: national,
        internationalCount: international,
        totalMedals: updatedList.length,
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
        `Godishen_otchet_${selectedYear}_BK_Galabovo.pdf`,
        "portrait"
      );
      toast.success("PDF отчетът е генериран успешно!");
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при създаването на PDF документа.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Експорт към Word
  const handleExportWord = () => {
    if (!printableRef.current) return;
    const htmlContent = printableRef.current.innerHTML;
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Годишен отчет</title>" +
      "<style>body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; } " +
      "table { border-collapse: collapse; width: 100%; margin: 12px 0; } " +
      "th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; text-align: left; } " +
      "th { background-color: #f1f5f9; font-weight: bold; } " +
      "h1 { font-size: 16pt; color: #1e1b4b; text-align: center; text-transform: uppercase; margin-bottom: 4px; } " +
      "h2 { font-size: 13pt; color: #334155; text-align: center; text-transform: uppercase; margin-top: 0; } " +
      "h3 { font-size: 12pt; color: #1e1b4b; border-bottom: 1px solid #94a3b8; padding-bottom: 3px; margin-top: 16px; text-transform: uppercase; } " +
      ".badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; } " +
      "</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;

    const source =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Godishen_Otchet_${selectedYear}_BK_Galabovo.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    toast.success("Word файлът (.doc) е свален успешно!");
  };

  // Копиране на текст
  const handleCopyText = () => {
    if (!report) return;
    const text = `${report.organizationName.toUpperCase()}
ОТЧЕТ ЗА ДЕЙНОСТТА ПРЕЗ ${selectedYear} ГОДИНА
от ${coachName} – ${coachRole}

1. Организиране и провеждане на тренировки по бадминтон.
2. Подготовка и участие в състезания.
3. Организиране и провеждане на състезания по бадминтон.
4. Организиране и провеждане на летен спортен лагер.
5. Организиране и/или провеждане и участие в/на демонстрации по бадминтон.
6. Анализ на постигнатите резултати.

1. и 2. Организиране и провеждане на тренировки и състезания:
${report.trainings.description}
Общо проведени тренировки: ${report.trainings.totalCount} бр.
${report.trainings.monthly.map((m) => `• м. ${m.monthName}: ${m.conductedCount} тренировки`).join("\n")}

Официални състезателни командировки: ${report.competitions.tripsCount} бр.

3. Организиране и провеждане на състезания:
${report.organizedTournaments.description}
${report.organizedTournaments.list.map((t) => `• Месец ${t.month} – ${t.title} (${t.location})`).join("\n")}

4. Организиране и провеждане на летен спортен лагер:
${report.sportsCamp.title} – ${report.sportsCamp.dateRange} (${report.sportsCamp.facility}, ${report.sportsCamp.location}).
Проведени занимания: ${report.sportsCamp.sessionsCount} бр.
Участници: ${report.sportsCamp.participantsCount} състезатели.

5. Организиране и/или провеждане на демонстрации и обществени събития:
${report.demonstrations.list.map((d) => `• ${d.title} (${d.date}): ${d.description}`).join("\n")}

6. Анализ на резултатите (Спечелени медали):
• Зонални първенства – ${report.medalsAnalysis.zonalCount} медала
• Държавни първенства – ${report.medalsAnalysis.stateCount} медал
• Национални турнири – ${report.medalsAnalysis.nationalCount} медала
• Международни турнири – ${report.medalsAnalysis.internationalCount} медала
ОБЩО СПЕЧЕЛЕНИ МЕДАЛИ: ${report.medalsAnalysis.totalMedals} бр.`;

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
          Зареждане на реалния годишен отчет и извличане на класиранията от
          протоколите...
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
                100% реални данни от базата, турнирите, командировките и
                качените протоколи
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
                <FileText className="size-3.5" />
              )}
              PDF Отчет
            </Button>

            <Button
              size="sm"
              onClick={handleSaveReport}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="animate-spin size-3.5" />
              ) : (
                <Save className="size-3.5" />
              )}
              Запази промените
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ТРЕНЬОР И КЛУБ (Editable Header Parameters)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Треньор (Изготвил отчета):
            </Label>
            <Input
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className="mt-1 h-8 text-xs font-semibold bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <Label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Длъжност:
            </Label>
            <Input
              value={coachRole}
              onChange={(e) => setCoachRole(e.target.value)}
              className="mt-1 h-8 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <Label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Спортен клуб / Организация:
            </Label>
            <Input
              value={report.organizationName}
              onChange={(e) =>
                setReport({ ...report, organizationName: e.target.value })
              }
              className="mt-1 h-8 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          3. КАРТИ С КЛЮЧОВИ ПОКАЗАТЕЛИ (KPI Grid)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Проведени тренировки
            </span>
            <div className="flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 size-7">
              <Dumbbell className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.trainings.totalCount}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            За {selectedYear} година
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Командировки & Турнири
            </span>
            <div className="flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 size-7">
              <Flame className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.competitions.tripsCount}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {report.medalsAnalysis.withRankingsCount} с класиране /{" "}
            {report.medalsAnalysis.withoutRankingsCount} без
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Организирани турнири
            </span>
            <div className="flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 size-7">
              <Medal className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.organizedTournaments.list.length}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Зала „Енергетик“ Гълъбово
          </p>
        </BentoCard>

        <BentoCard className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Спортен лагер
            </span>
            <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 size-7">
              <Tent className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {report.sportsCamp.sessionsCount > 0 ? "1" : "0"}
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {report.sportsCamp.sessionsCount > 0
              ? `${report.sportsCamp.facility} (${report.sportsCamp.sessionsCount} сесии)`
              : "Няма проведен лагер"}
          </p>
        </BentoCard>

        <BentoCard className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
            От качени съдийски протоколи
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
            <div className="flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 size-8">
              <Medal className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                3. Организиране и провеждане на състезания
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Турнири, домакинствани от „БК Гълъбово“ в спортна зала
                „Енергетик“
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-purple-50/50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-none font-semibold text-xs"
          >
            {report.organizedTournaments.list.length} проведени турнира
          </Badge>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Описание на турнирната дейност на родна сцена:
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
          {report.organizedTournaments.list.length > 0 ? (
            report.organizedTournaments.list.map((tour, idx) => (
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
                      Място: {tour.location} · Дата: {tour.dateRange} ·
                      Възрастови групи: {tour.ageGroups}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">
              Няма регистрирани организирани състезания за {selectedYear}{" "}
              година.
            </div>
          )}
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
                Подготовка на състезателите в ММЦ Приморско
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-blue-50/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-none font-semibold text-xs"
          >
            {report.sportsCamp.sessionsCount} занимания ·{" "}
            {report.sportsCamp.participantsCount} състезатели
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
              className="mt-1 h-7 text-xs font-medium bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-[10px] text-zinc-400">Локация / База:</span>
            <Input
              value={report.sportsCamp.facility}
              onChange={(e) =>
                setReport({
                  ...report,
                  sportsCamp: {
                    ...report.sportsCamp,
                    facility: e.target.value,
                  },
                })
              }
              className="mt-1 h-7 text-xs font-medium bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-[10px] text-zinc-400">
              Брой тренировъчни сесии:
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
              className="mt-1 h-7 text-xs font-medium bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Описание на лагерната подготовка:
          </Label>
          <Textarea
            value={report.sportsCamp.description}
            onChange={(e) =>
              setReport({
                ...report,
                sportsCamp: {
                  ...report.sportsCamp,
                  description: e.target.value,
                },
              })
            }
            className="mt-1 min-h-15 text-xs leading-relaxed dark:bg-zinc-950"
          />
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          7. РАЗДЕЛ 5: ДЕМОНСТРАЦИИ И ОБЩЕСТВЕНИ СЪБИТИЯ
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400 size-8">
              <Globe className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                5. Организиране и провеждане на демонстрации и събития
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Популяризиране на бадминтона в училища, детски градини и
                обществени инициативи
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-pink-50/50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 border-none font-semibold text-xs"
          >
            {report.demonstrations.list.length} събития
          </Badge>
        </div>

        <div className="mt-4">
          <Label className="text-xs text-zinc-500">
            Описание на обществената дейност:
          </Label>
          <Textarea
            value={report.demonstrations.description}
            onChange={(e) =>
              setReport({
                ...report,
                demonstrations: {
                  ...report.demonstrations,
                  description: e.target.value,
                },
              })
            }
            className="mt-1 min-h-15 text-xs leading-relaxed dark:bg-zinc-950"
          />
        </div>

        <div className="mt-4 space-y-2">
          {report.demonstrations.list.length > 0 ? (
            report.demonstrations.list.map((demo, idx) => (
              <div
                key={demo.id || idx}
                className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {demo.title}
                  </h4>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Дата: {demo.date} · Място: {demo.partner}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {demo.description}
                </p>
                {demo.participants && (
                  <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Участници: {demo.participants}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">
              Няма регистрирани обществени събития за {selectedYear} година.
            </div>
          )}
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          8. РАЗДЕЛ 6: АНАЛИЗ НА РЕЗУЛТАТИТЕ (МЕДАЛИ, СЪСТЕЗАНИЯ И ПРОТОКОЛИ)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 size-8">
              <Trophy className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                6. Анализ на резултатите (Спечелени медали и статус на
                класиранията)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Автоматично сканиране на съдийските протоколи и извличане
                единствено на състезателите на „БК Гълъбово“
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReport(selectedYear, true)}
              className="h-7 gap-1 text-[11px] rounded-lg dark:border-zinc-800"
            >
              <RefreshCw className="size-3" />
              Пресканирай протоколите
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

        {/* 6A. Списък с всички официални състезателни командировки и техния статус на класиране */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Официални състезания за {selectedYear} г. и статус на качените
              класирания ({report.competitions.tripsList?.length || 0}):
            </h4>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />{" "}
                {report.medalsAnalysis.withRankingsCount} с качено класиране
              </span>
              <span className="text-zinc-300">·</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3" />{" "}
                {report.medalsAnalysis.withoutRankingsCount} без класиране
              </span>
            </div>
          </div>

          <div className="divide-y divide-zinc-200/60 rounded-xl border border-zinc-200/80 bg-zinc-50/50 max-h-72 overflow-y-auto dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40">
            {report.competitions.tripsList &&
            report.competitions.tripsList.length > 0 ? (
              report.competitions.tripsList.map((t) => (
                <div
                  key={t.tripId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {t.tripId ? (
                        <Link
                          href={`/accounting/trips/${t.tripId}`}
                          className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100 truncate"
                        >
                          {t.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {t.title}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase border-none bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {t.tournamentType === "zonal"
                          ? "Зонално"
                          : t.tournamentType === "state"
                            ? "Държавно"
                            : t.tournamentType === "international"
                              ? "Международно"
                              : "Национално"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      Място: {t.destination} · Участници ({t.participantsCount}
                      ): {t.participantsNames.join(", ") || "Няма отбелязани"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.hasRankingUploaded ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] gap-1">
                        <CheckCircle2 className="size-3" />
                        Качено класиране ({t.rankingFilesCount} файла)
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-700 border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] gap-1">
                        <AlertTriangle className="size-3" />
                        Няма качено класиране
                      </Badge>
                    )}
                    {t.medalsCount > 0 && (
                      <Badge className="bg-amber-500 text-white text-[10px]">
                        +{t.medalsCount} медала
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-zinc-400">
                Няма регистрирани състезателни командировки за {selectedYear}{" "}
                година.
              </div>
            )}
          </div>
        </div>

        {/* 6B. Списък с автоматично извлечените медалисти от съдийските протоколи */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Автоматично извлечени медалисти за „БК Гълъбово“ (
              {report.medalsAnalysis.medalsList.length}):
            </Label>
          </div>

          {report.medalsAnalysis.medalsList.length > 0 ? (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {report.medalsAnalysis.medalsList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/60 bg-white p-2.5 text-xs shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">
                      {m.place === 1 ? "🥇" : m.place === 2 ? "🥈" : "🥉"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {m.athleteName}
                        </span>
                        {m.partnerName && (
                          <span className="text-zinc-500 dark:text-zinc-400">
                            / {m.partnerName}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="border-none text-[9px] uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                        >
                          {m.placementText || (m.place === 4 ? "3/4" : m.place)}{" "}
                          МЯСТО
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-none text-[9px] uppercase bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {m.ageGroup}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        Състезание: {m.tournamentName}{" "}
                        {m.notes ? `· ${m.notes}` : ""}{" "}
                        {m.sourceAttachmentName
                          ? `· Файл: ${m.sourceAttachmentName}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMedal(m.id)}
                    className="p-0 text-zinc-400 hover:text-red-500 size-6 shrink-0"
                    title="Премахни запис"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
              Няма намерени класирания за {selectedYear} година. Качете съдийски
              протоколи в командировките или използвайте формата по-долу за
              ръчно добавяне.
            </div>
          )}
        </div>

        {/* 6C. Форма за бързо добавяне / корекция на медал */}
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            + Ръчно добавяне / корекция на медалист от първенство:
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
                    🥉 3-4 място
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddMedal}
                className="h-8 shrink-0 bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700"
                aria-label="Добави медал"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
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
            <p className="mt-2 text-justify">
              През {selectedYear} г. отборът на клуба реализира общо{" "}
              {report.competitions.tripsCount} официални състезателни
              командировки съгласно Държавния спортен календар на БФ Бадминтон.
            </p>
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
                  <strong>Месец {t.month}:</strong> {t.title} ({t.location})
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
              , посветени на цялостната физическа и тактическа подготовка на{" "}
              {report.sportsCamp.participantsCount} състезатели.
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

            {/* Списък на медалистите */}
            {report.medalsAnalysis.medalsList.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold mb-1">
                  Списък на завоюваните призови места:
                </p>
                <div className="space-y-1 text-[11px]">
                  {report.medalsAnalysis.medalsList.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-zinc-100 py-0.5"
                    >
                      <span>
                        {m.place === 1
                          ? "🥇 1-во място"
                          : m.place === 2
                            ? "🥈 2-ро място"
                            : "🥉 3-то място"}
                        : <strong>{m.athleteName}</strong>{" "}
                        {m.partnerName ? `/ ${m.partnerName}` : ""} (
                        {m.category === "singles"
                          ? "единично"
                          : m.category === "doubles"
                            ? "двойки"
                            : "смесени двойки"}
                        )
                      </span>
                      <span className="text-zinc-500">{m.tournamentName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
