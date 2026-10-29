"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Cake,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Dumbbell,
  Edit3,
  ExternalLink,
  Eye,
  Hourglass,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DocumentAttachmentType,
  DocumentViewerDialog,
  getDocumentIcon,
} from "@/components/schedule/DocumentViewerDialog";
import { EventInquiryDialog } from "@/components/shared/schedule/EventInquiryDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useParentPortal } from "@/hooks/useParentPortal";
import {
  cancelParentAbsenceAction,
  changeParentPasswordAction,
  parentLogoutAction,
  recordParentActivityAction,
  recordParentHeartbeatAction,
  submitDataCorrectionAction,
  submitParentAbsenceAction,
} from "@/lib/actions/parent-portal";
import { cn } from "@/lib/utils";
import { ParentMemberPermissions } from "@/types/parent-portal.types";

const FIELD_CONFIG: Array<{
  key: string;
  label: string;
  permKey: keyof ParentMemberPermissions;
}> = [
  { key: "birthDate", label: "Дата на раждане", permKey: "showBirthDate" },
  { key: "ageGroup", label: "Възрастова група", permKey: "showAgeGroup" },
  { key: "phone", label: "Телефон на детето", permKey: "showPhone" },
  { key: "address", label: "Адрес", permKey: "showAddress" },
  { key: "school", label: "Училище", permKey: "showSchool" },
  { key: "height", label: "Ръст (см)", permKey: "showHeight" },
  { key: "weight", label: "Тегло (кг)", permKey: "showWeight" },
  { key: "dominantHand", label: "Водеща ръка", permKey: "showDominantHand" },
  {
    key: "apparelSize",
    label: "Размер екипировка",
    permKey: "showApparelSize",
  },
  {
    key: "emergencyContact",
    label: "Телефон за спешни случаи",
    permKey: "showEmergencyContact",
  },
  {
    key: "healthNotes",
    label: "Здравни бележки / Алергии",
    permKey: "showHealthNotes",
  },
];

const URL_OR_ROUTE_REGEX = /(https?:\/\/[^\s]+|\/tournaments\/[a-zA-Z0-9_-]+)/g;

const renderPublicTextWithLinks = (text: string) => {
  const parts = text.split(URL_OR_ROUTE_REGEX);
  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={`ext-link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>{part}</span>
          <ExternalLink className="inline size-3 shrink-0 opacity-70" />
        </a>
      );
    }
    if (part.startsWith("/tournaments/")) {
      return (
        <a
          key={`int-link-${index}`}
          href={part}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-semibold text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
        >
          <span>{part}</span>
          <ExternalLink className="inline size-3 shrink-0 opacity-70" />
        </a>
      );
    }
    return part;
  });
};

export default function ParentPortalClient() {
  const router = useRouter();
  const {
    parent,
    children,
    selectedChild,
    permissions,
    visibleData,
    pendingCorrections,
    absences,
    attendances,
    nextTraining,
    announcements,
    selectedChildId,
    setSelectedChildId,
    refetch,
    isLoading,
    isUnauthorized,
  } = useParentPortal();

  // Document preview dialog
  const [activeDocViewer, setActiveDocViewer] = useState<{
    url: string;
    name?: string | null;
    type?: DocumentAttachmentType | null;
  } | null>(null);

  // Event inquiry / sign-up dialog
  const [activeInquiryEvent, setActiveInquiryEvent] = useState<{
    id?: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    type?: string;
  } | null>(null);

  // Expanded event descriptions
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {}
  );

  const toggleEventExpanded = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Welcome Tour Modal
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  // Absence Dialog State
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceType, setAbsenceType] = useState<"single_day" | "period">(
    "single_day"
  );
  const [absenceStartDate, setAbsenceStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [absenceEndDate, setAbsenceEndDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [absenceReason, setAbsenceReason] = useState<
    "illness" | "school" | "travel" | "injury" | "other"
  >("illness");
  const [absenceNote, setAbsenceNote] = useState("");
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);

  // Correction Dialog State
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [activeCorrectionField, setActiveCorrectionField] = useState<{
    key: string;
    label: string;
    currentValue: string;
  } | null>(null);
  const [proposedValue, setProposedValue] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Change Password Dialog State
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Attendance Month Selection
  const [selectedMonth, setSelectedMonth] = useState<number>(() =>
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );

  // Redirect if unauthorized
  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/club/parents/login");
    }
  }, [isUnauthorized, router]);

  // Check if first-time user for Welcome Tour
  useEffect(() => {
    if (parent?.id) {
      const tourKey = `bkgalabovo_parent_tour_seen_${parent.id}`;
      const seen = localStorage.getItem(tourKey);
      if (!seen) {
        setShowWelcomeTour(true);
      }
    }
  }, [parent?.id]);

  // Heartbeat presence & initial view log
  useEffect(() => {
    if (!parent?.id) return;

    recordParentHeartbeatAction().catch(() => {});
    recordParentActivityAction({
      action: "view_dashboard",
      actionTitle: "Преглед на родителското табло",
      memberId: selectedChild?.id,
      memberName: selectedChild?.fullName,
    }).catch(() => {});

    const interval = setInterval(() => {
      recordParentHeartbeatAction().catch(() => {});
    }, 45000);

    return () => clearInterval(interval);
  }, [parent?.id, selectedChild?.id, selectedChild?.fullName]);

  const handleTabChange = (tab: string) => {
    let actionTitle = "Преглед на месечни присъствия";
    let action: "view_attendance" | "view_profile" | "view_dashboard" =
      "view_attendance";
    if (tab === "profile") {
      actionTitle = "Преглед на картона на детето";
      action = "view_profile";
    } else if (tab === "absences") {
      actionTitle = "Преглед на извиненията";
      action = "view_dashboard";
    }
    recordParentActivityAction({
      action,
      actionTitle,
      details: selectedChild ? `За ${selectedChild.fullName}` : undefined,
      memberId: selectedChild?.id,
      memberName: selectedChild?.fullName,
    }).catch(() => {});
  };

  const handleCloseWelcomeTour = () => {
    if (parent?.id) {
      localStorage.setItem(`bkgalabovo_parent_tour_seen_${parent.id}`, "true");
    }
    setShowWelcomeTour(false);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await parentLogoutAction();
      toast.success("Успешно излязохте от профила.");
      router.push("/club/parents/login");
    } catch {
      toast.error("Грешка при изход.");
    }
  };

  // Birthday check
  const isBirthdayToday = useMemo(() => {
    if (!selectedChild?.dateOfBirth) return false;
    try {
      const bDate = new Date(selectedChild.dateOfBirth);
      const today = new Date();
      return (
        bDate.getDate() === today.getDate() &&
        bDate.getMonth() === today.getMonth()
      );
    } catch {
      return false;
    }
  }, [selectedChild]);

  // Filter attendances for selected month & year
  const monthlyAttendances = useMemo(() => {
    return attendances.filter((a) => {
      if (!a.startDate) return false;
      const d = new Date(a.startDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [attendances, selectedMonth, selectedYear]);

  const attendanceStats = useMemo(() => {
    const total = monthlyAttendances.length;
    const attended = monthlyAttendances.filter((a) => a.attended).length;
    const pastTrainings = monthlyAttendances.filter((a) => !a.isUpcoming);
    const denominator = pastTrainings.length > 0 ? pastTrainings.length : total;
    const rate =
      denominator > 0 ? Math.round((attended / denominator) * 100) : 0;
    const missed = Math.max(0, pastTrainings.length - attended);
    return { total, attended, missed, rate };
  }, [monthlyAttendances]);

  // Absence Submit Handler
  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild?.id) return;

    setIsSubmittingAbsence(true);
    try {
      const res = await submitParentAbsenceAction({
        memberId: selectedChild.id,
        type: absenceType,
        startDate: absenceStartDate,
        endDate: absenceType === "period" ? absenceEndDate : null,
        reason: absenceReason,
        note: absenceNote,
      });

      if (res.success) {
        toast.success("Уведомлението за отсъствие е изпратено на треньора!");
        setAbsenceDialogOpen(false);
        setAbsenceNote("");
        refetch();
      } else {
        toast.error("Неуспешно изпращане", { description: res.error });
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSubmittingAbsence(false);
    }
  };

  // Cancel Absence Handler
  const handleCancelAbsence = async (absenceId: string) => {
    if (!confirm("Сигурни ли сте, че искате да отмените това уведомление?"))
      return;
    try {
      const res = await cancelParentAbsenceAction(absenceId);
      if (res.success) {
        toast.success("Отсъствието беше отменено.");
        refetch();
      } else {
        toast.error(res.error || "Грешка при отмяна.");
      }
    } catch {
      toast.error("Грешка при отмяна.");
    }
  };

  // Correction Submit Handler
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild?.id || !activeCorrectionField) return;

    if (!proposedValue.trim()) {
      toast.error("Моля, въведете новата стойност.");
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await submitDataCorrectionAction({
        memberId: selectedChild.id,
        fieldKey: activeCorrectionField.key,
        fieldLabel: activeCorrectionField.label,
        currentValue: activeCorrectionField.currentValue,
        proposedValue: proposedValue.trim(),
        note: correctionNote.trim(),
      });

      if (res.success) {
        toast.success(
          "Заявката за корекция е изпратена! Треньорът ще я прегледа и одобри."
        );
        setCorrectionDialogOpen(false);
        setProposedValue("");
        setCorrectionNote("");
        refetch();
      } else {
        toast.error("Грешка при изпращане", { description: res.error });
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const openCorrectionDialog = (
    key: string,
    label: string,
    currentValue: string
  ) => {
    setActiveCorrectionField({ key, label, currentValue });
    setProposedValue(currentValue || "");
    setCorrectionNote("");
    setCorrectionDialogOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error("Моля, попълнете текущата и новата парола.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Новата парола и потвърждението не съвпадат.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Новата парола трябва да бъде поне 6 символа.");
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await changeParentPasswordAction(
        currentPassword,
        newPassword
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при смяна на паролата.");
      } else {
        toast.success(
          "Паролата е сменена успешно! Вече можете да влизате с новата си парола."
        );
        setChangePwdOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const monthNames = [
    "Януари",
    "Февруари",
    "Март",
    "Април",
    "Май",
    "Юни",
    "Юли",
    "Август",
    "Септември",
    "Октомври",
    "Ноември",
    "Декември",
  ];

  if (isLoading && !parent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-sm text-zinc-500">
          Зареждане на родителския портал...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="rounded-3xl border border-zinc-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <Image
                src="/icons/LOGO.jpg"
                alt="Бадминтон Клуб Гълъбово"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Родителски портал
                </span>
                <span className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[11px] text-zinc-500">
                  СНЦ „Бадминтон клуб Гълъбово“
                </span>
              </div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white sm:text-xl">
                Здравейте, {parent?.name || "Родител"}!
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangePwdOpen(true)}
              className="h-9 gap-1.5 rounded-xl border-blue-200 bg-blue-50/70 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300"
            >
              <KeyRound className="size-3.5" />
              <span>Смяна на парола</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 gap-1.5 rounded-xl text-xs text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Изход</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Upcoming Competitions, Camps & Events ───────────────────── */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Trophy className="size-4 text-amber-500" />
              Предстоящи състезания, лагери и събития
            </h2>
            <Link
              href="/club/schedule"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Пълен календар →
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => {
              const isExpanded = !!expandedEvents[a.id];
              const eventType =
                a.type || (a.isTournament ? "competition" : "event");
              const isCompetition =
                eventType === "competition" || a.isTournament;
              const isCamp = eventType === "camp";

              return (
                <div
                  key={a.id}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border bg-white p-5 shadow-xs transition-all dark:bg-zinc-900",
                    isCompetition
                      ? "border-amber-200/90 hover:border-amber-400/80 dark:border-amber-900/40 dark:hover:border-amber-700/60"
                      : isCamp
                        ? "border-emerald-200/90 hover:border-emerald-400/80 dark:border-emerald-900/40 dark:hover:border-emerald-700/60"
                        : "border-blue-200/90 hover:border-blue-400/80 dark:border-blue-900/40 dark:hover:border-blue-700/60"
                  )}
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Top Row: Type Badge, Title, Sign-up button */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              isCompetition
                                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                                : isCamp
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300"
                            )}
                          >
                            <span>
                              {isCamp ? "⛺" : isCompetition ? "🏆" : "🏸"}
                            </span>
                            <span>
                              {isCamp
                                ? "Спортен лагер"
                                : isCompetition
                                  ? "Държавно първенство / Турнир"
                                  : "Клубно събитие"}
                            </span>
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug sm:text-lg">
                          {a.title.replace(/^[^\w\sа-яА-ЯёЁ]+/, "").trim()}
                        </h3>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setActiveInquiryEvent({
                              id: a.id,
                              title: a.title,
                              startTime: a.startDate || a.date,
                              endTime: a.endDate || a.startDate || a.date,
                              location: a.location,
                              type: a.type,
                            })
                          }
                          className="h-9 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          Запиши се
                        </Button>
                      </div>
                    </div>

                    {/* Period and Location details */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                        <Clock className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>Период: {a.periodText || a.content}</span>
                      </div>

                      {a.location && (
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <MapPin className="size-4 shrink-0 text-rose-500 dark:text-rose-400" />
                          <span>{a.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Optional Event Image */}
                    {a.imageUrl && (
                      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Action Bar: Tournament Links, Document Attachments, Notes */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      {/* Tournament link */}
                      {a.tournamentUrl && (
                        <a
                          href={a.tournamentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
                        >
                          <Trophy className="size-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Страница на състезанието / Схема</span>
                          <ExternalLink className="size-3 opacity-70" />
                        </a>
                      )}

                      {/* Document attachment / regulations */}
                      {a.attachmentUrl && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveDocViewer({
                                url: a.attachmentUrl!,
                                name:
                                  a.attachmentName || "Наредба за състезанието",
                                type:
                                  (a.attachmentType as DocumentAttachmentType) ||
                                  "pdf",
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            {getDocumentIcon(
                              (a.attachmentType as DocumentAttachmentType) ||
                                "pdf",
                              "size-3.5"
                            )}
                            <span className="max-w-44 truncate sm:max-w-72">
                              {a.attachmentName || "Наредба за състезанието"}
                            </span>
                            <Eye className="size-3 opacity-70" />
                          </button>
                          <a
                            href={a.attachmentUrl}
                            download={a.attachmentName || "document"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            title="Изтегли файла"
                          >
                            <Download className="size-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Description toggle */}
                      {a.description && (
                        <button
                          type="button"
                          onClick={() => toggleEventExpanded(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Info className="size-3.5 text-blue-500" />
                          <span>
                            {isExpanded
                              ? "Свий описанието"
                              : "Виж подробности и бележки"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expandable Description Content */}
                    <AnimatePresence>
                      {isExpanded && a.description && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-zinc-300">
                            {renderPublicTextWithLinks(a.description)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Birthday Card 🎉 ────────────────────────────────────────── */}
      {isBirthdayToday && selectedChild && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-linear-to-r from-amber-100 via-rose-100 to-amber-100 p-6 shadow-md dark:border-amber-700/50 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-950/40">
          <div className="relative z-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <Cake className="size-7 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-amber-950 dark:text-amber-200 sm:text-xl">
                Честит Рожден Ден, {selectedChild.firstName}! 🎂🎈
              </h2>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                От целия екип на Бадминтон Клуб Гълъбово ти пожелаваме крепко
                здраве, спортен дух, много спечелени геймове и шампионски купи!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sibling Switcher (If multiple children) ─────────────────── */}
      {children.length > 1 && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            Деца в семейството ({children.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-left transition-all",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100"
                      : "border-zinc-200/70 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <Avatar className="size-7 rounded-xl border border-white dark:border-zinc-800">
                    <AvatarImage
                      src={child.avatarUrl || ""}
                      alt={child.fullName}
                    />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {child.firstName[0]}
                      {child.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold leading-tight">
                      {child.fullName}
                    </p>
                    {child.trainingGroup ? (
                      <p className="text-[9px] text-zinc-400">
                        {child.trainingGroup}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Next Training Card 🏸 ───────────────────────────────────── */}
      {nextTraining && (
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border p-5 shadow-xs transition-all",
            nextTraining.isToday
              ? "border-emerald-300 bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:border-emerald-700/50 dark:from-emerald-950/30"
              : "border-blue-200 bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:border-blue-800/40 dark:from-blue-950/30"
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm text-white",
                  nextTraining.isToday ? "bg-emerald-600" : "bg-blue-600"
                )}
              >
                <Dumbbell className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
                    Следваща тренировка
                  </span>
                  {nextTraining.isToday && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase animate-pulse">
                      Днес
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white sm:text-lg">
                  {nextTraining.title}
                </h3>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {nextTraining.dateText}, {nextTraining.timeText}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-zinc-400" />
                    {nextTraining.location}
                  </span>
                  <span className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="flex items-center gap-1">
                    <Users className="size-3 text-zinc-400" />
                    {nextTraining.groupName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/club/schedule">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <CalendarDays className="mr-1.5 size-3.5" />
                  График
                </Button>
              </Link>
              <Button
                onClick={() => setAbsenceDialogOpen(true)}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-amber-300 bg-amber-50/70 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <CalendarX2 className="mr-1.5 size-3.5" />
                Уведоми за отсъствие
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Child Profile Header & Status ──────────────────────────── */}
      {selectedChild && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 rounded-3xl border-2 border-white bg-zinc-100 shadow-md sm:size-20 dark:border-zinc-800 dark:bg-zinc-800">
                <AvatarImage
                  src={selectedChild.avatarUrl || ""}
                  alt={selectedChild.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl font-bold text-zinc-400">
                  {selectedChild.firstName[0]}
                  {selectedChild.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                    {selectedChild.fullName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="mr-1 size-3" /> Активен състезател
                  </Badge>
                  {selectedChild.isLicensed && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      <Award className="mr-1 size-3" /> Картотекиран в БФБ
                    </Badge>
                  )}
                  {selectedChild.trainingGroup ? (
                    <Badge
                      variant="outline"
                      className="border-zinc-200 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      {selectedChild.trainingGroup}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setAbsenceDialogOpen(true)}
              className="h-11 w-full rounded-2xl bg-zinc-950 text-xs font-semibold tracking-wider text-white uppercase shadow-none transition-all hover:bg-zinc-800 sm:w-auto"
            >
              <CalendarX2 className="mr-2 size-4" />
              Отсъствие
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Navigation Tabs ────────────────────────────────────── */}
      <Tabs
        defaultValue="attendance"
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid h-12 w-full grid-cols-3 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
          <TabsTrigger
            value="attendance"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <CalendarIcon className="mr-1.5 size-3.5" />
            Присъствия
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <User className="mr-1.5 size-3.5" />
            Данни за детето
          </TabsTrigger>
          <TabsTrigger
            value="absences"
            className="rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <CalendarX2 className="mr-1.5 size-3.5" />
            Заявени отсъствия
            {absences.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {absences.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Attendance History & Calendar ─────────────────── */}
        <TabsContent
          value="attendance"
          className="mt-4 space-y-4 focus-visible:outline-none"
        >
          {/* Month & Year Bar */}
          <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="size-8 rounded-xl border-zinc-200 dark:border-zinc-700"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="min-w-44 text-center">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {monthNames[selectedMonth]} {selectedYear} г.
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="size-8 rounded-xl border-zinc-200 dark:border-zinc-700"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-[10px] text-zinc-400">Тренировки</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {attendanceStats.total}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Присъствал
                </p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {attendanceStats.attended}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2 text-center dark:border-blue-950 dark:bg-blue-950/20">
                <p className="text-[10px] text-blue-700 dark:text-blue-400">
                  Посещаемост
                </p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {attendanceStats.rate}%
                </p>
              </div>
            </div>
          </div>

          {/* Attendance list */}
          <div className="space-y-2">
            {monthlyAttendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                <CalendarIcon className="size-8 text-zinc-300 mb-2 stroke-1.5" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Няма регистрирани тренировки за {monthNames[selectedMonth]}{" "}
                  {selectedYear}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                  Присъствията се въвеждат редовно от треньорите в залата след
                  всяка тренировъчна сесия.
                </p>
              </div>
            ) : (
              monthlyAttendances.map((item) => {
                const dateObj = new Date(item.startDate);
                const dayNum = dateObj.getDate();
                const dayName = dateObj.toLocaleDateString("bg-BG", {
                  weekday: "short",
                });
                const timeStr = dateObj.toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-all hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 flex-col items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        <span className="text-[10px] font-semibold uppercase text-zinc-400 leading-none">
                          {dayName}
                        </span>
                        <span className="text-base font-bold leading-none mt-0.5">
                          {dayNum}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {timeStr} ч. • {item.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.attended ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="mr-1 size-3" /> Присъствал
                        </Badge>
                      ) : item.isUpcoming ? (
                        <Badge
                          variant="outline"
                          className="border-sky-200 bg-sky-50/70 text-[10px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                        >
                          <Clock className="mr-1 size-3" /> Предстояща
                        </Badge>
                      ) : item.isExcused ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50/80 text-[10px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <CalendarX2 className="mr-1 size-3" /> Заявено
                          отсъствие
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50/60 text-[10px] font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          <XCircle className="mr-1 size-3" /> Отсъствал
                        </Badge>
                      )}
                      {item.isExcused && item.coachReply && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          Треньор: „{item.coachReply}“
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: Child Profile (Strict Granular Permissions) ────── */}
        <TabsContent
          value="profile"
          className="mt-4 space-y-4 focus-visible:outline-none"
        >
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Лични данни в клубната картотека
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Показани са само потвърдените полета. Можете да заявите
                  корекция чрез моливчето ✏️.
                </p>
              </div>
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>

            {/* List of Fields */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Full name (Always visible) */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[10px] font-medium text-zinc-400 uppercase">
                    Име и фамилия
                  </p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {String(
                      visibleData?.fullName || selectedChild?.fullName || ""
                    )}
                  </p>
                </div>
                {pendingCorrections["fullName"] ? (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <Hourglass className="mr-1 size-2.5 animate-spin" />
                    Чака преглед
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openCorrectionDialog(
                        "fullName",
                        "Име и фамилия",
                        String(
                          visibleData?.fullName || selectedChild?.fullName || ""
                        )
                      )
                    }
                    className="h-7 gap-1 text-[11px] text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                  >
                    <Edit3 className="size-3" />
                    <span>Корекция</span>
                  </Button>
                )}
              </div>

              {/* Dynamic Permitted Fields */}
              {FIELD_CONFIG.map(({ key, label, permKey }) => {
                // If not permitted by admin, hide completely
                if (!permissions || !permissions[permKey]) {
                  return null;
                }

                const rawVal = visibleData
                  ? visibleData[key as keyof typeof visibleData]
                  : null;
                let displayVal = "Не е посочено";
                if (typeof rawVal === "boolean") {
                  displayVal = rawVal ? "Да (Валиден)" : "Не";
                } else if (rawVal) {
                  displayVal = String(rawVal);
                }

                const hasPending = !!pendingCorrections[key];

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-[10px] font-medium text-zinc-400 uppercase">
                        {label}
                      </p>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                        {displayVal}
                      </p>
                    </div>

                    <div>
                      {hasPending ? (
                        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1 text-[10px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                          <Hourglass className="size-3 text-amber-600" />
                          <span>
                            Чака одобрение (
                            {pendingCorrections[key]?.proposedValue})
                          </span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openCorrectionDialog(key, label, displayVal)
                          }
                          className="h-7 gap-1 text-[11px] text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                        >
                          <Edit3 className="size-3" />
                          <span>Корекция</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: Absence Notices ───────────────────────────────── */}
        <TabsContent
          value="absences"
          className="mt-4 space-y-4 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-white">
              Подадени извинения за отсъствие
            </h3>
            <Button
              onClick={() => setAbsenceDialogOpen(true)}
              size="sm"
              className="h-8 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
            >
              <Plus className="mr-1.5 size-3.5" />
              Ново отсъствие
            </Button>
          </div>

          <div className="space-y-2.5">
            {absences.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                <CalendarX2 className="size-8 text-zinc-300 mb-2 stroke-1.5" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Нямате подадени извинения за отсъствия
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                  Ако детето ви е болно или възпрепятствано, натиснете бутона
                  „Ново отсъствие“, за да уведомите треньора предварително.
                </p>
              </div>
            ) : (
              absences.map((abs) => {
                const isSeen = abs.status === "seen";
                const isCancelled = abs.status === "cancelled_by_parent";

                return (
                  <div
                    key={abs.id}
                    className="space-y-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            {abs.type === "period"
                              ? `Период: ${abs.startDate} — ${abs.endDate || abs.startDate}`
                              : `Дата: ${abs.startDate}`}
                          </span>
                          {isSeen ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="mr-1 size-3" />{" "}
                              Прегледано от треньор
                            </Badge>
                          ) : isCancelled ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-zinc-400"
                            >
                              Отменено
                            </Badge>
                          ) : (
                            <Badge className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                              Изпратено
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Причина:{" "}
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {abs.reason === "illness"
                              ? "Болест"
                              : abs.reason === "school"
                                ? "Учебни ангажименти"
                                : abs.reason === "travel"
                                  ? "Семейно пътуване"
                                  : abs.reason === "injury"
                                    ? "Контузия"
                                    : "Друго"}
                          </span>
                          {abs.note && ` • „${abs.note}“`}
                        </p>
                      </div>

                      {!isCancelled && !isSeen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAbsence(abs.id)}
                          className="h-7 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Отмени
                        </Button>
                      )}
                    </div>

                    {/* Coach Reply Note */}
                    {abs.coachReply && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <p className="font-semibold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Коментар от треньора:
                        </p>
                        <p className="mt-0.5">{abs.coachReply}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Absence Notification ───────────────────────────── */}
      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
              Уведоми за отсъствие
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Съобщението ще бъде отразено незабавно в системата и изпратено на
              треньора.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAbsence} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Тип на отсъствието
              </Label>
              <RadioGroup
                value={absenceType}
                onValueChange={(v: "single_day" | "period") =>
                  setAbsenceType(v)
                }
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-3 cursor-pointer transition-all",
                    absenceType === "single_day"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                  onClick={() => setAbsenceType("single_day")}
                >
                  <RadioGroupItem value="single_day" id="type_single" />
                  <Label
                    htmlFor="type_single"
                    className="text-xs font-medium cursor-pointer"
                  >
                    За 1 ден
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-3 cursor-pointer transition-all",
                    absenceType === "period"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                  onClick={() => setAbsenceType("period")}
                >
                  <RadioGroupItem value="period" id="type_period" />
                  <Label
                    htmlFor="type_period"
                    className="text-xs font-medium cursor-pointer"
                  >
                    За период
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="absence-start-date"
                  className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {absenceType === "period"
                    ? "От дата"
                    : "Дата на тренировката"}
                </Label>
                <Input
                  id="absence-start-date"
                  name="startDate"
                  type="date"
                  value={absenceStartDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setAbsenceStartDate(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              {absenceType === "period" && (
                <div className="space-y-1">
                  <Label
                    htmlFor="absence-end-date"
                    className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    До дата (включително)
                  </Label>
                  <Input
                    id="absence-end-date"
                    name="endDate"
                    type="date"
                    value={absenceEndDate}
                    min={absenceStartDate}
                    onChange={(e) => setAbsenceEndDate(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Причина за отсъствието
              </Label>
              <Select
                value={absenceReason}
                onValueChange={(
                  v: "illness" | "school" | "travel" | "injury" | "other"
                ) => setAbsenceReason(v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Изберете причина" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="illness">🤒 Болест / Настинка</SelectItem>
                  <SelectItem value="school">
                    📚 Учебни ангажименти / Изпит
                  </SelectItem>
                  <SelectItem value="travel">
                    ✈️ Семейно пътуване / Почивка
                  </SelectItem>
                  <SelectItem value="injury">
                    🩹 Контузия / Възстановяване
                  </SelectItem>
                  <SelectItem value="other">💬 Друго</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Допълнителен коментар (незадължително)
              </Label>
              <Textarea
                value={absenceNote}
                onChange={(e) => setAbsenceNote(e.target.value)}
                placeholder="напр. Има лека температура, ще си остане вкъщи до сряда..."
                className="rounded-xl text-xs resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbsenceDialogOpen(false)}
                className="h-10 rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAbsence}
                className="h-10 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
              >
                {isSubmittingAbsence ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Изпращане...
                  </>
                ) : (
                  "Изпрати извинението"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Data Correction ─────────────────────────────────── */}
      <Dialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
      >
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
              Заяви корекция на данни
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Полето: <strong>{activeCorrectionField?.label}</strong>. Треньорът
              ще прегледа заявката и с 1 клик ще обнови картона.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCorrection} className="space-y-4 pt-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[10px] text-zinc-400 uppercase">
                Текуща стойност:
              </span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {activeCorrectionField?.currentValue || "Няма въведена"}
              </p>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="correction-proposed-value"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Нова правилна стойност *
              </Label>
              <Input
                id="correction-proposed-value"
                name="proposedValue"
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder="Въведете новата стойност..."
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="correction-note"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Бележка към треньора (незадължително)
              </Label>
              <Textarea
                id="correction-note"
                name="note"
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="напр. Сменихме си адреса миналата седмица..."
                className="rounded-xl text-xs resize-none"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCorrectionDialogOpen(false)}
                className="h-10 rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCorrection}
                className="h-10 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
              >
                {isSubmittingCorrection ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Изпращане...
                  </>
                ) : (
                  "Изпрати заявката"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ─────────────────────────────────── */}
      <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
              <KeyRound className="size-5 text-blue-600" />
              Смяна на паролата за вход
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Въведете текущата си временна парола и изберете нова лична парола
              (поне 6 символа).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleChangePasswordSubmit}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="current-pwd-input"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Текуща парола (временната парола):
              </Label>
              <Input
                id="current-pwd-input"
                name="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="напр. xuv31iqk"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="new-pwd-input"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Нова лична парола (мин. 6 символа):
              </Label>
              <Input
                id="new-pwd-input"
                name="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Въведете нова парола"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-pwd-input"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Повторете новата парола:
              </Label>
              <Input
                id="confirm-pwd-input"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторете новата парола"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePwdOpen(false)}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isChangingPwd}
                className="rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {isChangingPwd ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  "Запази новата парола"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Welcome Tour Modal ──────────────────────────────────────── */}
      <Dialog open={showWelcomeTour} onOpenChange={setShowWelcomeTour}>
        <DialogContent className="max-w-md rounded-4xl p-6 sm:p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Sparkles className="size-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Добре дошли в Родителския портал!
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Специално създаден за родителите на СНЦ „Бадминтон клуб
                Гълъбово“, за да следите тренировъчния процес лесно и прозрачно:
              </p>
            </div>

            <div className="space-y-2.5 text-left text-xs">
              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <CalendarIcon className="size-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Присъствия в реално време
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Виждате всяка посетена или пропусната тренировка по месеци.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <CalendarX2 className="size-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Уведомяване при отсъствие от тренировка
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    С 1 клик информирате треньора предварително за ден или
                    период.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <Edit3 className="size-4 shrink-0 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Моливче ✏️ за корекция на данни
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Ако откриете неточност, я коригирате незабавно без излишни
                    обаждания.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCloseWelcomeTour}
              className="w-full h-11 rounded-2xl bg-blue-600 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
            >
              Разбрах, да започваме!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Document Viewer Dialog (for regulations, attachments) ──── */}
      {activeDocViewer && (
        <DocumentViewerDialog
          isOpen={!!activeDocViewer}
          onClose={() => setActiveDocViewer(null)}
          documentUrl={activeDocViewer.url}
          documentName={activeDocViewer.name || "Наредба за състезанието"}
          documentType={activeDocViewer.type}
        />
      )}

      {/* ── Event Inquiry / Sign-up Dialog ─────────────────────────── */}
      {activeInquiryEvent && (
        <EventInquiryDialog
          isOpen={!!activeInquiryEvent}
          onClose={() => setActiveInquiryEvent(null)}
          event={activeInquiryEvent}
        />
      )}
    </div>
  );
}
