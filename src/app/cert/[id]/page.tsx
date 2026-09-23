import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCertificateByIdAction } from "@/lib/actions/certificate-issuance-server";

import { PublicCertificateClient } from "./PublicCertificateClient";

interface CertificatePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CertificatePageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getCertificateByIdAction(id);

  if (!res.success || !res.data) {
    return {
      title: "Официален сертификат | БК Гълъбово",
      description:
        "Дигитална проверка на клубен сертификат, грамота или ваучер.",
    };
  }

  const cert = res.data;
  return {
    title: `${cert.visualSnapshot.templateTitle} - ${cert.recipient.name} | БК Гълъбово`,
    description: `Официален клубен документ № ${cert.serialNumber} на ${cert.recipient.name} от Бадминтон Клуб Гълъбово.`,
    openGraph: {
      title: `${cert.visualSnapshot.templateTitle} - ${cert.recipient.name}`,
      description: `Официално отличие № ${cert.serialNumber} от БК Гълъбово.`,
      images: [
        {
          url: "/icons/badge-option-3-light-squircle.png",
          width: 512,
          height: 512,
          alt: "Бадминтон Клуб Гълъбово",
        },
      ],
    },
  };
}

export default async function CertificateDetailPage({
  params,
}: CertificatePageProps) {
  const { id } = await params;
  const res = await getCertificateByIdAction(id);

  if (!res.success || !res.data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
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
      </div>
    );
  }

  return <PublicCertificateClient certificate={res.data} />;
}
