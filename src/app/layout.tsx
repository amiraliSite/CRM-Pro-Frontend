import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/crm/theme-provider";

export const metadata: Metadata = {
  title: "CRM Pro | سامانه مدیریت ارتباط با مشتریان",
  description:
    "سیستم CRM حرفه‌ای و فول‌آپشن برای مدیریت مشتریان، معاملات، وظایف و گزارش‌های فروش",
  icons: {
    icon: "/logo.svg",
  },
  other: {
    // Prevent browser auto-translation (Google Translate) from mutating the DOM
    // and crashing React (insertBefore NotFoundError)
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      translate="no"
      className="notranslate"
      suppressHydrationWarning
    >
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
