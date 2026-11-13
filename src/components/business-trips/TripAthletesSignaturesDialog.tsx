"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  PenTool,
  Share2,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearTripAthleteSignatureAction,
  getOrCreateTripSigningTokenAction,
  saveDirectAthleteSignatureAction,
} from "@/lib/actions/trip-signatures";
import type { BusinessTrip } from "@/types/business-trip.types";
import type { Member } from "@/types/member.types";

interface TripAthletesSignaturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  membersDict: Record<string, Member>;
  onRefresh: () => void;
  onOpenDirectSign: (
    tripId: string,
    memberId: string,
    memberName: string
  ) => void;
}

export function TripAthletesSignaturesDialog({
  open,
  onOpenChange,
  trip,
  membersDict,
  onRefresh,
  onOpenDirectSign,
}: TripAthletesSignaturesDialogProps) {
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);
  const [isCopyingAll, setIsCopyingAll] = useState(false);
  const [previewSig, setPreviewSig] = useState<{
    name: string;
    url: string;
  } | null>(null);

  if (!trip) return null;

  // Extract participants who are not coach
  const athleteIds = (trip.participantsIds || []).filter((id) => {
    const m = membersDict[id];
    return m ? !m.isCoach : true;
  });

  const athletes = athleteIds.map((id) => {
    const m = membersDict[id];
    const name = m ? `${m.firstName} ${m.lastName}` : `Участник (${id})`;
    const signature =
      trip.signatures?.athletes?.[id] ||
      (trip.signatures as Record<string, string> | undefined)?.[id];
    const tokenInfo = trip.signingTokens?.[id];
    return {
      id,
      name,
      member: m,
      signature,
      token: tokenInfo?.token,
    };
  });

  const signedCount = athletes.filter((a) => Boolean(a.signature)).length;
  const totalCount = athletes.length;
  const percentage =
    totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;

  const getProgressWidthClass = (pct: number) => {
    if (pct >= 100) return "w-full";
    if (pct >= 90) return "w-11/12";
    if (pct >= 80) return "w-4/5";
    if (pct >= 75) return "w-3/4";
    if (pct >= 60) return "w-3/5";
    if (pct >= 50) return "w-1/2";
    if (pct >= 40) return "w-2/5";
    if (pct >= 30) return "w-1/3";
    if (pct >= 25) return "w-1/4";
    if (pct >= 20) return "w-1/5";
    if (pct > 0) return "w-1/12";
    return "w-0";
  };

  const handleCopyLink = async (athlete: (typeof athletes)[0]) => {
    try {
      let token = athlete.token;
      if (!token) {
        const res = await getOrCreateTripSigningTokenAction({
          tripId: trip.id!,
          memberId: athlete.id,
          memberName: athlete.name,
          siteId: trip.siteId,
          role: "Състезател",
        });
        if (!res.success || !res.data?.token) {
          toast.error(res.error || "Неуспешно генериране на линк.");
          return;
        }
        token = res.data.token;
        onRefresh();
      }

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/sign-trip/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedMemberId(athlete.id);
      setTimeout(() => setCopiedMemberId(null), 2500);
      toast.success(`Линкът за ${athlete.name} е копиран в клипборда!`);
    } catch (e) {
      console.error(e);
      toast.error("Грешка при копиране на линка.");
    }
  };

  const handleCopyAllLinks = async () => {
    if (athletes.length === 0) return;
    try {
      setIsCopyingAll(true);
      const baseUrl = window.location.origin;
      const lines: string[] = [
        `📋 Подписване на ведомост за командировка: ${trip.title}`,
        `Дестинация: ${trip.destination}`,
        `Моля, всеки състезател (или родител) да отвори своя персонален линк и да положи подпис в синьо поле:`,
        "",
      ];

      for (let i = 0; i < athletes.length; i++) {
        const a = athletes[i];
        let token = a.token;
        if (!token) {
          const res = await getOrCreateTripSigningTokenAction({
            tripId: trip.id!,
            memberId: a.id,
            memberName: a.name,
            siteId: trip.siteId,
            role: "Състезател",
          });
          if (res.success && res.data?.token) {
            token = res.data.token;
          }
        }
        const link = token
          ? `${baseUrl}/sign-trip/${token}`
          : "(грешка при генериране)";
        lines.push(`${i + 1}. ${a.name}: ${link}`);
      }

      await navigator.clipboard.writeText(lines.join("\n"));
      onRefresh();
      toast.success("Всички персонални линкове са копирани успешно!");
    } catch (e) {
      console.error(e);
      toast.error("Грешка при копиране на линковете.");
    } finally {
      setIsCopyingAll(false);
    }
  };

  const athletesWithStoredSig = athletes.filter(
    (a) => !a.signature && Boolean(a.member?.signature)
  );

  const handleApplyProfileSignature = async (
    memberId: string,
    memberName: string,
    sigBase64: string
  ) => {
    try {
      const res = await saveDirectAthleteSignatureAction({
        tripId: trip.id!,
        memberId,
        signatureBase64: sigBase64,
        siteId: trip.siteId,
        propagateAll: true,
      });
      if (res.success) {
        toast.success(`Съхраненият подпис за ${memberName} беше приложен!`);
        onRefresh();
      } else {
        toast.error(res.error || "Грешка при прилагане на подписа.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при прилагане на подписа.");
    }
  };

  const handleApplyAllProfileSignatures = async () => {
    if (athletesWithStoredSig.length === 0) return;
    try {
      let count = 0;
      for (const a of athletesWithStoredSig) {
        if (a.member?.signature) {
          const res = await saveDirectAthleteSignatureAction({
            tripId: trip.id!,
            memberId: a.id,
            signatureBase64: a.member.signature,
            siteId: trip.siteId,
            propagateAll: true,
          });
          if (res.success) count++;
        }
      }
      toast.success(`Приложени бяха ${count} съхранени подписа!`);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Грешка при прилагане на съхранените подписи.");
    }
  };

  const handleClearSignature = async (memberId: string, memberName: string) => {
    if (
      !window.confirm(
        `Сигурни ли сте, че искате да премахнете подписа на ${memberName}?`
      )
    ) {
      return;
    }
    try {
      const res = await clearTripAthleteSignatureAction({
        tripId: trip.id!,
        memberId,
      });
      if (res.success) {
        toast.success(`Подписът на ${memberName} е изчистен.`);
        onRefresh();
      } else {
        toast.error(res.error || "Грешка при изчистване на подписа.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Възникна непредвидена грешка.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
          <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Подписи на състезатели във ведомостта
              </DialogTitle>
            </div>
            <DialogDescription className="mt-0.5 text-xs text-zinc-500">
              Командировка:{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {trip.title}
              </span>
            </DialogDescription>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 min-h-0">
            {/* Progress Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  Положени подписи: {signedCount} от {totalCount} състезатели
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {percentage}%
                </span>
              </div>
              <div className="h-2 w-full bg-blue-200/60 rounded-full overflow-hidden dark:bg-blue-900/50">
                <div
                  className={`h-full bg-blue-600 transition-all duration-300 rounded-full ${getProgressWidthClass(percentage)}`}
                />
              </div>

              {athletes.length > 0 && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-900/30">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Подписът се нанася директно във ведомостта в син цвят и се
                    съхранява в профила.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {athletesWithStoredSig.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApplyAllProfileSignatures}
                        className="h-7 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                        title="Приложи съхранените подписи от профилите"
                      >
                        <Sparkles className="mr-1.5 size-3.5 text-emerald-600 dark:text-emerald-400" />
                        Приложи съхранени ({athletesWithStoredSig.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAllLinks}
                      disabled={isCopyingAll}
                      className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-50 border-blue-300 dark:bg-zinc-900 dark:border-blue-800 dark:text-blue-300"
                    >
                      <Share2 className="mr-1.5 size-3.5" />
                      {isCopyingAll ? "Копиране..." : "Копирай всички линкове"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Empty state */}
            {athletes.length === 0 ? (
              <div className="py-8 text-center text-zinc-400">
                <User className="mx-auto size-8 mb-2 opacity-50" />
                <p className="text-xs">
                  Няма добавени състезатели в тази командировка.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {athletes.map((athlete, idx) => {
                  const isSigned = Boolean(athlete.signature);
                  const isCopied = copiedMemberId === athlete.id;

                  return (
                    <div
                      key={athlete.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 transition-colors"
                    >
                      {/* Name & status */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-semibold text-zinc-400 w-5 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {athlete.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isSigned ? (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                              >
                                <CheckCircle2 className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                                Подписан (син)
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-[10px] text-zinc-500 border-zinc-300 dark:text-zinc-400 dark:border-zinc-700"
                              >
                                <Clock className="mr-1 size-3 text-zinc-400" />
                                Очаква подпис
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {isSigned && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Преглед на подписа"
                              onClick={() =>
                                setPreviewSig({
                                  name: athlete.name,
                                  url: athlete.signature!,
                                })
                              }
                              className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400"
                            >
                              <ExternalLink className="size-3.5 mr-1" />
                              Преглед
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Изчисти подпис"
                              onClick={() =>
                                handleClearSignature(athlete.id, athlete.name)
                              }
                              className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}

                        {!isSigned && Boolean(athlete.member?.signature) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleApplyProfileSignature(
                                athlete.id,
                                athlete.name,
                                athlete.member!.signature!
                              )
                            }
                            className="h-8 text-xs rounded-lg border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            title="Приложи съхранения подпис от профила на състезателя"
                          >
                            <Sparkles className="size-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                            От профила
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onOpenDirectSign(trip.id!, athlete.id, athlete.name)
                          }
                          className="h-8 text-xs rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
                        >
                          <PenTool className="size-3.5 mr-1 text-blue-600" />
                          {isSigned ? "Подпиши пак" : "Подпиши тук"}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopyLink(athlete)}
                          className="h-8 text-xs rounded-lg"
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3.5 mr-1 text-emerald-600" />
                              Копирано
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5 mr-1" />
                              Линк за подпис
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Затвори
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Preview Modal */}
      {previewSig && (
        <Dialog
          open={Boolean(previewSig)}
          onOpenChange={() => setPreviewSig(null)}
        >
          <DialogContent className="max-w-xs rounded-2xl p-5 text-center">
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Подпис: {previewSig.name}
            </DialogTitle>
            <div className="mt-3 bg-zinc-50 rounded-xl border border-zinc-200 p-4 flex items-center justify-center min-h-25 dark:bg-white dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSig.url}
                alt={`Подпис на ${previewSig.name}`}
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewSig(null)}
              className="mt-3 w-full text-xs"
            >
              Затвори
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
