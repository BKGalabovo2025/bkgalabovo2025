import { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { DocumentSignerClient } from "@/components/documents/DocumentSignerClient";
import { getPublicDocumentRequestAction } from "@/lib/actions/document-requests";

export const dynamic = "force-dynamic";

interface SignPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: SignPageProps): Promise<Metadata> {
  const { token } = await params;
  const res = await getPublicDocumentRequestAction(token);

  if (!res.success || !res.data) {
    return {
      title: "Подписване на документ | БК Гълъбово",
      description: "Система за онлайн подписване на клубни документи",
    };
  }

  return {
    title: `${res.data.documentTitle} — ${res.data.memberName} | БК Гълъбово`,
    description: `Онлайн подписване на ${res.data.documentTitle} за ${res.data.memberName} в СНЦ „Бадминтон клуб Гълъбово”`,
  };
}

export default async function SignDocumentPage({ params }: SignPageProps) {
  const { token } = await params;
  const res = await getPublicDocumentRequestAction(token);

  if (!res.success || !res.data) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-zinc-50 p-4"
      >
        <div className="max-w-md w-full rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 font-bold text-xl">
            !
          </div>
          <h1 className="text-lg font-bold text-zinc-900">
            Документът не е намерен
          </h1>
          <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
            {res.error ||
              "Линкът за подписване е невалиден, изтекъл или премахнат от администратор."}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              Към началната страница
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <DocumentSignerClient initialData={res.data} />;
}
