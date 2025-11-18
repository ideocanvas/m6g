import { GoogleAdSense } from '@/components/GoogleAdSense';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageCode } from '@/lib/i18n';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mark Six Generator",
  description: "Generate Mark Six lottery combinations with AI assistance",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: LanguageCode;
  }>;
}

export default async function RootLayout({
  children,
  params,
}: Readonly<RootLayoutProps>) {
  // Use cookie language if available, otherwise use URL param
  const htmlLang =  (await params).lang === 'en' ? 'en' : 'zh-TW';
  console.log("htmlLang", htmlLang);
  return (
    <html lang={htmlLang}>
      <head>
        <GoogleAdSense />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}