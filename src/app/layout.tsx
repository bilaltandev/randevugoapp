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
  title: "RandevuGo | Yeni Nesil Rezervasyon & İşletme Yönetim SaaS Platformu",
  description:
    "Küçük ve orta ölçekli işletmeler için online randevu, müşteri ilişkileri, sayfa tasarlayıcı ve işletme yönetim platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#080c10] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300" suppressHydrationWarning>{children}</body>
    </html>
  );
}
