import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import "../globals.css";
import { LanguageCode } from '@/lib/i18n';

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
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('mark6-language');

  // Use cookie language if available, otherwise use URL param
  const htmlLang = languageCookie?.value === 'zh-TW' ? 'zh-TW' : (await params).lang;
  console.log("htmlLang", htmlLang);
  return (
    <html lang={htmlLang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}