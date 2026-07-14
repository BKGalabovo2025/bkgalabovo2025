"use client";

import React, { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { SignedDeclaration } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { fillDeclarationPdf } from "@/lib/pdf-generator";

export default function PrintDeclarationClient({ declarationId }: { declarationId: string }) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docSnap = await getDoc(doc(getDb(), "member_declarations", declarationId));
        if (docSnap.exists()) {
          const data = docSnap.data() as SignedDeclaration;
          const url = await fillDeclarationPdf({
            name: data.memberName,
            phone: data.phone,
            date: new Date(data.signedAt).toLocaleDateString("bg-BG"),
            signatureUrl: data.signatureUrl,
            parentSignatureUrl: data.parentSignatureUrl
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
    return <div className="p-8 text-center text-red-500">Декларацията не е намерена или е възникнала грешка при генерирането.</div>;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 shrink-0">
        <Button variant="ghost" onClick={() => {
          if (window.opener || window.history.length <= 1) {
            window.close();
          } else {
            router.back();
          }
        }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад / Затвори
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.open(pdfUrl, '_blank')} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Отпечатай / Отвори
          </Button>
          <Button onClick={() => {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `Декларация_${declarationId}.pdf`;
            a.click();
          }}>
            <Download className="w-4 h-4 mr-2" />
            Изтегли PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
        <iframe src={pdfUrl} className="absolute inset-0 w-full h-full border-none" title="Декларация" />
      </div>
    </div>
  );
}
