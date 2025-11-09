import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  params: {
    lang: LanguageCode;
  };
}

export default function RootLayout({
  children,
  params,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang={params.lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}