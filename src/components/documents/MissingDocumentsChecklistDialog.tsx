"use client";

import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Printer,
  Search,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SendDocumentRequestDialog } from "@/components/documents/SendDocumentRequestDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { getAllClubDocumentRequestsAction } from "@/lib/actions/document-templates";
import { getMembersAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";
import { DocumentRequest, DocumentType } from "@/types/document-request.types";
import { Member } from "@/types/member.types";

interface MissingDocumentsChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshParent?: () => void;
}

interface MemberComplianceStatus {
  member: Member;
  fullName: string;
  isMedValid: boolean;
  medDaysRemaining: number | null;
  medIssueDate: string | null;
  hasDeclaration: boolean;
  hasTravel: boolean;
  hasSafety: boolean;
  hasInternalRules: boolean;
  isFullyCompliant: boolean;
}

export function MissingDocumentsChecklistDialog({
  open,
  onOpenChange,
  onRefreshParent,
}: MissingDocumentsChecklistDialogProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all_issues" | "missing_med" | "missing_declaration" | "all_members"
  >("all_issues");

  // Quick send link state
  const [quickSendMember, setQuickSendMember] = useState<Member | null>(null);
  const [quickSendDocType, setQuickSendDocType] =
    useState<DocumentType>("signedDeclaration");
  const [quickSendOpen, setQuickSendOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, reqsRes] = await Promise.all([
        getMembersAction(),
        user
          ? user.getIdToken().then((t) => getAllClubDocumentRequestsAction(t))
          : Promise.resolve({ success: false, data: [] }),
      ]);

      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data.filter((m) => !m.suspended));
      }
      if (reqsRes.success && reqsRes.data) {
        setRequests(reqsRes.data);
      }
    } catch (err) {
      console.error("Error loading checklist data:", err);
      toast.error("Грешка при зареждане на данните за проверка.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  // Evaluate compliance for each member
  const complianceList = useMemo<MemberComplianceStatus[]>(() => {
    const now = new Date().getTime();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

    return members
      .map((member) => {
        const fullName = formatFullName(member);

        // Medical certificate check (valid if within 180 days from checkup date)
        let isMedValid = false;
        let medDaysRemaining: number | null = null;
        const medDateStr =
          member.medicalCertificateDate || member.medicalCertificateHandedAt;

        if (medDateStr) {
          const checkupTime = new Date(medDateStr).getTime();
          if (!isNaN(checkupTime)) {
            const diffMs = checkupTime + SIX_MONTHS_MS - now;
            medDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffMs > 0 && member.hasMedicalCertificate) {
              isMedValid = true;
            }
          }
        }

        // Declaration check (valid for current calendar year)
        const completedDecl = requests.find(
          (r) =>
            r.memberId === member.id &&
            r.documentType === "signedDeclaration" &&
            r.status === "completed" &&
            r.signedAt &&
            new Date(r.signedAt).getFullYear() === currentYear
        );
        const hasDeclaration =
          Boolean(completedDecl) ||
          (Boolean(member.hasSignedDeclaration) &&
            Boolean(member.signedDeclarationHandedAt) &&
            new Date(
              member.signedDeclarationHandedAt as string
            ).getFullYear() === currentYear);

        // Travel declaration check
        const completedTravel = requests.find(
          (r) =>
            r.memberId === member.id &&
            r.documentType === "travelDeclaration" &&
            r.status === "completed" &&
            r.signedAt &&
            new Date(r.signedAt).getFullYear() === currentYear
        );
        const hasTravel =
          Boolean(completedTravel) ||
          (Boolean(member.hasTravelDeclaration) &&
            Boolean(member.travelDeclarationHandedAt) &&
            new Date(
              member.travelDeclarationHandedAt as string
            ).getFullYear() === currentYear);

        // Safety instruction check
        const completedSafety = requests.find(
          (r) =>
            r.memberId === member.id &&
            r.documentType === "safetyInstruction" &&
            r.status === "completed"
        );
        const hasSafety =
          Boolean(completedSafety) || Boolean(member.hasSafetyInstruction);

        // Internal rules
        const completedRules = requests.find(
          (r) =>
            r.memberId === member.id &&
            r.documentType === "internalRules" &&
            r.status === "completed"
        );
        const hasInternalRules =
          Boolean(completedRules) || Boolean(member.hasInternalRules);

        const isFullyCompliant =
          isMedValid && hasDeclaration && hasTravel && hasSafety;

        return {
          member,
          fullName,
          isMedValid,
          medDaysRemaining,
          medIssueDate: medDateStr || null,
          hasDeclaration,
          hasTravel,
          hasSafety,
          hasInternalRules,
          isFullyCompliant,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "bg"));
  }, [members, requests, currentYear]);

  // Filtered compliance list
  const filteredList = useMemo(() => {
    return complianceList.filter((item) => {
      const matchesSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.member.parentPhone || "").includes(searchQuery) ||
        (item.member.phone || "").includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterMode === "all_issues") return !item.isFullyCompliant;
      if (filterMode === "missing_med") return !item.isMedValid;
      if (filterMode === "missing_declaration") return !item.hasDeclaration;
      return true;
    });
  }, [complianceList, searchQuery, filterMode]);

  // Summary counts
  const stats = useMemo(() => {
    const total = complianceList.length;
    const missingMed = complianceList.filter((c) => !c.isMedValid).length;
    const missingDecl = complianceList.filter((c) => !c.hasDeclaration).length;
    const missingTravel = complianceList.filter((c) => !c.hasTravel).length;
    const fullyReady = complianceList.filter((c) => c.isFullyCompliant).length;
    return { total, missingMed, missingDecl, missingTravel, fullyReady };
  }, [complianceList]);

  const handleCopySummary = async () => {
    const lines = filteredList.map(
      (c) =>
        `• ${c.fullName} (тел: ${c.member.parentPhone || c.member.phone || "няма"}): ` +
        `Медицинско: ${c.isMedValid ? "✓ Валидно" : "❌ Липсва/Изтекло"}, ` +
        `Декларация ${currentYear}: ${c.hasDeclaration ? "✓ Налична" : "❌ Липсва"}, ` +
        `Пътуване: ${c.hasTravel ? "✓ Налично" : "❌ Липсва"}`
    );

    const text = `СПРАВКА ЗА ДОКУМЕНТИ ПРЕДИ ТУРНИР (${new Date().toLocaleDateString("bg-BG")} г.)\nОбщо състезатели с липсващи документи: ${filteredList.length}\n\n${lines.join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Справката е копирана в клипборда!");
    } catch {
      toast.error("Неуспешно копиране.");
    }
  };

  const handlePrintTournamentChecklist = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="utf-8">
        <title>Чеклист за състезание — БК Гълъбово</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Times New Roman', serif; margin: 0; color: #000; font-size: 10pt; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 14pt; text-transform: uppercase; }
          .header p { margin: 3px 0 0; font-size: 9pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt; }
          th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
          th { background: #f0f0f0; text-transform: uppercase; font-size: 8pt; }
          .ok { color: #059669; font-weight: bold; }
          .bad { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 9pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</h1>
          <p>ОФИЦИАЛЕН ПРИСЪСТВЕН ЧЕКЛИСТ ЗА СЪСТЕЗАНИЕ / ЛАГЕР — СЕЗОН ${currentYear} г.</p>
          <p>Дата на извлечението: ${new Date().toLocaleDateString("bg-BG")} г. | Общо състезатели: ${filteredList.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">№</th>
              <th>Състезател</th>
              <th style="width: 100px;">Тел. родител</th>
              <th style="width: 110px;">Медицинско (180 дни)</th>
              <th style="width: 90px;">Декларация ${currentYear}</th>
              <th style="width: 90px;">Пътуване</th>
              <th style="width: 60px;">Подпис треньор</th>
            </tr>
          </thead>
          <tbody>
            ${filteredList
              .map(
                (c, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><b>${c.fullName}</b></td>
                <td>${c.member.parentPhone || c.member.phone || "—"}</td>
                <td class="${c.isMedValid ? "ok" : "bad"}">${
                  c.isMedValid
                    ? `✓ Валидно (${c.medDaysRemaining} дни)`
                    : "❌ Невалидно/Липсва"
                }</td>
                <td class="${c.hasDeclaration ? "ok" : "bad"}">${
                  c.hasDeclaration ? "✓ Налична" : "❌ Липсва"
                }</td>
                <td class="${c.hasTravel ? "ok" : "bad"}">${
                  c.hasTravel ? "✓ Налично" : "❌ Липсва"
                }</td>
                <td></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>Проверил (Треньор): ________________________</div>
          <div>Дата: ${new Date().toLocaleDateString("bg-BG")} г.</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Справка за клубни документи & Чеклист за състезания
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Проверка за валидност на медицински прегледи и подписани
                декларации за сезон {currentYear} г.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Общо състезатели
            </span>
            <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              ✓ Напълно готови
            </span>
            <p className="mt-1 text-lg font-bold text-emerald-950 dark:text-emerald-200">
              {stats.fullyReady}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
              ❌ Без валидно медицинско
            </span>
            <p className="mt-1 text-lg font-bold text-rose-950 dark:text-rose-200">
              {stats.missingMed}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              ❌ Без декларация {currentYear}
            </span>
            <p className="mt-1 text-lg font-bold text-amber-950 dark:text-amber-200">
              {stats.missingDecl}
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <Input
              placeholder="Търсене по състезател или телефон..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={filterMode}
              onChange={(e) =>
                setFilterMode(
                  e.target.value as
                    | "all_issues"
                    | "missing_med"
                    | "missing_declaration"
                    | "all_members"
                )
              }
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="all_issues">
                Само с липсващи документи ({stats.total - stats.fullyReady})
              </option>
              <option value="missing_med">
                Само без валидно медицинско ({stats.missingMed})
              </option>
              <option value="missing_declaration">
                Само без Декларация за {currentYear} г. ({stats.missingDecl})
              </option>
              <option value="all_members">
                Всички състезатели ({stats.total})
              </option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 shrink-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              title="Копирай текстова справка"
            >
              <Copy className="size-3.5" />
              Копирай
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintTournamentChecklist}
              className="h-9 rounded-xl text-xs font-bold text-zinc-950 border-zinc-300 hover:bg-zinc-100 gap-1.5 shrink-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              title="Разпечатай присъствен списък за турнира"
            >
              <Printer className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              🖨️ Печат за турнир
            </Button>
          </div>
        </div>

        {/* Compliance Table */}
        <div className="flex-1 overflow-y-auto mt-2 rounded-2xl border border-zinc-100 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="size-7 animate-spin text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-400">
                Проверка на клубните досиета...
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mb-2" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Всички състезатели са с изрядни документи!
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Няма открити липсващи или изтекли документи според избрания
                филтър.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 sticky top-0">
                <tr>
                  <th className="py-2.5 pl-3">Състезател</th>
                  <th className="py-2.5">Медицинско свидетелство</th>
                  <th className="py-2.5">Декларация {currentYear}</th>
                  <th className="py-2.5">Пътуване</th>
                  <th className="py-2.5">Инструктаж</th>
                  <th className="py-2.5 pr-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {filteredList.map((item) => (
                  <tr
                    key={item.member.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-2.5 pl-3 font-bold text-zinc-900 dark:text-zinc-100">
                      <div>{item.fullName}</div>
                      <div className="text-[10px] font-normal text-zinc-400">
                        {item.member.parentPhone || item.member.phone || "—"}
                      </div>
                    </td>

                    {/* Medical */}
                    <td className="py-2.5">
                      {item.isMedValid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          Валидно ({item.medDaysRemaining} дн.)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
                          {item.medDaysRemaining !== null
                            ? `Изтекло (${Math.abs(item.medDaysRemaining)} дн.)`
                            : "Липсва"}
                        </span>
                      )}
                    </td>

                    {/* Declaration */}
                    <td className="py-2.5">
                      {item.hasDeclaration ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          ✓ Налична
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          ❌ Липсва
                        </span>
                      )}
                    </td>

                    {/* Travel */}
                    <td className="py-2.5">
                      {item.hasTravel ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          ✓ Налично
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          ⏳ Липсва
                        </span>
                      )}
                    </td>

                    {/* Safety */}
                    <td className="py-2.5">
                      {item.hasSafety ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          ✓ Приет
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                          Не е приет
                        </span>
                      )}
                    </td>

                    {/* Quick Send Link */}
                    <td className="py-2.5 pr-3 text-right">
                      {!item.hasDeclaration ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuickSendMember(item.member);
                            setQuickSendDocType("signedDeclaration");
                            setQuickSendOpen(true);
                          }}
                          className="h-7 rounded-lg border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        >
                          <Send className="size-3 mr-1" />
                          Декларация
                        </Button>
                      ) : !item.hasTravel ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuickSendMember(item.member);
                            setQuickSendDocType("travelDeclaration");
                            setQuickSendOpen(true);
                          }}
                          className="h-7 rounded-lg border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 text-[11px] font-bold text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          <Send className="size-3 mr-1" />
                          Пътуване
                        </Button>
                      ) : (
                        <a
                          href={`/members/${item.member.id}/documents`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold inline-flex items-center gap-1"
                        >
                          Досие <ExternalLink className="size-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Send Dialog */}
        {quickSendMember && (
          <SendDocumentRequestDialog
            open={quickSendOpen}
            onOpenChange={(v) => {
              setQuickSendOpen(v);
              if (!v) setQuickSendMember(null);
            }}
            initialMemberId={quickSendMember.id}
            initialDocumentType={quickSendDocType}
            onSuccess={() => {
              loadData();
              if (onRefreshParent) onRefreshParent();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
