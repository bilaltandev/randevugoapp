import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Heading fonts for the booking-page themes (lib/themes/registry.ts). Browsers only
// download a face when a page actually uses it, so themes that don't pay nothing.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  display: "swap",
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
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cormorant.variable} ${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#080c10] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300" suppressHydrationWarning>{children}</body>
    </html>
  );
}
