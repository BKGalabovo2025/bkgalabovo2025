import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCertificateByIdAction } from "@/lib/actions/certificate-issuance-server";

import { PublicCertificateClient } from "./PublicCertificateClient";

interface CertificatePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Официален сертификат | БК Гълъбово",
  description:
    "Дигитална проверка на клубен сертификат, грамота или ваучер от Бадминтон Клуб Гълъбово.",
};

export default async function CertificateDetailPage({
  params,
}: CertificatePageProps) {
  const { id } = await params;
  const res = await getCertificateByIdAction(id);

  if (!res.success || !res.data) {
    return (
      <main
        id="main-content"
        className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center"
      >
        <div className="max-w-md space-y-4 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/60">
            🔍
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">
            Документът не е намерен
          </h2>
          <p className="text-xs leading-relaxed text-zinc-500">
            Възможно е документът да е премахнат или серийният номер в адреса да
            е невалиден.
          </p>
          <Button
            asChild
            className="rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Link href="/">Към началната страница</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <PublicCertificateClient certificate={res.data} />;
}
