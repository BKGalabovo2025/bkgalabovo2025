"use client";

import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/firebase";
import { fillDeclarationPdf } from "@/lib/pdf-generator";
import { SignedDeclaration } from "@/types";

export default function PrintDeclarationClient({
  declarationId,
}: {
  declarationId: string;
}) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docSnap = await getDoc(
          doc(getDb(), "member_declarations", declarationId)
        );
        if (docSnap.exists()) {
          const data = docSnap.data() as SignedDeclaration;
          const url = await fillDeclarationPdf({
            name: data.memberName,
            phone: data.phone,
            date: new Date(data.signedAt).toLocaleDateString("bg-BG"),
            signatureUrl: data.signatureUrl,
            parentSignatureUrl: data.parentSignatureUrl,
          });
          setPdfUrl(url);
        }
      } catch (error) {
        console.error("Failed to load declaration:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [declarationId]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Зареждане...</div>;
  }

  if (!pdfUrl) {
    return (
      <div className="p-8 text-center text-red-500">
        Декларацията не е намерена или е възникнала грешка при генерирането.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-6">
      <div className="flex shrink-0 items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
        <Button
          variant="ghost"
          onClick={() => {
            if (window.opener || window.history.length <= 1) {
              window.close();
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft className="mr-2 size-4" />
          Назад / Затвори
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(pdfUrl, "_blank")}
            variant="outline"
          >
            <ExternalLink className="mr-2 size-4" />
            Отпечатай / Отвори
          </Button>
          <Button
            onClick={() => {
              const a = document.createElement("a");
              a.href = pdfUrl;
              a.download = `Декларация_${declarationId}.pdf`;
              a.click();
            }}
          >
            <Download className="mr-2 size-4" />
            Изтегли PDF
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        <iframe
          src={pdfUrl}
          className="absolute inset-0 size-full border-none"
          title="Декларация"
        />
      </div>
    </div>
  );
}
