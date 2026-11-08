"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Check,
  Clock,
  FileText,
  Link2,
  Printer,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BLANK_DECLARATION_PDF_URL,
  type DeclarationSectionId,
} from "@/components/declarations/declaration-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import {
  deleteDeclarationAction,
  getAllDeclarationsAction,
} from "@/lib/actions/declarations";
import { cn } from "@/lib/utils";
import { SignedDeclaration } from "@/types";

interface DeclarationsClientProps {
  initialDeclarations?: SignedDeclaration[];
  section?: DeclarationSectionId;
}

export default function DeclarationsClient({
  initialDeclarations = [],
  section = "signed",
}: DeclarationsClientProps) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("declarationId") || searchParams.get("id");
  const [declarations, setDeclarations] =
    useState<SignedDeclaration[]>(initialDeclarations);
  const [loading, setLoading] = useState(initialDeclarations.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "adult" | "minor">(
    "all"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (section === "templates" || initialDeclarations.length > 0) {
      setLoading(false);
      return;
    }

    async function fetchDeclarations() {
      try {
        const res = await getAllDeclarationsAction();
        if (res.success && res.data) {
          setDeclarations(res.data);
        }
      } catch (error) {
        console.error("Error fetching declarations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeclarations();
  }, [initialDeclarations, section]);

  // Дълбок линк ?declarationId=... – превъртане до записа.
  useEffect(() => {
    if (!focusId || loading) return;
    document
      .getElementById(`declaration-${focusId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, loading]);

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Сигурни ли сте, че искате да изтриете декларацията на ${name}? Това действие е необратимо.`
      )
    ) {
      try {
        const res = await deleteDeclarationAction(id);
        if (res.success) {
          setDeclarations((prev) => prev.filter((d) => d.id !== id));
        } else {
          alert(res.message || "Възникна грешка при изтриването.");
        }
      } catch (error) {
        console.error("Error deleting declaration:", error);
        alert("Възникна грешка при изтриването.");
      }
    }
  };

  const metrics = useMemo(() => {
    const total = declarations.length;
    const minors = declarations.filter((d) => d.isMinor).length;
    const adults = total - minors;
    return { total, adults, minors };
  }, [declarations]);

  const filteredDeclarations = useMemo(() => {
    return declarations.filter((d) => {
      if (roleFilter === "minor" && !d.isMinor) return false;
      if (roleFilter === "adult" && d.isMinor) return false;
      return (
        d.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.phone && d.phone.includes(searchTerm))
      );
    });
  }, [declarations, roleFilter, searchTerm]);

  useDeepLinkHighlight(
    "declaration",
    !loading && filteredDeclarations.length > 0,
    "declarationId"
  );

  const handleCopyDeclarationLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към декларацията е копиран!");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4 text-left shadow-2xs transition-all cursor-pointer",
            roleFilter === "all"
              ? "border-zinc-900 bg-white ring-2 ring-zinc-900/10 dark:border-white dark:bg-zinc-900 dark:ring-white/10"
              : "border-zinc-100 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
          )}
        >
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Общо декларации
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white">
              {metrics.total}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <FileText className="size-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter("adult")}
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4 text-left shadow-2xs transition-all cursor-pointer",
            roleFilter === "adult"
              ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
              : "border-zinc-100 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
          )}
        >
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              За състезатели (пълнолетни)
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white">
              {metrics.adults}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <User className="size-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter("minor")}
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4 text-left shadow-2xs transition-all cursor-pointer",
            roleFilter === "minor"
              ? "border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/30"
              : "border-zinc-100 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
          )}
        >
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              За родители / настойници
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white">
              {metrics.minors}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Users className="size-5" />
          </span>
        </button>
      </div>

      {section === "signed" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3.5 sm:p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Search className="size-5 text-zinc-400" />
            <Input
              placeholder="Търсене по име или телефон..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>

          {(() => {
            if (loading) {
              return (
                <div className="p-12 text-center text-zinc-500">
                  Зареждане на декларации...
                </div>
              );
            }
            if (filteredDeclarations.length === 0) {
              return (
                <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center dark:border-zinc-900 dark:bg-zinc-950">
                  <FileText className="mx-auto mb-4 size-12 text-zinc-300" />
                  <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Няма намерени декларации
                  </h3>
                  <p className="text-zinc-500">
                    Все още няма подписани декларации или нищо не съвпада с
                    търсенето.
                  </p>
                </div>
              );
            }
            return (
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredDeclarations.map((decl) => (
                    <div
                      key={decl.id}
                      id={`declaration-${decl.id}`}
                      className={`flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 sm:p-5 dark:hover:bg-zinc-900/50 ${decl.id === focusId ? "bg-primary/5 ring-2 ring-primary ring-inset" : ""}`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <User className="size-4 sm:size-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-white">
                            {decl.memberId ? (
                              <Link
                                href={`/members/${decl.memberId}/documents`}
                                className="hover:text-primary hover:underline"
                              >
                                {decl.memberName}
                              </Link>
                            ) : (
                              decl.memberName
                            )}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 sm:gap-x-4 sm:text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {format(
                                new Date(decl.signedAt),
                                "d MMMM yyyy, HH:mm",
                                { locale: bg }
                              )}
                            </span>
                            {decl.phone && <span>{decl.phone}</span>}
                            {decl.isMinor && (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                Непълнолетен
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-zinc-50 pt-2 sm:w-auto sm:border-0 sm:pt-0 dark:border-zinc-900">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyDeclarationLink(decl.id)}
                          title="Копирай директен линк към тази декларация"
                          className="px-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          {copiedId === decl.id ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Link2 className="size-4" />
                          )}
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          <Link
                            href={`/print-declaration/${decl.id}`}
                            target="_blank"
                          >
                            <Printer className="mr-2 size-4" />
                            Преглед
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          onClick={() => handleDelete(decl.id, decl.memberName)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {section === "templates" && (
        <div className="space-y-6">
          <div
            id="template-informed-consent"
            className="flex flex-col items-center justify-center rounded-2xl bg-zinc-100 p-8 text-center dark:bg-zinc-900"
          >
            <FileText className="mb-4 size-12 text-zinc-300" />
            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Оригинален PDF шаблон
            </h3>
            <p className="mb-6 text-sm text-zinc-500">
              От тук можете да изтеглите или разпечатате празна бланка, ако ви е
              нужна на хартия.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a
                href={BLANK_DECLARATION_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Printer className="mr-2 size-4" />
                Отвори шаблона
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
