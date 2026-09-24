/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/no-nested-template-literals, @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store, sonarjs/unused-import */
"use client";

import confetti from "canvas-confetti";
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileDown,
  Loader2,
  Printer,
  Search,
  Share2,
  Sparkles,
  Ticket,
  Trophy,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembers } from "@/hooks/useMembers";
import {
  exportBatchMultiCertificatePdf,
  exportCertificatePdf,
  exportCertificatePng,
  exportTwoPageCertificatePdf,
  getCertificateShareLinks,
  printCertificate,
  shareCertificateViaWeb,
} from "@/lib/certificate-export-helpers";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { getCamps } from "@/services/schedule-service";
import { tournamentService } from "@/services/tournament-service";
import { ScheduleEvent } from "@/types";
import {
  AwardRank,
  CertificateTemplate,
  CertificateType,
  getCertificateTypeLabel,
  getRankLabel,
  IssueCertificateInput,
  IssuedCertificate,
  SponsorPartner,
} from "@/types/certificates";
import { Tournament, TournamentEntry } from "@/types/tournament.types";

import {
  CertificateBacksidePreview,
  CertificateDocumentPreview,
} from "./CertificateDocumentPreview";
import { ShareCertificateDialog } from "./ShareCertificateDialog";

interface IssueDocumentTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  templates: CertificateTemplate[];
  sponsors: SponsorPartner[];
  preselectedTemplateId?: string | null;
  onIssuedSuccess: () => Promise<void>;
  onSwitchToRegistry: () => void;
  onOpenTemplates?: () => void;
}

export function IssueDocumentTab({
  siteId,
  templates,
  sponsors,
  preselectedTemplateId,
  onIssuedSuccess,
  onSwitchToRegistry,
  onOpenTemplates,
}: IssueDocumentTabProps) {
  const { members, loading: loadingMembers } = useMembers();

  // Approved templates only
  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === "approved"),
    [templates]
  );

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (preselectedTemplateId) return preselectedTemplateId;
    return approvedTemplates[0]?.id || "";
  });

  const activeTemplate = useMemo(
    () =>
      templates.find((t) => t.id === selectedTemplateId) ||
      approvedTemplates[0],
    [templates, approvedTemplates, selectedTemplateId]
  );

  // Recipient Mode: "member" vs "manual"
  const [recipientMode, setRecipientMode] = useState<"member" | "manual">(
    "member"
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Recipient Fields
  const [recipientName, setRecipientName] = useState("");
  const [recipientInstitution, setRecipientInstitution] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Details: Award
  const [awardRank, setAwardRank] = useState<AwardRank>("1st");
  const [nomination, setNomination] = useState("");
  const [eventTitle, setEventTitle] = useState(
    "Турнир по Бадминтон „Гълъбово 2026“"
  );
  const [eventDate, setEventDate] = useState(
    new Date().toLocaleDateString("bg-BG")
  );
  const [eventLocation, setEventLocation] = useState(
    "Спортен Комплекс „Енергетик“, гр. Гълъбово"
  );

  // Details: Voucher
  const [voucherSessions, setVoucherSessions] = useState<number>(5);
  const [voucherValidityDays, setVoucherValidityDays] = useState<number>(180);
  const [voucherServiceType, setVoucherServiceType] = useState<string>(
    activeTemplate?.visualConfig?.voucherServiceType ||
      "Месечна такса тренировки"
  );
  const [voucherValue, setVoucherValue] = useState<string>(
    activeTemplate?.visualConfig?.voucherValue || "50 лв."
  );
  const [voucherPromoCode, setVoucherPromoCode] = useState<string>(
    activeTemplate?.visualConfig?.voucherPromoCode || ""
  );
  const [voucherExpiryDate, setVoucherExpiryDate] = useState<string>(
    activeTemplate?.visualConfig?.voucherExpiryDate || ""
  );

  // Sync voucher fields when activeTemplate changes
  React.useEffect(() => {
    if (activeTemplate?.visualConfig) {
      const vc = activeTemplate.visualConfig;
      if (vc.voucherServiceType) setVoucherServiceType(vc.voucherServiceType);
      if (vc.voucherValue) setVoucherValue(vc.voucherValue);
      if (vc.voucherPromoCode) setVoucherPromoCode(vc.voucherPromoCode);
      if (vc.voucherExpiryDate) setVoucherExpiryDate(vc.voucherExpiryDate);
    }
  }, [activeTemplate]);

  // Details: Certificate
  const [skillsSummary, setSkillsSummary] = useState("");
  const [hoursTrained, setHoursTrained] = useState<number>(20);

  // Tournaments state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [tournamentEntries, setTournamentEntries] = useState<TournamentEntry[]>(
    []
  );

  // Camps state
  const [camps, setCamps] = useState<ScheduleEvent[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");
  const [campAttendees, setCampAttendees] = useState<
    Array<{ memberId?: string; name: string }>
  >([]);

  // Age group filter for members
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");

  const [isBulkIssuing, setIsBulkIssuing] = useState(false);
  const [bulkSuccessList, setBulkSuccessList] = useState<IssuedCertificate[]>(
    []
  );
  const [isExportingBulkPdf, setIsExportingBulkPdf] = useState(false);

  // Load tournaments & camps
  React.useEffect(() => {
    tournamentService
      .getTournaments()
      .then((res) => {
        setTournaments(res || []);
      })
      .catch((err) => {
        console.error("Грешка при зареждане на турнири:", err);
      });

    getCamps()
      .then((res) => {
        setCamps(res || []);
      })
      .catch((err) => {
        console.error("Грешка при зареждане на лагери:", err);
      });
  }, []);

  // When selected tournament changes
  React.useEffect(() => {
    if (!selectedTournamentId) {
      setTournamentEntries([]);
      return;
    }
    const t = tournaments.find((x) => x.id === selectedTournamentId);
    if (t) {
      setEventTitle(t.title);
      setEventLocation(
        t.location || "Спортен Комплекс „Енергетик“, гр. Гълъбово"
      );
      if (t.startDate) {
        setEventDate(new Date(t.startDate).toLocaleDateString("bg-BG"));
      }
      tournamentService
        .getTournamentEntries(selectedTournamentId)
        .then((entries) => {
          setTournamentEntries(entries || []);
        })
        .catch((err) => {
          console.error("Грешка при зареждане на участници от турнир:", err);
        });
    }
  }, [selectedTournamentId, tournaments]);

  // When selected camp changes
  React.useEffect(() => {
    if (!selectedCampId) {
      setCampAttendees([]);
      return;
    }
    const camp = camps.find((c) => c.id === selectedCampId);
    if (camp) {
      setEventTitle(camp.title);
      if (camp.location) setEventLocation(camp.location);
      if (camp.startDate) {
        setEventDate(new Date(camp.startDate).toLocaleDateString("bg-BG"));
      }
      const attendees = (camp.attendees || []).map((a) => ({
        memberId: a.memberId,
        name: a.name || "Участник в лагер",
      }));
      setCampAttendees(attendees);
    }
  }, [selectedCampId, camps]);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedSuccessDoc, setIssuedSuccessDoc] =
    useState<IssuedCertificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBacksidePdf, setIsExportingBacksidePdf] = useState(false);
  const [isExportingDoublePdf, setIsExportingDoublePdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleExportLivePdf = async () => {
    setIsExportingPdf(true);
    try {
      const fileName = `${recipientName.trim() || "документ-лице"}.pdf`;
      const orient = activeTemplate?.visualConfig?.orientation || "landscape";
      const ok = await exportCertificatePdf(
        "printable-certificate",
        fileName,
        orient
      );
      if (ok) {
        toast.success("PDF документът (Лице) е изтеглен успешно!");
      } else {
        toast.error("Неуспешно генериране на PDF.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportLiveBacksidePdf = async () => {
    setIsExportingBacksidePdf(true);
    try {
      const fileName = `${recipientName.trim() || "документ-гръб"}.pdf`;
      const orient = activeTemplate?.visualConfig?.orientation || "landscape";
      const ok = await exportCertificatePdf(
        "printable-certificate-back",
        fileName,
        orient
      );
      if (ok) {
        toast.success("PDF документът (Гръб) е изтеглен успешно!");
      } else {
        toast.error("Неуспешно генериране на PDF за гръб.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PDF за гръб.");
    } finally {
      setIsExportingBacksidePdf(false);
    }
  };

  const handleExportLiveDoublePdf = async () => {
    setIsExportingDoublePdf(true);
    try {
      const fileName = `${recipientName.trim() || "документ"}-двустранен.pdf`;
      const orient = activeTemplate?.visualConfig?.orientation || "landscape";
      const ok = await exportTwoPageCertificatePdf(
        "printable-certificate",
        "printable-certificate-back",
        fileName,
        orient
      );
      if (ok) {
        toast.success(
          "Комбинираният 2-страничен PDF (Лице + Гръб) е изтеглен успешно!"
        );
      } else {
        toast.error("Неуспешно генериране на 2-страничен PDF.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на 2-страничен PDF.");
    } finally {
      setIsExportingDoublePdf(false);
    }
  };

  const handleExportLivePng = async () => {
    setIsExportingPng(true);
    try {
      const fileName = `${recipientName.trim() || "документ"}.png`;
      const ok = await exportCertificatePng(
        "printable-certificate",
        fileName,
        "ultra_300dpi"
      );
      if (ok) {
        toast.success(
          "Ultra HD 300 DPI PNG изображението е изтеглено успешно!"
        );
      } else {
        toast.error("Неуспешно генериране на PNG.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експорт на PNG.");
    } finally {
      setIsExportingPng(false);
    }
  };

  // Filtered members for autocomplete with age groups
  const filteredMembers = useMemo(() => {
    let result = members;

    // Filter by Age Group
    if (selectedAgeGroup !== "all") {
      result = result.filter((m) => {
        if (
          m.ageGroup &&
          m.ageGroup.toLowerCase() === selectedAgeGroup.toLowerCase()
        ) {
          return true;
        }
        if (!m.dateOfBirth) return false;
        const d = new Date(m.dateOfBirth);
        if (isNaN(d.getTime())) return false;
        const birthYear = d.getFullYear();
        const age = 2026 - birthYear;

        if (selectedAgeGroup === "u11") return age <= 11;
        if (selectedAgeGroup === "u13") return age > 11 && age <= 13;
        if (selectedAgeGroup === "u15") return age > 13 && age <= 15;
        if (selectedAgeGroup === "u17") return age > 15 && age <= 17;
        if (selectedAgeGroup === "adults") return age >= 18;
        return true;
      });
    }

    if (!memberSearchQuery.trim()) return result.slice(0, 8);
    const q = memberSearchQuery.toLowerCase();
    return result
      .filter((m) => {
        const full = `${m.firstName} ${m.lastName}`.toLowerCase();
        const inst = (m.educationInstitution || "").toLowerCase();
        return full.includes(q) || inst.includes(q);
      })
      .slice(0, 10);
  }, [members, memberSearchQuery, selectedAgeGroup]);

  const handleSelectMember = (m: (typeof members)[0]) => {
    setSelectedMemberId(m.id);
    const fullName = `${m.firstName} ${m.lastName}`.trim();
    setRecipientName(fullName);
    setRecipientInstitution(m.educationInstitution || "");
    setRecipientEmail(m.email || "");
    setRecipientPhone(m.phone || "");
  };

  const handleSelectTournamentPlayer = (entryId: string) => {
    const entry = tournamentEntries.find((e) => (e.id || "") === entryId);
    if (!entry) return;
    const member = members.find((m) => m.id === entry.memberId);
    if (member) {
      setSelectedMemberId(member.id);
      setRecipientName(`${member.firstName} ${member.lastName}`);
      setRecipientInstitution(member.educationInstitution || "БК Гълъбово");
      setRecipientEmail(member.email || "");
      setRecipientPhone(member.phone || "");
    } else {
      setSelectedMemberId(null);
      setRecipientName(entry.externalName || "Състезател");
      setRecipientInstitution("БК Гълъбово");
    }
    const idx = tournamentEntries.indexOf(entry);
    if (idx === 0) setAwardRank("1st");
    else if (idx === 1) setAwardRank("2nd");
    else if (idx === 2) setAwardRank("3rd");
  };

  const handleBulkIssueMedalists = async () => {
    if (!activeTemplate) {
      toast.error("Моля, изберете одобрен шаблон.");
      return;
    }
    if (!selectedTournamentId || tournamentEntries.length === 0) {
      toast.error("Няма намерени участници в този турнир.");
      return;
    }

    setIsBulkIssuing(true);
    try {
      const sorted = [...tournamentEntries].sort(
        (a, b) => (b.pointsAwarded || 0) - (a.pointsAwarded || 0)
      );
      const top3 = sorted.slice(0, 3);
      const ranks: AwardRank[] = ["1st", "2nd", "3rd"];
      const issuedList: IssuedCertificate[] = [];

      for (let i = 0; i < top3.length; i++) {
        const entry = top3[i];
        const assignedRank = ranks[i] || "participant";
        const member = members.find((m) => m.id === entry.memberId);
        const name = member
          ? `${member.firstName} ${member.lastName}`
          : entry.externalName || `Призьор ${i + 1}`;

        const payload: IssueCertificateInput = {
          templateId: activeTemplate.id,
          type: "award",
          recipient: {
            memberId: entry.memberId,
            name,
            institution: member?.educationInstitution || "БК Гълъбово",
            email: member?.email || undefined,
            phone: member?.phone || undefined,
          },
          details: {
            rank: assignedRank,
            nomination: nomination || undefined,
            eventTitle,
            eventDate,
            eventLocation,
            includeBackside: activeTemplate.visualConfig?.includeBackside,
            backsideStyle: activeTemplate.visualConfig?.backsideStyle,
            backsideTitle: activeTemplate.visualConfig?.backsideTitle,
            backsideMessage: activeTemplate.visualConfig?.backsideMessage,
            backsideSignatory: activeTemplate.visualConfig?.backsideSignatory,
          },
        };

        const res = await certificateIssuanceService.issueCertificate(
          siteId,
          payload
        );
        issuedList.push(res);
      }

      setBulkSuccessList(issuedList);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (c) {}
      toast.success(
        `Успешно генерирани ${issuedList.length} грамоти за медалистите!`
      );
      await onIssuedSuccess();
    } catch (err) {
      console.error("Грешка при масово издаване:", err);
      toast.error("Грешка при масовото издаване на грамоти.");
    } finally {
      setIsBulkIssuing(false);
    }
  };

  // Bulk issue certificates for all registered attendees of a camp
  const handleBulkIssueCampParticipants = async () => {
    if (!activeTemplate) {
      toast.error("Моля, изберете одобрен шаблон.");
      return;
    }
    if (!selectedCampId || campAttendees.length === 0) {
      toast.error("Няма намерени участници в този спортен лагер.");
      return;
    }

    setIsBulkIssuing(true);
    try {
      const issuedList: IssuedCertificate[] = [];
      const camp = camps.find((c) => c.id === selectedCampId);

      for (let i = 0; i < campAttendees.length; i++) {
        const entry = campAttendees[i];
        const member = members.find((m) => m.id === entry.memberId);
        const name = member
          ? `${member.firstName} ${member.lastName}`
          : entry.name || `Участник ${i + 1}`;

        const payload: IssueCertificateInput = {
          templateId: activeTemplate.id,
          type: activeTemplate.type || "certificate",
          recipient: {
            memberId: entry.memberId,
            name,
            institution: member?.educationInstitution || "БК Гълъбово",
            email: member?.email || undefined,
            phone: member?.phone || undefined,
          },
          details: {
            rank: "participant",
            nomination:
              nomination ||
              `Успешно завършен подготвителен курс по бадминтон (${camp?.title || "спортен лагер"})`,
            courseTitle: camp?.title,
            completionDate: eventDate,
            hoursTrained: hoursTrained || 25,
            eventTitle,
            eventDate,
            eventLocation,
            includeBackside: activeTemplate.visualConfig?.includeBackside,
            backsideStyle: activeTemplate.visualConfig?.backsideStyle,
            backsideTitle: activeTemplate.visualConfig?.backsideTitle,
            backsideMessage: activeTemplate.visualConfig?.backsideMessage,
            backsideSignatory: activeTemplate.visualConfig?.backsideSignatory,
          },
        };

        const res = await certificateIssuanceService.issueCertificate(
          siteId,
          payload
        );
        issuedList.push(res);
      }

      setBulkSuccessList(issuedList);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (c) {}
      toast.success(
        `Успешно генерирани ${issuedList.length} сертификата за лагера!`
      );
      await onIssuedSuccess();
    } catch (err) {
      console.error("Грешка при масово издаване за лагер:", err);
      toast.error("Грешка при масовото издаване на сертификати.");
    } finally {
      setIsBulkIssuing(false);
    }
  };

  // Multi-page Consolidated PDF Download
  const handleDownloadBulkMultiPdf = async () => {
    if (bulkSuccessList.length === 0) return;
    setIsExportingBulkPdf(true);
    const toastId = toast.loading("Обединяване на грамотите в общ PDF...");
    try {
      const elements: HTMLElement[] = [];
      for (let i = 0; i < bulkSuccessList.length; i++) {
        const el = document.getElementById(`bulk-preview-item-${i}`);
        if (el) elements.push(el);
      }

      if (elements.length === 0) {
        toast.error("Грешка при зареждане на елементите за печат.", {
          id: toastId,
        });
        return;
      }

      const orient = activeTemplate?.visualConfig?.orientation || "landscape";
      const ok = await exportBatchMultiCertificatePdf(
        elements,
        `грамоти_пакет_${eventTitle || "награждаване"}.pdf`,
        orient,
        (curr, tot) => {
          toast.loading(`Генериране на страница ${curr} от ${tot}...`, {
            id: toastId,
          });
        }
      );

      if (ok) {
        toast.success(`Пакетът от ${elements.length} грамоти е изтеглен!`, {
          id: toastId,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при обединяване на PDF файловете.", { id: toastId });
    } finally {
      setIsExportingBulkPdf(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) {
      toast.error("Моля, изберете одобрен шаблон.");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Моля, въведете име на получателя.");
      return;
    }

    try {
      setIsSubmitting(true);

      let validUntil: string | undefined;
      if (activeTemplate.type === "voucher") {
        if (voucherExpiryDate) {
          validUntil = voucherExpiryDate;
        } else {
          const expDate = new Date();
          expDate.setDate(
            expDate.getDate() + (Number(voucherValidityDays) || 180)
          );
          validUntil = expDate.toISOString();
        }
      }

      const input: IssueCertificateInput = {
        templateId: activeTemplate.id,
        type: activeTemplate.type,
        recipient: {
          memberId:
            recipientMode === "member" && selectedMemberId
              ? selectedMemberId
              : undefined,
          name: recipientName.trim(),
          institution: recipientInstitution.trim() || undefined,
          email: recipientEmail.trim() || undefined,
          phone: recipientPhone.trim() || undefined,
        },
        details: {
          // Award
          rank: activeTemplate.type === "award" ? awardRank : undefined,
          nomination:
            activeTemplate.type === "award"
              ? nomination.trim() || undefined
              : undefined,
          eventTitle:
            activeTemplate.type === "award"
              ? eventTitle.trim() || undefined
              : undefined,
          eventDate:
            activeTemplate.type === "award"
              ? eventDate.trim() || undefined
              : undefined,
          eventLocation:
            activeTemplate.type === "award"
              ? eventLocation.trim() || undefined
              : undefined,

          // Voucher
          voucherServiceType:
            activeTemplate.type === "voucher" ? voucherServiceType : undefined,
          voucherValue:
            activeTemplate.type === "voucher" ? voucherValue : undefined,
          voucherPromoCode:
            activeTemplate.type === "voucher" ? voucherPromoCode : undefined,
          voucherExpiryDate:
            activeTemplate.type === "voucher" ? voucherExpiryDate : undefined,
          totalSessions:
            activeTemplate.type === "voucher"
              ? Number(voucherSessions) || 1
              : undefined,
          validUntil,

          // Certificate
          skillsSummary:
            activeTemplate.type === "certificate"
              ? skillsSummary.trim() || undefined
              : undefined,
          hoursTrained:
            activeTemplate.type === "certificate"
              ? Number(hoursTrained) || undefined
              : undefined,

          // Backside
          includeBackside: activeTemplate.visualConfig?.includeBackside,
          backsideStyle: activeTemplate.visualConfig?.backsideStyle,
          backsideTitle: activeTemplate.visualConfig?.backsideTitle,
          backsideMessage: activeTemplate.visualConfig?.backsideMessage,
          backsideSignatory: activeTemplate.visualConfig?.backsideSignatory,
        },
      };

      const newCert = await certificateIssuanceService.issueCertificate(
        siteId,
        input
      );

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (confettiErr) {
        // Fallback silently if confetti fails
      }

      setIssuedSuccessDoc(newCert);
      await onIssuedSuccess();
    } catch (error) {
      console.error("Грешка при издаване на документ:", error);
      toast.error("Възникна грешка при издаването на документа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicUrl = issuedSuccessDoc
    ? `${window.location.origin}/cert/${issuedSuccessDoc.id}`
    : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Линкът към документа е копиран в клипборда!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWebShare = async () => {
    if (!publicUrl || !issuedSuccessDoc) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${activeTemplate?.title || "Документ"} - ${issuedSuccessDoc.recipient.name}`,
          text: `Официален клубен документ № ${issuedSuccessDoc.serialNumber} за ${issuedSuccessDoc.recipient.name}`,
          url: publicUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6">
      {/* If no approved templates exist */}
      {approvedTemplates.length === 0 ? (
        <Card className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Award className="size-10 text-amber-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Няма одобрени шаблони за издаване
          </h3>
          <p className="max-w-md text-xs text-zinc-500">
            За да издадете грамота или ваучер, първо одобрете поне един шаблон в
            раздел „Шаблони (Конструктор)“.
          </p>
          {onOpenTemplates && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTemplates}
              className="mt-2 rounded-xl"
            >
              Към шаблоните
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: Issuance Form (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="space-y-5 rounded-3xl border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <Printer className="size-4 text-blue-600" />
                  <span>Издаване на Персонален Документ</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Попълнете данните за получателя и параметрите на документа.
                </p>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-4">
                {/* 1. Template Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Избор на одобрен шаблон{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(val) => setSelectedTemplateId(val)}
                  >
                    <SelectTrigger className="h-10 rounded-2xl border-zinc-200 text-xs dark:border-zinc-800">
                      <SelectValue placeholder="Изберете шаблон" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                      {approvedTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {getCertificateTypeLabel(t.type)}: {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 1.1 Tournament Integration Selector */}
                <div className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase dark:text-amber-200">
                      <Trophy className="size-3.5 text-amber-600" />
                      Зареди данни от Турнир:
                    </Label>
                    {selectedTournamentId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTournamentId("")}
                        className="text-[10px] text-zinc-500 hover:underline"
                      >
                        Изчисти ✕
                      </button>
                    )}
                  </div>

                  <Select
                    value={selectedTournamentId}
                    onValueChange={(val) => setSelectedTournamentId(val)}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-amber-300 bg-white text-xs dark:bg-zinc-900">
                      <SelectValue placeholder="-- Изберете турнир/състезание --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {tournaments.map((t) => (
                        <SelectItem key={t.id || ""} value={t.id || ""}>
                          🏆 {t.title} ({t.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* If tournament selected, show tournament player picker & bulk button */}
                  {selectedTournamentId && (
                    <div className="space-y-2 border-t border-amber-200/60 pt-2">
                      {tournamentEntries.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                              Избери класиран състезател от турнира:
                            </Label>
                            <Select
                              onValueChange={handleSelectTournamentPlayer}
                            >
                              <SelectTrigger className="h-9 rounded-xl bg-white text-xs dark:bg-zinc-900">
                                <SelectValue placeholder="-- Изберете участник за автопопълване --" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {tournamentEntries.map((e, idx) => {
                                  const member = members.find(
                                    (m) => m.id === e.memberId
                                  );
                                  const name = member
                                    ? `${member.firstName} ${member.lastName}`
                                    : e.externalName || `Участник ${idx + 1}`;
                                  const place =
                                    idx === 0
                                      ? "🥇 1-во място"
                                      : idx === 1
                                        ? "🥈 2-ро място"
                                        : idx === 2
                                          ? "🥉 3-то място"
                                          : "🎖️ Участник";
                                  return (
                                    <SelectItem
                                      key={e.id || String(idx)}
                                      value={e.id || String(idx)}
                                    >
                                      {place}: {name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* BULK ISSUE BUTTON FOR ALL PODIUM FINISHERS */}
                          <Button
                            type="button"
                            onClick={handleBulkIssueMedalists}
                            disabled={isBulkIssuing}
                            className="w-full gap-2 rounded-xl bg-linear-to-r from-amber-500 via-amber-600 to-yellow-500 text-xs font-black text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-yellow-600"
                          >
                            {isBulkIssuing ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Издаване на грамоти...
                              </>
                            ) : (
                              <>
                                <Sparkles className="size-3.5" />⚡ Генерирай
                                накуп за всички медалисти (1-во, 2-ро, 3-то
                                място)
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <p className="text-[11px] italic text-zinc-500">
                          Няма регистрирани състезатели в този турнир.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 1.2 Camp Integration Selector */}
                <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase dark:text-emerald-200">
                      <span>🏕️</span>
                      Зареди данни от Спортен Лагер:
                    </Label>
                    {selectedCampId && (
                      <button
                        type="button"
                        onClick={() => setSelectedCampId("")}
                        className="text-[10px] text-zinc-500 hover:underline"
                      >
                        Изчисти ✕
                      </button>
                    )}
                  </div>

                  <Select
                    value={selectedCampId}
                    onValueChange={(val) => setSelectedCampId(val)}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-emerald-300 bg-white text-xs dark:bg-zinc-900">
                      <SelectValue placeholder="-- Изберете тренировъчен лагер --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {camps.map((c) => (
                        <SelectItem key={c.id || ""} value={c.id || ""}>
                          🏕️ {c.title} ({c.attendees?.length || 0} участници)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* If camp selected, show attendees info & bulk issue button */}
                  {selectedCampId && (
                    <div className="space-y-2 border-t border-emerald-200/60 pt-2">
                      {campAttendees.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                            <span className="font-semibold">
                              Записани участници:
                            </span>
                            <span className="font-bold">
                              {campAttendees.length} състезатели
                            </span>
                          </div>

                          <Button
                            type="button"
                            onClick={handleBulkIssueCampParticipants}
                            disabled={isBulkIssuing}
                            className="w-full gap-2 rounded-xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
                          >
                            {isBulkIssuing ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Издаване на сертификати...
                              </>
                            ) : (
                              <>
                                <Sparkles className="size-3.5" />⚡ Генерирай
                                сертификати за всички {campAttendees.length}{" "}
                                участници
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <p className="text-[11px] italic text-zinc-500">
                          Няма добавени присъстващи в този лагер.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Recipient Mode Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Получател на документа{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => setRecipientMode("member")}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          recipientMode === "member"
                            ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        👤 Картотека
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientMode("manual");
                          setSelectedMemberId(null);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                          recipientMode === "manual"
                            ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        ✏️ Външен участник
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete Member Search */}
                  {recipientMode === "member" && (
                    <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                        <Input
                          placeholder="Търсене на състезател/член..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="h-8 rounded-xl border-zinc-200 bg-white pl-8 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                        />
                      </div>

                      {/* Age Category Filter Pills */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {[
                          { id: "all", label: "🌟 Всички" },
                          { id: "u11", label: "U11 (до 11г.)" },
                          { id: "u13", label: "U13 (12-13)" },
                          { id: "u15", label: "U15 (14-15)" },
                          { id: "u17", label: "U17 (16-17)" },
                          { id: "adults", label: "18+ (Мъже/Жени)" },
                        ].map((grp) => (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => setSelectedAgeGroup(grp.id)}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                              selectedAgeGroup === grp.id
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-zinc-200/70 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {grp.label}
                          </button>
                        ))}
                      </div>

                      {/* Member list chips */}
                      <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                        {loadingMembers ? (
                          <div className="flex items-center justify-center p-3 text-xs text-zinc-400">
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Зареждане на членове...
                          </div>
                        ) : filteredMembers.length === 0 ? (
                          <p className="p-2 text-center text-[11px] text-zinc-400 italic">
                            Няма съвпадащи състезатели.
                          </p>
                        ) : (
                          filteredMembers.map((m) => {
                            const isSelected = selectedMemberId === m.id;
                            const fullName =
                              `${m.firstName} ${m.lastName}`.trim();
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectMember(m)}
                                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 font-bold text-white"
                                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                }`}
                              >
                                <div>
                                  <div>{fullName}</div>
                                  {m.educationInstitution && (
                                    <div
                                      className={`text-[10px] ${
                                        isSelected
                                          ? "text-blue-100"
                                          : "text-zinc-400"
                                      }`}
                                    >
                                      {m.educationInstitution}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="size-3.5 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recipient Details Inputs */}
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Трите имена на получателя
                      </Label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="напр. Георги Иванов Иванов"
                        className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Училище / Детска градина / Клуб
                      </Label>
                      <Input
                        value={recipientInstitution}
                        onChange={(e) =>
                          setRecipientInstitution(e.target.value)
                        }
                        placeholder="напр. СУ „Васил Левски“ • гр. Гълъбово"
                        className="h-9 rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Type-Specific Parameters */}
                {activeTemplate?.type === "award" && (
                  <div className="space-y-3 rounded-2xl border border-amber-200/50 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Trophy className="size-3.5 text-amber-600" />
                      <span>Параметри на Грамотата</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Класиране / Отличие
                      </Label>
                      <Select
                        value={awardRank}
                        onValueChange={(val) => setAwardRank(val as AwardRank)}
                      >
                        <SelectTrigger className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="1st">
                            🥇 I-во Място (Шампион)
                          </SelectItem>
                          <SelectItem value="2nd">
                            🥈 II-ро Място (Вицешампион)
                          </SelectItem>
                          <SelectItem value="3rd">
                            🥉 III-то Място (Бронзов медал)
                          </SelectItem>
                          <SelectItem value="participant">
                            🎗️ Грамота за Участие
                          </SelectItem>
                          <SelectItem value="honorable">
                            ⭐ Почетна Грамота
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Турнир / Събитие
                      </Label>
                      <Input
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Повод / Номинация (по избор)
                      </Label>
                      <Input
                        value={nomination}
                        onChange={(e) => setNomination(e.target.value)}
                        placeholder="напр. Най-перспективен млад състезател"
                        className="h-8 rounded-xl border-amber-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {activeTemplate?.type === "voucher" && (
                  <div className="space-y-3 rounded-2xl border border-teal-200/50 bg-teal-50/50 p-3.5 dark:border-teal-900/40 dark:bg-teal-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                      <Ticket className="size-3.5 text-teal-600" />
                      <span>Параметри на Ваучера</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                        Валиден за услуга / стока:
                      </Label>
                      <Input
                        value={voucherServiceType}
                        onChange={(e) => setVoucherServiceType(e.target.value)}
                        placeholder="напр. Месечна такса тренировки"
                        className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {[
                          "Месечна такса тренировки",
                          "Индивидуална тренировка с треньор",
                          "Клубна екипировка/ракета",
                          "Свободна игра на корт",
                        ].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setVoucherServiceType(s)}
                            className="rounded-md border border-teal-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-teal-900 hover:bg-teal-100 dark:bg-zinc-900 dark:text-teal-200"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Стойност / Отстъпка
                        </Label>
                        <Input
                          value={voucherValue}
                          onChange={(e) => setVoucherValue(e.target.value)}
                          placeholder="напр. 50 лв. или 20%"
                          className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Код на ваучера
                        </Label>
                        <Input
                          value={voucherPromoCode}
                          onChange={(e) => setVoucherPromoCode(e.target.value)}
                          placeholder="напр. BKG-GIFT"
                          className="h-8 rounded-xl border-teal-300/80 bg-white font-mono text-xs uppercase dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Брой процедури / сесии
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={voucherSessions}
                          onChange={(e) =>
                            setVoucherSessions(Number(e.target.value))
                          }
                          className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                          Срок на валидност
                        </Label>
                        <Input
                          value={voucherExpiryDate}
                          onChange={(e) => setVoucherExpiryDate(e.target.value)}
                          placeholder="напр. 31.12.2026 г."
                          className="h-8 rounded-xl border-teal-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTemplate?.type === "certificate" && (
                  <div className="space-y-3 rounded-2xl border border-blue-200/50 bg-blue-50/50 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Award className="size-3.5 text-blue-600" />
                      <span>Параметри на Сертификата</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                        Обучителни часове
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={hoursTrained}
                        onChange={(e) =>
                          setHoursTrained(Number(e.target.value))
                        }
                        className="h-8 rounded-xl border-blue-300/80 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Генериране на QR код & Издаване...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        Издай официален документ
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* RIGHT: Live Preview (7 cols) */}
          <div className="flex flex-col items-center justify-start space-y-4 lg:col-span-7">
            <div className="flex w-full items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                <Sparkles className="size-3.5 text-amber-500" />
                Визуализация в реално време
                {activeTemplate?.visualConfig?.includeBackside &&
                  " (Двустранен)"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => printCertificate()}
                  className="h-7 gap-1 rounded-lg border-zinc-200 px-2 text-[11px] font-bold dark:border-zinc-800"
                  title="Печат A4"
                >
                  <Printer className="size-3" />
                  Печат
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExportLivePdf}
                  disabled={isExportingPdf}
                  className="h-7 gap-1 rounded-lg border-zinc-200 px-2 text-[11px] font-bold dark:border-zinc-800"
                  title="Изтегли PDF (Лице)"
                >
                  <FileDown className="size-3" />
                  PDF (Лице)
                </Button>
                {activeTemplate?.visualConfig?.includeBackside && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleExportLiveBacksidePdf}
                      disabled={isExportingBacksidePdf}
                      className="h-7 gap-1 rounded-lg border-amber-300 px-2 text-[11px] font-bold text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200"
                      title="Изтегли PDF (Гръб)"
                    >
                      <FileDown className="size-3" />
                      PDF (Гръб)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleExportLiveDoublePdf}
                      disabled={isExportingDoublePdf}
                      className="h-7 gap-1 rounded-lg border-purple-300 bg-purple-50/50 px-2 text-[11px] font-bold text-purple-900 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200"
                      title="Изтегли 2-страничен PDF"
                    >
                      <Sparkles className="size-3 text-purple-600" />
                      2-странен PDF
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExportLivePng}
                  disabled={isExportingPng}
                  className="h-7 gap-1 rounded-lg border-zinc-200 px-2 text-[11px] font-bold dark:border-zinc-800"
                  title="Изтегли Ultra HD PNG"
                >
                  <Download className="size-3" />
                  PNG (300 DPI)
                </Button>
              </div>
            </div>

            <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-200/80 bg-zinc-100/70 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              {activeTemplate ? (
                activeTemplate.visualConfig?.includeBackside ? (
                  <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="block text-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        📄 Лице (Front)
                      </span>
                      <CertificateDocumentPreview
                        data={{
                          siteId,
                          type: activeTemplate.type,
                          title: activeTemplate.title,
                          visualConfig: {
                            ...activeTemplate.visualConfig,
                            voucherServiceType,
                            voucherValue,
                            voucherPromoCode,
                            voucherExpiryDate,
                          },
                          serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-LIVE`,
                          recipientName:
                            recipientName || "Иван Петров Димитров",
                          recipientInstitution:
                            recipientInstitution ||
                            "СУ „Васил Левски“ • гр. Гълъбово",
                          rank: awardRank,
                          nomination,
                          eventTitle,
                          eventDate,
                          eventLocation,
                          totalSessions: voucherSessions,
                          sponsors,
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-center text-xs font-bold text-amber-500">
                        📜 Гръб (Backside)
                      </span>
                      <CertificateBacksidePreview
                        data={{
                          siteId,
                          type: activeTemplate.type,
                          title: activeTemplate.title,
                          visualConfig: {
                            ...activeTemplate.visualConfig,
                            voucherServiceType,
                            voucherValue,
                            voucherPromoCode,
                            voucherExpiryDate,
                          },
                          serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-LIVE`,
                          recipientName:
                            recipientName || "Иван Петров Димитров",
                          recipientInstitution:
                            recipientInstitution ||
                            "СУ „Васил Левски“ • гр. Гълъбово",
                          rank: awardRank,
                          nomination,
                          eventTitle,
                          eventDate,
                          eventLocation,
                          totalSessions: voucherSessions,
                          sponsors,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="scale-0.85 sm:scale-0.95 origin-top transform transition-all">
                    <CertificateDocumentPreview
                      data={{
                        siteId,
                        type: activeTemplate.type,
                        title: activeTemplate.title,
                        visualConfig: {
                          ...activeTemplate.visualConfig,
                          voucherServiceType,
                          voucherValue,
                          voucherPromoCode,
                          voucherExpiryDate,
                        },
                        serialNumber: `${siteId === "recoveryzone" ? "RZ" : "BKG"}-2026-LIVE`,
                        recipientName: recipientName || "Иван Петров Димитров",
                        recipientInstitution:
                          recipientInstitution ||
                          "СУ „Васил Левски“ • гр. Гълъбово",
                        rank: awardRank,
                        nomination,
                        eventTitle,
                        eventDate,
                        eventLocation,
                        totalSessions: voucherSessions,
                        sponsors,
                      }}
                    />
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal upon issuance */}
      <Dialog
        open={Boolean(issuedSuccessDoc)}
        onOpenChange={(open) => {
          if (!open) {
            setIssuedSuccessDoc(null);
            onSwitchToRegistry();
          }
        }}
      >
        <DialogContent className="max-w-lg space-y-4 rounded-3xl border-zinc-200 p-6 text-center dark:border-zinc-800">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white">
              Документът е издаден успешно!
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Уникалният сериен номер и QR код бяха генерирани и записани в
              официалния регистър.
            </DialogDescription>
          </div>

          {issuedSuccessDoc && (
            <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500">
                  Сериен номер:
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {issuedSuccessDoc.serialNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500">Получател:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {issuedSuccessDoc.recipient.name}
                </span>
              </div>

              {/* QR Code preview */}
              {issuedSuccessDoc.qrCodeDataUrl && (
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-xs">
                    <Image
                      src={issuedSuccessDoc.qrCodeDataUrl}
                      alt="QR код за верификация"
                      width={120}
                      height={120}
                      className="size-28 object-contain"
                      style={{ width: "auto", height: "auto" }}
                      unoptimized
                    />
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-zinc-400">
                    {publicUrl}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Social Share & Copy Buttons */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 rounded-2xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                {copiedLink ? (
                  <>
                    <Check className="mr-1.5 size-3.5 text-emerald-600" />
                    Копирано!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" />
                    Копирай линк
                  </>
                )}
              </Button>

              <Button
                onClick={handleWebShare}
                className="h-10 rounded-2xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Share2 className="mr-1.5 size-3.5" />
                Сподели (Share)
              </Button>
            </div>

            {/* Quick Export / Print in Success Modal */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => printCertificate()}
                className="h-9 gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                <Printer className="size-3.5" />
                Печат
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportLivePdf}
                disabled={isExportingPdf}
                className="h-9 gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                {isExportingPdf ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
                PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportLivePng}
                disabled={isExportingPng}
                className="h-9 gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
              >
                {isExportingPng ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                PNG
              </Button>
            </div>

            {/* Direct Messenger Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={`viber://forward?text=${encodeURIComponent(`Официален документ от БК Гълъбово: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
              >
                <span>📱 Viber</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Официален клубен документ: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <span>💬 WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <span>📘 Facebook</span>
              </a>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                setIssuedSuccessDoc(null);
                onSwitchToRegistry();
              }}
              className="w-full rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              Към регистъра с издадени документи
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Issuance Success Dialog */}
      <Dialog
        open={bulkSuccessList.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkSuccessList([]);
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl dark:border-emerald-950 dark:bg-zinc-950">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <Trophy className="size-7 animate-bounce" />
            </div>
            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50">
              🎉 Грамотите за подиума са генерирани!
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Успешно издадени {bulkSuccessList.length} официални грамоти за
              призьорите от турнира.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {bulkSuccessList.map((doc, idx) => {
              const rank = doc.details?.rank || "participant";
              const rankIcon =
                rank === "1st"
                  ? "🥇 1-во място"
                  : rank === "2nd"
                    ? "🥈 2-ро място"
                    : rank === "3rd"
                      ? "🥉 3-то място"
                      : "🎖️ Призьор";
              const rankColor =
                rank === "1st"
                  ? "border-amber-200 bg-amber-50/60 dark:bg-amber-950/30"
                  : rank === "2nd"
                    ? "border-slate-200 bg-slate-50/60 dark:bg-slate-900/30"
                    : "border-orange-200 bg-orange-50/60 dark:bg-orange-950/30";

              return (
                <div
                  key={doc.id || idx}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${rankColor}`}
                >
                  <div className="min-w-0 pr-3">
                    <span className="inline-block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      {rankIcon}
                    </span>
                    <h5 className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                      {doc.recipient?.name || "Състезател"}
                    </h5>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Сериен № {doc.serialNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={`/cert/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      Преглед
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch PDF Download Button */}
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Button
              type="button"
              onClick={handleDownloadBulkMultiPdf}
              disabled={isExportingBulkPdf}
              className="w-full gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
            >
              {isExportingBulkPdf ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Генериране на общ PDF документ...
                </>
              ) : (
                <>
                  <FileDown className="size-4" />
                  📦 Свали всички {bulkSuccessList.length} грамоти в един общ A4
                  PDF
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setBulkSuccessList([])}
              className="rounded-2xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
            >
              Затвори
            </Button>
            <Button
              onClick={() => {
                setBulkSuccessList([]);
                onSwitchToRegistry();
              }}
              className="rounded-2xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Към регистъра
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden container for rendering bulk certificates to multi-page PDF */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0">
        {bulkSuccessList.map((doc, idx) => (
          <div
            key={`bulk_render_${doc.id || idx}`}
            id={`bulk-preview-item-${idx}`}
          >
            <CertificateDocumentPreview
              data={{
                siteId: doc.siteId,
                type: doc.type,
                title: doc.visualSnapshot?.templateTitle || "Грамота",
                visualConfig: doc.visualSnapshot,
                serialNumber: doc.serialNumber,
                qrCodeDataUrl: doc.qrCodeDataUrl,
                recipientName: doc.recipient?.name,
                recipientInstitution: doc.recipient?.institution,
                rank: doc.details?.rank,
                nomination: doc.details?.nomination,
                eventTitle: doc.details?.eventTitle,
                eventDate: doc.details?.eventDate,
                eventLocation: doc.details?.eventLocation,
                totalSessions: doc.details?.totalSessions,
                remainingSessions: doc.details?.remainingSessions,
                validUntil: doc.details?.validUntil,
                skillsSummary: doc.details?.skillsSummary,
                hoursTrained: doc.details?.hoursTrained,
                sponsors: sponsors,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
