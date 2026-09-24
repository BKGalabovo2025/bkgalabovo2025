/* eslint-disable react/forbid-dom-props, sonarjs/no-nested-conditional */
"use client";

import { Calendar, Loader2, Ticket } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { IssuedCertificate } from "@/types/certificates";

interface RedeemVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: IssuedCertificate | null;
  onRedeemed: () => Promise<void>;
}

export function RedeemVoucherDialog({
  open,
  onOpenChange,
  certificate,
  onRedeemed,
}: RedeemVoucherDialogProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!certificate || certificate.type !== "voucher") return null;

  const total = certificate.details.totalSessions || 1;
  const used = certificate.details.usedSessions || 0;
  const remaining = Math.max(0, total - used);
  const isFullyUsed = remaining === 0;

  const handleRedeem = async () => {
    if (isFullyUsed) {
      toast.error("Всички процедури от този ваучер вече са изразходени.");
      return;
    }

    try {
      setIsSubmitting(true);
      await certificateIssuanceService.redeemVoucherSession(
        certificate.id,
        note.trim() || undefined
      );

      toast.success(
        `Отчетена процедура #${used + 1} за ${certificate.recipient.name}!`
      );
      setNote("");
      onOpenChange(false);
      await onRedeemed();
    } catch (error) {
      console.error("Грешка при осребряване на процедура:", error);
      toast.error("Възникна грешка при отчитането на процедурата.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-zinc-200 p-6 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Ticket className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                Отчитане на Ваучер
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                № {certificate.serialNumber} • {certificate.recipient.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Voucher Balance Card */}
        <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-500">Оставащи сесии:</span>
            <span className="text-base font-black text-amber-600 dark:text-amber-400">
              {remaining} от {total}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Използвани: {used}</span>
            <span>Общо в пакета: {total}</span>
          </div>

          {certificate.details.validUntil && (
            <div className="flex items-center gap-1.5 border-t border-zinc-200/60 pt-1 text-[11px] text-zinc-500 dark:border-zinc-800/60">
              <Calendar className="size-3 text-zinc-400" />
              <span>
                Валиден до:{" "}
                {new Date(certificate.details.validUntil).toLocaleDateString(
                  "bg-BG"
                )}
              </span>
            </div>
          )}
        </div>

        {/* Usage Log History (if any) */}
        {certificate.details.usageLog &&
          certificate.details.usageLog.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                История на ползванията ({certificate.details.usageLog.length})
              </Label>
              <div className="max-h-24 space-y-1 overflow-y-auto pr-1 text-xs">
                {certificate.details.usageLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-zinc-100/60 p-2 dark:bg-zinc-900"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        Процедура #{log.sessionNumber}
                      </span>
                      {log.note && (
                        <p className="line-clamp-1 text-[10px] text-zinc-400">
                          {log.note}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {new Date(log.date).toLocaleDateString("bg-BG")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Note input */}
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Бележка към процедурата (по избор)
          </Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="напр. 30 мин Normatec крака + сауна..."
            rows={2}
            className="rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
            disabled={isFullyUsed}
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
          >
            Затвори
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={isSubmitting || isFullyUsed}
            className="rounded-2xl bg-amber-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Отчитане...
              </>
            ) : isFullyUsed ? (
              "Напълно изразходен"
            ) : (
              `Отчети процедура #${used + 1}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
