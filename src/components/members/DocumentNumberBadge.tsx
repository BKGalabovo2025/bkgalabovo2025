"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth-context";
import {
  getIssuedDocumentNumberAction,
  issueDocumentNumberAction,
} from "@/lib/actions/document-numbers";
import {
  DocumentNumberKey,
  DocumentNumberRecord,
  formatIssuedAt,
} from "@/types/document-number.types";

/**
 * Issues (once per page open) a unique document number for the member document
 * being printed. The number id is kept in the URL (?docNo=) so reloading the
 * same printout shows the same number instead of consuming a new one.
 */
export function useDocumentNumber(documentKey: DocumentNumberKey) {
  const params = useParams();
  const memberId = params.id as string;
  const { user } = useAuth();
  const [record, setRecord] = useState<DocumentNumberRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!user || !memberId || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const idToken = await user.getIdToken();
        const url = new URL(window.location.href);
        const existingId = url.searchParams.get("docNo");

        if (existingId) {
          const existing = await getIssuedDocumentNumberAction({
            id: existingId,
            memberId,
            documentKey,
            idToken,
          });
          if (existing.success && existing.data) {
            setRecord(existing.data);
            return;
          }
        }

        const issued = await issueDocumentNumberAction({
          memberId,
          documentKey,
          idToken,
        });
        if (issued.success && issued.data) {
          setRecord(issued.data);
          url.searchParams.set("docNo", issued.data.id);
          window.history.replaceState(null, "", url.toString());
        } else {
          setError(issued.error || "Неуспешно издаване на номер.");
        }
      } catch (err) {
        console.error("Document number error:", err);
        setError("Неуспешно издаване на номер.");
      }
    })();
  }, [user, memberId, documentKey]);

  return { record, error };
}

interface DocumentNumberBadgeProps {
  documentKey: DocumentNumberKey;
}

/**
 * Number stamp in the top-right corner of a printable document.
 * Must be placed inside the `.print-area` element (which is `relative`).
 */
export function DocumentNumberBadge({ documentKey }: DocumentNumberBadgeProps) {
  const { record, error } = useDocumentNumber(documentKey);

  return (
    <div
      className="absolute top-[6mm] right-[8mm] text-[9pt] text-right font-sans leading-tight text-slate-700"
      data-testid="document-number-badge"
    >
      {record ? (
        <>
          <div className="font-bold tracking-wide">№ {record.number}</div>
          <div className="text-[8pt] text-slate-500">
            {formatIssuedAt(record.issuedAt)}
          </div>
        </>
      ) : error ? (
        <div className="text-[8pt] text-rose-600 print:hidden">{error}</div>
      ) : (
        <div className="text-[8pt] text-slate-400 print:hidden">
          Издаване на номер...
        </div>
      )}
    </div>
  );
}
