import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster));

const OfflineStatusIndicator = dynamic(() =>
  import("@/components/shared/OfflineStatusIndicator").then(
    (mod) => mod.OfflineStatusIndicator
  )
);

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  adjustFontFallback: true,
});
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { LanguageProvider } from "@/context/language-context";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://bkgalabovo2025.vercel.app"
  ),
  title: "BK Galabovo & Recovery Zone",
  description:
    "Официална спортна платформа и система за управление на Бадминтон клуб Гълъбово и Recovery Zone",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon-48.webp",
    apple: "/icons/favicon-48.webp",
    shortcut: "/icons/favicon-48.webp",
  },
  openGraph: {
    title: "Бадминтон Клуб Гълъбово & Recovery Zone",
    description:
      "Официална спортна платформа, графици, тренировки и управление на Бадминтон клуб Гълъбово и Recovery Zone",
    url: "https://bkgalabovo2025.vercel.app",
    siteName: "Бадминтон Клуб Гълъбово & Recovery Zone",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Бадминтон Клуб Гълъбово & Recovery Zone",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Бадминтон Клуб Гълъбово & Recovery Zone",
    description:
      "Официална спортна платформа, графици и събития на Бадминтон клуб Гълъбово",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BK Galabovo",
  },
};

export const viewport = {
  themeColor: "#0ea5e9", // Sky-500 matching the brand
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.className} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              {children}
              <OfflineStatusIndicator />
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </LanguageProvider>
          {process.env.NODE_ENV === "production" && process.env.VERCEL && (
            <Analytics />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
