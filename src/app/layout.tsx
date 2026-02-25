import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "NoBet — Помощь в борьбе с игровой зависимостью",
  description:
    "Бесплатная платформа для людей, борющихся с игровой зависимостью. Анализ поведения, персональные рекомендации, поддержка 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-dark text-slate-200 min-h-screen flex flex-col overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
