import type { Metadata } from "next";
import Link from "next/link";
import { getSiteById } from "@/services/site-service";
export const revalidate = 300; // ISR: Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "Recovery Zone by ZM | Професионално Възстановяване",
  description:
    "Възстановете се по-бързо с най-съвременната технология Hyperice Normatec 3. Професионално решение за спортисти и активни хора.",
  openGraph: {
    title: "Recovery Zone by ZM | Професионално Възстановяване",
    description:
      "Възстановете се по-бързо с най-съвременната технология Hyperice Normatec 3.",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone",
    siteName: "Recovery Zone",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/1.png",
        width: 800,
        height: 800,
        alt: "Recovery Zone Logo",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recovery Zone by ZM",
    description: "Професионално решение за спортисти и активни хора.",
    images: ["https://bkgalabovo2025.vercel.app/1.png"],
  },
};

import fs from "fs";
import path from "path";
import RecoveryZoneClient from "./RecoveryZoneClient";

export default async function RecoveryZonePage() {
  const site = await getSiteById("recoveryzone");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: site?.name || "Recovery Zone by ZM",
    image: "https://bkgalabovo2025.vercel.app/1.png",
    "@id": "https://bkgalabovo2025.vercel.app/recovery-zone",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone",
    telephone: site?.phone || "+359899388338",
    address: {
      "@type": "PostalAddress",
      streetAddress: site?.address || "Спортна зала „Енергетик“",
      addressLocality: "Гълъбово",
      postalCode: "6280",
      addressCountry: "BG",
    },
  };

  // Read images from public/recovery-zone
  let hallImages: string[] = [];
  try {
    const dirPath = path.join(process.cwd(), "public", "recovery-zone");
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      hallImages = files
        .filter((f: string) => f.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map((f: string) => `/recovery-zone/${f}`);
    }
  } catch (error) {
    console.error("Failed to read recovery-zone images:", error);
  }

  if (hallImages.length === 0) {
    // Fallback if folder is empty or doesn't exist
    hallImages = ["/1.png", "/1.png"];
  }

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Обектът не е намерен</h1>
          <Link href="/" className="text-emerald-500 hover:underline">
            Обратно към началната страница
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecoveryZoneClient site={site} hallImages={hallImages} />
    </>
  );
}
