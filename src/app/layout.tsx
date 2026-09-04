import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import { OfflineStatusIndicator } from "@/components/shared/OfflineStatusIndicator";
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
    icon: "/icons/LOGO.jpg",
    apple: "/icons/LOGO.jpg",
    shortcut: "/icons/LOGO.jpg",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
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
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
