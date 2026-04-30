import type { Metadata } from "next";
import { Montserrat, PT_Sans } from "next/font/google"; // Import the correct fonts
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Font configuration based on docs/blueprint.md
const fontSans = PT_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-sans", // Use for body text
});

const fontHeading = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-heading", // Use for headings
});

export const metadata: Metadata = {
  title: "Badminton Club Admin",
  description: "Administrative application for a badminton club",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Badminton Admin",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
