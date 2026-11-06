"use client";

import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FileSignature,
  Loader2,
  Mail,
  Search,
  Send,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SignatureDialog } from "@/components/members/signature-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { createDocumentRequestAction } from "@/lib/actions/document-requests";
import { getDocumentTemplatesAction } from "@/lib/actions/document-templates";
import { getMembersAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";
import { DOCUMENT_TITLES, DocumentType } from "@/types/document-request.types";
import { DocumentTemplate } from "@/types/document-template.types";
import { Member } from "@/types/member.types";

interface SendDocumentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialMemberId?: string;
  initialDocumentType?: DocumentType;
}

export function SendDocumentRequestDialog({
  open,
  onOpenChange,
  onSuccess,
  initialMemberId,
  initialDocumentType,
}: SendDocumentRequestDialogProps) {
  const { user } = useAuth();
  const chairperson = useChairpersonSignature();
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form selections
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    initialDocumentType || "membershipApplication"
  );
  const [signAsPresident, setSignAsPresident] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedMember(null);
      setMemberSearch("");
      setGeneratedUrl(null);
      setErrorMessage(null);
      setCopied(false);
      return;
    }

    async function loadData() {
      setLoadingInitial(true);
      try {
        const [mRes, tRes] = await Promise.all([
          getMembersAction(),
          getDocumentTemplatesAction(),
        ]);
        if (mRes.success && mRes.data) {
          // Sort members alphabetically
          const sorted = [...mRes.data].sort((a, b) =>
            formatFullName(a).localeCompare(formatFullName(b), "bg")
          );
          setMembers(sorted);
          if (initialMemberId) {
            const found = sorted.find((m) => m.id === initialMemberId);
            if (found) setSelectedMember(found);
          }
        }
        if (tRes.success && tRes.data) {
          setTemplates(tRes.data.filter((t) => t.isActive));
        }
        if (initialDocumentType) {
          setSelectedDocType(initialDocumentType);
        }
      } catch (err) {
        console.error("Error loading dialog data:", err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [open, initialMemberId, initialDocumentType]);

  // Filter members by search input
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8);
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        formatFullName(m).toLowerCase().includes(q) ||
        (m.parentPhone || "").includes(q) ||
        (m.phone || "").includes(q)
    );
  }, [members, memberSearch]);

  const documentTitle =
    DOCUMENT_TITLES[selectedDocType] ||
    templates.find((t) => t.id === selectedDocType)?.title ||
    "Документ";

  const handleGenerate = async () => {
    if (!selectedMember) {
      toast.error("Моля, изберете състезател от списъка.");
      return;
    }
    if (!user) {
      toast.error("Не сте оторизиран.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();
      const res = await createDocumentRequestAction({
        memberId: selectedMember.id,
        documentType: selectedDocType,
        idToken,
        signAsPresident,
        presidentSignatureUrl: signAsPresident
          ? chairperson.signatureUrl
          : null,
      });

      if (res.success && res.data) {
        const origin =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://bkgalabovo2025.vercel.app";
        const fullUrl = `${origin}/sign/${res.data.token}`;
        setGeneratedUrl(fullUrl);
        toast.success("Линкът за подписване е генериран успешно!");
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || "Грешка при генериране на линк.");
      }
    } catch (err) {
      console.error("Error creating document request:", err);
      setErrorMessage("Възникна непредвидена грешка при създаване на линка.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Линкът е копиран в клипборда!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Неуспешно копиране.");
    }
  };

  const shareText = selectedMember
    ? `Здравейте! Изпращам Ви официален клубен линк за онлайн попълване и подписване на „${documentTitle}“ за ${formatFullName(
        selectedMember
      )} в СНЦ „Бадминтон клуб Гълъбово“: ${generatedUrl || ""}`
    : "";

  const handleCopyMessage = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Съобщението с линк е копирано в клипборда!");
    } catch {
      toast.error("Неуспешно копиране.");
    }
  };

  const handleEmailShare = () => {
    if (!generatedUrl || !selectedMember) return;
    const memberName = formatFullName(selectedMember);
    const subject = encodeURIComponent(
      `Документ за подписване: ${documentTitle} - ${memberName}`
    );
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:${
      selectedMember.parentEmail || ""
    }?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-zinc-800">
                <FileSignature className="size-4 text-emerald-400" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                  Изпрати документ за онлайн подписване
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Изберете състезател и вид бланка за незабавно генериране на
                  защитен линк.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="size-7 animate-spin text-zinc-500" />
              <p className="text-xs text-zinc-400">
                Зареждане на картотеката...
              </p>
            </div>
          ) : generatedUrl ? (
            /* Result View */
            <div className="mt-2 space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Документ:</span>
                  <span className="font-bold text-emerald-950">
                    {documentTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Състезател:</span>
                  <span className="font-bold text-zinc-900">
                    {selectedMember ? formatFullName(selectedMember) : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Линк за споделяне
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedUrl}
                    className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs font-mono select-all"
                  />
                  <Button
                    type="button"
                    onClick={handleCopy}
                    className="h-11 px-4 rounded-xl bg-zinc-950 text-white shrink-0 hover:bg-zinc-800"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyMessage}
                  className="h-11 rounded-xl border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold gap-1.5"
                >
                  <Copy className="size-4" />
                  Копирай текст
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEmailShare}
                  className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold gap-1.5"
                >
                  <Mail className="size-4" />
                  Изпрати имейл
                </Button>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-zinc-500 border-t border-zinc-100">
                <span>Валидност на линка: 14 дни</span>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:underline"
                >
                  Отвори в нов таб <ExternalLink className="size-3" />
                </a>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGeneratedUrl(null);
                  setSelectedMember(null);
                }}
                className="w-full h-10 rounded-xl text-xs font-semibold border-zinc-200"
              >
                + Изпрати друг документ
              </Button>
            </div>
          ) : (
            /* Selection Form */
            <div className="mt-2 space-y-4">
              {/* 1. Member Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800">
                  1. Изберете състезател / член на клуба:
                </label>

                {selectedMember ? (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs">
                    <div>
                      <p className="font-bold text-zinc-950">
                        {formatFullName(selectedMember)}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Родител: {selectedMember.parentName || "—"} •{" "}
                        {selectedMember.parentPhone ||
                          selectedMember.phone ||
                          "няма тел."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMember(null)}
                      className="h-7 text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Смени
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                      <Input
                        placeholder="Търсене по име на дете или телефон..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="h-9 pl-9 rounded-xl text-xs"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                      {filteredMembers.length === 0 ? (
                        <p className="p-3 text-center text-xs text-zinc-400">
                          Няма намерени състезатели.
                        </p>
                      ) : (
                        filteredMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMember(m)}
                            className="w-full flex items-center justify-between p-2.5 text-left text-xs hover:bg-zinc-50 transition-colors"
                          >
                            <span className="font-semibold text-zinc-900">
                              {formatFullName(m)}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {m.parentPhone || m.phone || ""}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Document Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  2. Изберете документ / бланка:
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) =>
                    setSelectedDocType(e.target.value as DocumentType)
                  }
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <optgroup label="Официални клубни бланки">
                    <option value="membershipApplication">
                      Молба за членство в клуба
                    </option>
                    <option value="signedDeclaration">
                      Декларация за информирано съгласие
                    </option>
                    <option value="travelDeclaration">
                      Съгласие за участие и пътуване
                    </option>
                    <option value="safetyInstruction">
                      Инструктаж за безопасност
                    </option>
                    <option value="internalRules">
                      Вътрешен правилник на клуба
                    </option>
                    <option value="amateurContract">
                      Договор за аматьорски статут
                    </option>
                    <option value="licenseApplication">
                      Молба за картотекиране в БФБадминтон
                    </option>
                    <option value="terminationRequest">
                      Молба за прекратяване на членство
                    </option>
                  </optgroup>
                  {templates.filter(
                    (t) =>
                      ![
                        "membershipApplication",
                        "signedDeclaration",
                        "travelDeclaration",
                        "safetyInstruction",
                        "internalRules",
                        "amateurContract",
                        "licenseApplication",
                        "terminationRequest",
                      ].includes(t.id)
                  ).length > 0 && (
                    <optgroup label="Допълнителни бланки от регистъра">
                      {templates
                        .filter(
                          (t) =>
                            ![
                              "membershipApplication",
                              "signedDeclaration",
                              "travelDeclaration",
                              "safetyInstruction",
                              "internalRules",
                              "amateurContract",
                              "licenseApplication",
                              "terminationRequest",
                            ].includes(t.id)
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* 3. Chairperson Pre-Signing Option */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signAsPresident"
                    className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-900"
                  >
                    <Checkbox
                      id="signAsPresident"
                      checked={signAsPresident}
                      onCheckedChange={(c) => setSignAsPresident(!!c)}
                    />
                    <span>Положи подпис на Председателя (Мира Георгиева)</span>
                  </label>
                  {chairperson.signatureUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => chairperson.setDialogOpen(true)}
                      className="h-6 px-2 text-[11px] text-zinc-500 hover:text-zinc-900"
                    >
                      Смени
                    </Button>
                  ) : null}
                </div>

                {signAsPresident && (
                  <div className="pt-1">
                    {chairperson.signatureUrl ? (
                      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={chairperson.signatureUrl}
                          alt="Подпис на Председателя"
                          className="h-7 max-w-25 object-contain bg-white rounded px-1 border border-emerald-100"
                        />
                        <span className="text-[11px] font-semibold text-emerald-800">
                          ✓ Документът ще бъде предварително подписан от клуба
                          преди изпращане
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900">
                        <span>Няма запазен подпис на Председателя.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => chairperson.setDialogOpen(true)}
                          className="h-7 text-xs rounded-lg border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-bold"
                        >
                          ✍️ Нарисувай подпис сега
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="button"
                disabled={!selectedMember || isGenerating}
                onClick={handleGenerate}
                className="w-full h-11 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Генериране на сигурен линк...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4 text-emerald-400" />
                    Генерирай линк за подписване
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SignatureDialog
        open={chairperson.dialogOpen}
        onClose={() => chairperson.setDialogOpen(false)}
        title="Официален подпис на Председателя"
        description="Положете или нарисувайте подписа на Председателя (Мира Георгиева), който ще се поставя върху изпратените официални документи."
        onSave={chairperson.handleSaveSignature}
      />
    </>
  );
}
