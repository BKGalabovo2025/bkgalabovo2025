"use client";

/* eslint-disable sonarjs/cognitive-complexity */
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileDown,
  FileText,
  Info,
  Mail,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useState as useLocalState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { CreateBusinessTripDialog } from "@/components/business-trips/CreateBusinessTripDialog";
import { SignaturePadDialog } from "@/components/business-trips/SignaturePadDialog";
import { TripExpenseDialog } from "@/components/business-trips/TripExpenseDialog";
import { TripReportDialog } from "@/components/business-trips/TripReportDialog";
import { TripStatementEditDialog } from "@/components/business-trips/TripStatementEditDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import {
  checkTripCompleteness,
  countBySeverity,
} from "@/lib/business-trip-checklist";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { getAllMembers } from "@/services/member-service";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";

// ─── Collapsible checklist panel ─────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  error: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900/60",
    text: "text-red-700 dark:text-red-300",
    icon: <XCircle className="size-3.5 shrink-0 text-red-500" />,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/60",
    text: "text-amber-700 dark:text-amber-300",
    icon: <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />,
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-900/60",
    text: "text-sky-700 dark:text-sky-300",
    icon: <Info className="size-3.5 shrink-0 text-sky-500" />,
  },
};

function TripChecklistPanel({
  trip,
  expenses,
}: {
  trip: BusinessTrip;
  expenses: TripExpense[];
}) {
  const [expanded, setExpanded] = useLocalState(false);
  const [expandedHint, setExpandedHint] = useLocalState<string | null>(null);

  const issues = useMemo(
    () => checkTripCompleteness(trip, expenses),
    [trip, expenses]
  );
  const counts = countBySeverity(issues);

  if (issues.length === 0) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        Документите на командировката са пълни
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header / summary bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
      >
        <div className="flex items-center gap-2 text-xs">
          {counts.errors > 0 && (
            <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
              <XCircle className="size-3.5" />
              {counts.errors} грешки
            </span>
          )}
          {counts.warnings > 0 && (
            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
              {counts.warnings} предупреждения
            </span>
          )}
          {counts.infos > 0 && (
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <Info className="size-3.5" />
              {counts.infos} информация
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-zinc-400" />
        ) : (
          <ChevronDown className="size-4 text-zinc-400" />
        )}
      </button>

      {/* Issue list */}
      {expanded && (
        <div className="space-y-1.5 px-3 pb-3">
          {issues.map((item) => {
            const style = SEVERITY_STYLES[item.severity];
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-2 text-xs ${style.bg} ${style.border}`}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-2 text-left"
                  onClick={() =>
                    setExpandedHint((v) => (v === item.id ? null : item.id))
                  }
                >
                  {style.icon}
                  <span className={`font-medium ${style.text}`}>
                    {item.message}
                  </span>
                </button>
                {expandedHint === item.id && item.hint && (
                  <p
                    className={`mt-1.5 pl-5 leading-relaxed ${style.text} opacity-80`}
                  >
                    💡 {item.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function BusinessTripManagerDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent;
}) {
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>([]);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showBgnInPdf] = useState(false);
  const { user } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedTripForReport, setSelectedTripForReport] =
    useState<BusinessTrip | null>(null);

  const [isStatementEditOpen, setIsStatementEditOpen] = useState(false);
  const [selectedTripForStatement, setSelectedTripForStatement] =
    useState<BusinessTrip | null>(null);

  // Редакция
  const [tripToEdit, setTripToEdit] = useState<BusinessTrip | null>(null);
  // Изтриване — ид на командировката, която чака потвърждение
  const [tripPendingDelete, setTripPendingDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedTripForPdf, setSelectedTripForPdf] =
    useState<BusinessTrip | null>(null);
  const [selectedTripForExpense, setSelectedTripForExpense] = useState<
    string | null
  >(null);
  const [expensesMap, setExpensesMap] = useState<Record<string, TripExpense[]>>(
    {}
  );
  const [expenseToEdit, setExpenseToEdit] = useState<TripExpense | null>(null);

  // Digital Signatures
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [signatureRole, setSignatureRole] = useState<
    "coach" | "chairman" | null
  >(null);
  const [signatureTripId, setSignatureTripId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tripsData, membersData] = await Promise.all([
        businessTripService.getTripsByEventId(event.id),
        getAllMembers(),
      ]);
      setBusinessTrips(tripsData);

      const dict: Record<string, Member> = {};
      membersData.forEach((m) => {
        if (m.id) dict[m.id] = m;
      });
      setMembersDict(dict);

      const expMap: Record<string, TripExpense[]> = {};
      await Promise.all(
        tripsData.map(async (trip) => {
          if (trip.id) {
            expMap[trip.id] = await businessTripService.getExpensesByTrip(
              trip.id
            );
          }
        })
      );
      setExpensesMap(expMap);
    } catch {
      toast.error("Грешка при зареждане на данните");
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event.id]);

  const handlePrintOrder = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-order-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Нареждане_Командировка_${trip.title}`
          ).finally(() => {
            setIsGeneratingPdf(false);
            // Записваме дата на изтегляне
            businessTripService
              .updateTrip(trip.id!, {
                orderDownloadedAt: new Date().toISOString(),
              })
              .then(loadData)
              .catch(console.error);
          });
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintDecision = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-board-decision-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Решение_УС_${trip.title}`,
            "portrait"
          ).finally(() => {
            setIsGeneratingPdf(false);
            const defaultDecision = trip.usDecision?.trim()
              ? trip.usDecision.trim()
              : `${(trip.id || "").substring(0, 6).toUpperCase()}-УС`;
            businessTripService
              .updateTrip(trip.id!, {
                decisionDownloadedAt: new Date().toISOString(),
                usDecision: defaultDecision,
              })
              .then(loadData)
              .catch(console.error);
          });
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintStatement = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-statement-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Ведомост_${trip.title}`,
            "landscape"
          ).finally(() => {
            setIsGeneratingPdf(false);
            // Записваме дата на изтегляне
            businessTripService
              .updateTrip(trip.id!, {
                statementDownloadedAt: new Date().toISOString(),
              })
              .then(loadData)
              .catch(console.error);
          });
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePreviewPdf = (
    trip: BusinessTrip,
    type: "decision" | "order" | "statement" | "fuel" | "attendance" | "report"
  ) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);

    setTimeout(() => {
      let elId = "pdf-fuel-report-template";
      if (type === "decision") elId = "pdf-board-decision-template";
      else if (type === "order") elId = "pdf-order-template";
      else if (type === "statement") elId = "pdf-statement-template";
      else if (type === "attendance") elId = "pdf-attendance-template";
      else if (type === "report") elId = "pdf-report-template";

      const el = document.getElementById(elId);
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          const orientation =
            type === "statement" || type === "fuel" ? "landscape" : "portrait";
          m.previewPdfFromElement(el, orientation).finally(() =>
            setIsGeneratingPdf(false)
          );
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintFuelReport = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);

    businessTripService
      .updateTrip(trip.id!, { fuelDownloadedAt: new Date().toISOString() })
      .then(() => loadData())
      .catch(console.error);

    setTimeout(() => {
      const el = document.getElementById("pdf-fuel-report-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Отчет_Гориво_${trip.title}`,
            "landscape"
          ).finally(() => setIsGeneratingPdf(false));
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintAttendance = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-attendance-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(el, `Присъствен_Лист_${trip.title}`).finally(
            () => {
              setIsGeneratingPdf(false);
              businessTripService
                .updateTrip(trip.id!, {
                  attendanceDownloadedAt: new Date().toISOString(),
                })
                .then(loadData)
                .catch(console.error);
            }
          );
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handlePrintReport = (trip: BusinessTrip) => {
    setIsGeneratingPdf(true);
    setSelectedTripForPdf(trip);
    setTimeout(() => {
      const el = document.getElementById("pdf-report-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Доклад_Отчет_${trip.title}`,
            "portrait"
          ).finally(() => {
            setIsGeneratingPdf(false);
            businessTripService
              .updateTrip(trip.id!, {
                reportDownloadedAt: new Date().toISOString(),
              })
              .then(loadData)
              .catch(console.error);
          });
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const handleEmailPdf = (
    trip: BusinessTrip,
    type: "decision" | "order" | "statement" | "fuel" | "attendance" | "report"
  ) => {
    const email = window.prompt(
      "Моля, въведете имейл адрес, на който да изпратим документа:",
      user?.email || "bkgalabovo2014@gmail.com"
    );
    if (!email) return;

    setIsSendingEmail(true);
    setSelectedTripForPdf(trip);

    setTimeout(() => {
      let elId = "pdf-fuel-report-template";
      if (type === "decision") elId = "pdf-board-decision-template";
      else if (type === "order") elId = "pdf-order-template";
      else if (type === "statement") elId = "pdf-statement-template";
      else if (type === "attendance") elId = "pdf-attendance-template";
      else if (type === "report") elId = "pdf-report-template";

      const el = document.getElementById(elId);
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          const orientation =
            type === "statement" || type === "fuel" ? "landscape" : "portrait";
          m.getPdfBase64FromElement(el, orientation)
            .then(async (base64Data) => {
              let filename = `Отчет_Гориво_${trip.title}.pdf`;
              if (type === "decision")
                filename = `Решение_УС_${trip.title}.pdf`;
              else if (type === "order")
                filename = `Нареждане_${trip.title}.pdf`;
              else if (type === "statement")
                filename = `Ведомост_${trip.title}.pdf`;
              else if (type === "attendance")
                filename = `Присъствен_Лист_${trip.title}.pdf`;
              else if (type === "report")
                filename = `Доклад_Отчет_${trip.title}.pdf`;

              const attachmentContent = base64Data.split(",")[1] || base64Data; // Extract pure base64

              const token = await user?.getIdToken();

              const res = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  to: email,
                  subject: `Документ за командировка: ${trip.title}`,
                  template: "marketing",
                  data: {
                    messageText: `Прикачен е вашият документ за командировка (${filename}) от БК Гълъбово.`,
                  },
                  attachments: [
                    {
                      filename,
                      content: attachmentContent,
                      encoding: "base64",
                    },
                  ],
                }),
              });

              if (!res.ok) throw new Error("Failed to send email");
              toast.success("Имейлът е изпратен успешно!");
            })
            .catch((err) => {
              console.error(err);
              toast.error("Възникна грешка при изпращането на имейла.");
            })
            .finally(() => setIsSendingEmail(false));
        });
      } else {
        setIsSendingEmail(false);
      }
    }, 100);
  };

  const handleDelete = async (tripId: string) => {
    setIsDeleting(true);
    try {
      await businessTripService.deleteTrip(tripId);
      toast.success("Командировката е изтрита успешно.");
      loadData();
    } catch {
      toast.error("Възникна грешка при изтриването.");
    } finally {
      setIsDeleting(false);
      setTripPendingDelete(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този разход?"))
      return;
    try {
      await businessTripService.deleteExpense(expenseId);
      toast.success("Разходът е изтрит успешно.");
      loadData();
    } catch {
      toast.error("Възникна грешка при изтриването на разхода.");
    }
  };

  const handleSaveSignature = async (base64: string) => {
    if (!signatureTripId || !signatureRole) return;
    try {
      const trip = businessTrips.find((t) => t.id === signatureTripId);
      if (!trip) return;

      const newSignatures = { ...trip.signatures, [signatureRole]: base64 };
      await businessTripService.updateTrip(signatureTripId, {
        signatures: newSignatures,
      });

      toast.success("Подписът е запазен успешно!");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Грешка при запазване на подписа.");
    }
  };

  const handleClearSignature = async (
    tripId: string,
    role: "coach" | "chairman"
  ) => {
    try {
      const trip = businessTrips.find((t) => t.id === tripId);
      if (!trip) return;

      const newSignatures = { ...trip.signatures };
      delete newSignatures[role];

      await businessTripService.updateTrip(tripId, {
        signatures: newSignatures,
      });

      toast.success("Подписът е изчистен успешно!");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Грешка при изчистване на подписа.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium tracking-wide">
              Решения на УС и Командировки: {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:p-6 dark:bg-zinc-900/50">
            <div>
              <p className="text-sm font-light text-zinc-400">
                Управление на Решения на УС, Заповеди и финансово отчитане за
                това събитие
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
            >
              <UserPlus className="mr-2 size-4" /> + Ново Решение на УС /
              Заповед
            </Button>
          </div>

          <div className="mt-4">
            {businessTrips.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShieldAlert className="mx-auto mb-3 size-8 opacity-50" />
                <p>
                  Няма създадени Решения на УС или командировки за това събитие.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-5 dark:border-zinc-800"
                  >
                    {/* Trip title + info */}
                    <div>
                      <p className="font-medium">{trip.title}</p>
                      <p className="text-sm text-zinc-500">
                        До: {trip.destination} (
                        {formatDateShort(trip.startDate)} -{" "}
                        {formatDateShort(trip.endDate)})
                      </p>
                      {/* ── Checklist panel ── */}
                      <TripChecklistPanel
                        trip={trip}
                        expenses={expensesMap[trip.id!] || []}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExpenseToEdit(null);
                          setSelectedTripForExpense(trip.id!);
                          setIsExpenseDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 size-4" /> Разход
                      </Button>

                      {/* Решение на УС */}
                      <div className="flex items-center">
                        <Button
                          variant={
                            trip.decisionDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Преглед на Решение на УС"
                          className={
                            trip.decisionDownloadedAt
                              ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-r-none border-r-0 px-0"
                          }
                          onClick={() => handlePreviewPdf(trip, "decision")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.decisionDownloadedAt ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePrintDecision(trip)}
                          disabled={isGeneratingPdf || isSendingEmail}
                          className={
                            trip.decisionDownloadedAt
                              ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "rounded-none border-x-0"
                          }
                        >
                          <FileDown className="mr-2 size-4" />
                          {trip.decisionDownloadedAt
                            ? `Решение на УС (Изтеглено ${format(new Date(trip.decisionDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                            : "Решение на УС (PDF)"}
                        </Button>
                        <Button
                          variant={
                            trip.decisionDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Изпрати по имейл"
                          className={
                            trip.decisionDownloadedAt
                              ? "size-8 rounded-l-none border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-l-none px-0"
                          }
                          onClick={() => handleEmailPdf(trip, "decision")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Mail className="size-4" />
                        </Button>
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant={
                            trip.orderDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Преглед"
                          className={
                            trip.orderDownloadedAt
                              ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-r-none border-r-0 px-0"
                          }
                          onClick={() => handlePreviewPdf(trip, "order")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.orderDownloadedAt ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePrintOrder(trip)}
                          disabled={isGeneratingPdf || isSendingEmail}
                          className={
                            trip.orderDownloadedAt
                              ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "rounded-none border-x-0"
                          }
                        >
                          <FileDown className="mr-2 size-4" />
                          {trip.orderDownloadedAt
                            ? `Нареждане (Изтеглено ${format(new Date(trip.orderDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                            : "Нареждане (PDF)"}
                        </Button>
                        <Button
                          variant={
                            trip.orderDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Изпрати по имейл"
                          className={
                            trip.orderDownloadedAt
                              ? "size-8 rounded-l-none border-l border-emerald-200 border-l-emerald-300 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:border-l-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-l-none px-0"
                          }
                          onClick={() => handleEmailPdf(trip, "order")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Mail className="size-4" />
                        </Button>
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant={
                            trip.statementDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Преглед"
                          className={
                            trip.statementDownloadedAt
                              ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-r-none border-r-0 px-0"
                          }
                          onClick={() => handlePreviewPdf(trip, "statement")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.statementDownloadedAt ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePrintStatement(trip)}
                          disabled={isGeneratingPdf || isSendingEmail}
                          className={
                            trip.statementDownloadedAt
                              ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "rounded-none border-x-0"
                          }
                        >
                          <FileDown className="mr-2 size-4" />
                          {trip.statementDownloadedAt
                            ? `Ведомост (Изтеглено ${format(new Date(trip.statementDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                            : "Ведомост (PDF)"}
                        </Button>
                        <Button
                          variant={
                            trip.statementDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Редактирай ведомост (реални дни/нощи)"
                          className={
                            trip.statementDownloadedAt
                              ? "size-8 rounded-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-none border-r-0 px-0"
                          }
                          onClick={() => {
                            setSelectedTripForStatement(trip);
                            setIsStatementEditOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.statementDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Изпрати по имейл"
                          className={
                            trip.statementDownloadedAt
                              ? "size-8 rounded-l-none border-l border-emerald-200 border-l-emerald-300 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:border-l-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-l-none px-0"
                          }
                          onClick={() => handleEmailPdf(trip, "statement")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Mail className="size-4" />
                        </Button>
                      </div>

                      {/* Присъствен лист */}
                      <div className="flex items-center">
                        <Button
                          variant={
                            trip.attendanceDownloadedAt
                              ? "secondary"
                              : "outline"
                          }
                          size="icon"
                          title="Преглед"
                          className={
                            trip.attendanceDownloadedAt
                              ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-r-none border-r-0 px-0"
                          }
                          onClick={() => handlePreviewPdf(trip, "attendance")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.attendanceDownloadedAt
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handlePrintAttendance(trip)}
                          disabled={isGeneratingPdf || isSendingEmail}
                          className={
                            trip.attendanceDownloadedAt
                              ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "rounded-none border-x-0"
                          }
                        >
                          <FileDown className="mr-2 size-4" />
                          {trip.attendanceDownloadedAt
                            ? `Присъствен лист (Изтеглено ${format(new Date(trip.attendanceDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                            : "Присъствен лист (PDF)"}
                        </Button>
                        <Button
                          variant={
                            trip.attendanceDownloadedAt
                              ? "secondary"
                              : "outline"
                          }
                          size="icon"
                          title="Изпрати по имейл"
                          className={
                            trip.attendanceDownloadedAt
                              ? "size-8 rounded-l-none border-l border-emerald-200 border-l-emerald-300 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:border-l-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-l-none px-0"
                          }
                          onClick={() => handleEmailPdf(trip, "attendance")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Mail className="size-4" />
                        </Button>
                      </div>

                      {/* Доклад за извършената работа (НКС) */}
                      <div className="flex items-center">
                        <Button
                          variant={
                            trip.reportDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Преглед на Доклад за извършената работа"
                          className={
                            trip.reportDownloadedAt
                              ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-r-none border-r-0 px-0"
                          }
                          onClick={() => handlePreviewPdf(trip, "report")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant={
                            trip.reportDownloadedAt ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePrintReport(trip)}
                          disabled={isGeneratingPdf || isSendingEmail}
                          className={
                            trip.reportDownloadedAt
                              ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "rounded-none border-x-0"
                          }
                        >
                          <FileText className="mr-2 size-4" />
                          {trip.reportDownloadedAt
                            ? `Доклад (Изтеглен ${format(new Date(trip.reportDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                            : "Доклад (PDF)"}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Редактирай текст на Доклада"
                          className="size-8 rounded-none border-r-0 px-0 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                          onClick={() => {
                            setSelectedTripForReport(trip);
                            setIsReportDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant={
                            trip.reportDownloadedAt ? "secondary" : "outline"
                          }
                          size="icon"
                          title="Изпрати по имейл"
                          className={
                            trip.reportDownloadedAt
                              ? "size-8 rounded-l-none border-l border-emerald-200 border-l-emerald-300 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:border-l-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "size-8 rounded-l-none px-0"
                          }
                          onClick={() => handleEmailPdf(trip, "report")}
                          disabled={isGeneratingPdf || isSendingEmail}
                        >
                          <Mail className="size-4" />
                        </Button>
                      </div>

                      {trip.transportType === "fuel_only" && (
                        <div className="flex items-center">
                          <Button
                            variant={
                              trip.fuelDownloadedAt ? "secondary" : "outline"
                            }
                            size="icon"
                            title="Преглед"
                            className={
                              trip.fuelDownloadedAt
                                ? "size-8 rounded-r-none border-r-0 border-emerald-200 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "size-8 rounded-r-none border-r-0 px-0"
                            }
                            onClick={() => handlePreviewPdf(trip, "fuel")}
                            disabled={isGeneratingPdf || isSendingEmail}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant={
                              trip.fuelDownloadedAt ? "secondary" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePrintFuelReport(trip)}
                            disabled={isGeneratingPdf || isSendingEmail}
                            className={
                              trip.fuelDownloadedAt
                                ? "rounded-none border-x-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "rounded-none border-x-0"
                            }
                          >
                            <FileDown className="mr-2 size-4" />
                            {trip.fuelDownloadedAt
                              ? `Пътен лист / Гориво (Изтеглено ${format(new Date(trip.fuelDownloadedAt), "dd.MM.yyyy, HH:mm")})`
                              : "Пътен лист / Отчет гориво (PDF)"}
                          </Button>
                          <Button
                            variant={
                              trip.fuelDownloadedAt ? "secondary" : "outline"
                            }
                            size="icon"
                            title="Изпрати по имейл"
                            className={
                              trip.fuelDownloadedAt
                                ? "size-8 rounded-l-none border-l border-emerald-200 border-l-emerald-300 bg-emerald-50 px-0 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:border-l-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "size-8 rounded-l-none px-0"
                            }
                            onClick={() => handleEmailPdf(trip, "fuel")}
                            disabled={isGeneratingPdf || isSendingEmail}
                          >
                            <Mail className="size-4" />
                          </Button>
                        </div>
                      )}
                      {/* Подписи */}
                      {trip.signatures?.coach ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="pointer-events-none border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                          >
                            <Pencil className="mr-2 size-4" /> Подписано
                            (Командирован)
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Изчисти подпис"
                            className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                            onClick={() =>
                              handleClearSignature(trip.id!, "coach")
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSignatureTripId(trip.id!);
                            setSignatureRole("coach");
                            setSignaturePadOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 size-4" /> Подпиши
                          (Командирован)
                        </Button>
                      )}

                      {trip.signatures?.chairman ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="pointer-events-none border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                          >
                            <Pencil className="mr-2 size-4" /> Подписано
                            (Председател)
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Изчисти подпис"
                            className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                            onClick={() =>
                              handleClearSignature(trip.id!, "chairman")
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSignatureTripId(trip.id!);
                            setSignatureRole("chairman");
                            setSignaturePadOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 size-4" /> Подпиши
                          (Председател)
                        </Button>
                      )}
                      {/* Редакция */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/40"
                        onClick={() => setTripToEdit(trip)}
                      >
                        <Pencil className="mr-2 size-4" /> Редактирай Решение /
                        Заповед
                      </Button>
                      {/* Изтриване */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        onClick={() => setTripPendingDelete(trip.id!)}
                      >
                        <Trash2 className="mr-2 size-4" /> Изтрий
                      </Button>
                    </div>

                    {/* Инлайн потвърждение за изтриване */}
                    {tripPendingDelete === trip.id && (
                      <div className="col-span-full flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
                        <Trash2 className="size-4 shrink-0 text-red-500" />
                        <p className="flex-1 text-red-700 dark:text-red-300">
                          Сигурни ли сте? Това ще изтрие командировката завинаги
                          от базата данни.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTripPendingDelete(null)}
                          disabled={isDeleting}
                        >
                          Отказ
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDelete(trip.id!)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Изтриване..." : "Да, изтрий"}
                        </Button>
                      </div>
                    )}
                    {expensesMap[trip.id!] &&
                      expensesMap[trip.id!].length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                          <p className="text-sm font-medium text-zinc-500">
                            Добавени разходи:
                          </p>
                          {expensesMap[trip.id!].map((exp) => (
                            <div
                              key={exp.id}
                              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              <div>
                                <span className="font-medium">
                                  {(() => {
                                    switch (exp.expenseType) {
                                      case "fuel":
                                        return "Гориво";
                                      case "transport":
                                        return "Транспорт";
                                      case "accommodation":
                                        return "Нощувка";
                                      case "food":
                                        return "Храна";
                                      case "entry_fee":
                                        return "Входна такса";
                                      default:
                                        return "Други";
                                    }
                                  })()}
                                </span>
                                <span className="ml-2 text-zinc-500">
                                  {exp.expenseType === "fuel"
                                    ? `Цена/л: ${exp.amountEUR} EUR`
                                    : `${exp.amountEUR} EUR`}
                                </span>
                                {exp.documentNumber && (
                                  <span className="ml-2 text-xs text-zinc-400">
                                    Фактура/Бон: {exp.documentNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-zinc-400 hover:text-blue-600"
                                  onClick={() => {
                                    setExpenseToEdit(exp);
                                    setSelectedTripForExpense(trip.id!);
                                    setIsExpenseDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-zinc-400 hover:text-red-600"
                                  onClick={() => handleDeleteExpense(exp.id!)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTripForPdf && (
        <BusinessTripPdfTemplates
          trip={selectedTripForPdf}
          event={event}
          membersDict={membersDict}
          expenses={
            selectedTripForPdf.id
              ? expensesMap[selectedTripForPdf.id] || []
              : []
          }
          showBgn={showBgnInPdf}
        />
      )}

      {isCreateDialogOpen && (
        <CreateBusinessTripDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          event={event}
          membersDict={membersDict}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            loadData();
          }}
        />
      )}

      {/* Диалог за Редакция */}
      {tripToEdit && (
        <CreateBusinessTripDialog
          open={!!tripToEdit}
          onOpenChange={(v) => {
            if (!v) setTripToEdit(null);
          }}
          event={event}
          membersDict={membersDict}
          initialData={tripToEdit}
          onSuccess={() => {
            setTripToEdit(null);
            loadData();
          }}
        />
      )}

      {isExpenseDialogOpen && selectedTripForExpense && (
        <TripExpenseDialog
          open={isExpenseDialogOpen}
          onOpenChange={(v) => {
            if (!v) setExpenseToEdit(null);
            setIsExpenseDialogOpen(v);
          }}
          tripId={selectedTripForExpense!}
          siteId="bkgalabovo" // Hardcoded active branch for now, or fetch from context
          expenseToEdit={expenseToEdit || undefined}
          onSuccess={() => {
            setExpenseToEdit(null);
            loadData();
          }}
        />
      )}

      {signaturePadOpen && (
        <SignaturePadDialog
          open={signaturePadOpen}
          onOpenChange={setSignaturePadOpen}
          title={`Подпис: ${signatureRole === "coach" ? "Командирован" : "Председател"}`}
          onSave={handleSaveSignature}
        />
      )}

      {isReportDialogOpen && selectedTripForReport && (
        <TripReportDialog
          open={isReportDialogOpen}
          onOpenChange={(v) => {
            if (!v) setSelectedTripForReport(null);
            setIsReportDialogOpen(v);
          }}
          trip={selectedTripForReport}
          membersDict={membersDict}
          onSuccess={() => {
            setSelectedTripForReport(null);
            loadData();
          }}
        />
      )}

      {isStatementEditOpen && selectedTripForStatement && (
        <TripStatementEditDialog
          open={isStatementEditOpen}
          onOpenChange={(v) => {
            if (!v) setSelectedTripForStatement(null);
            setIsStatementEditOpen(v);
          }}
          trip={selectedTripForStatement}
          onSuccess={() => {
            setSelectedTripForStatement(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
