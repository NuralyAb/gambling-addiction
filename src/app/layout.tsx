import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SafeBet AI — Помощь в борьбе с игровой зависимостью",
  description:
    "Бесплатная платформа с AI-поддержкой для людей, борющихся с игровой зависимостью. Анализ поведения, персональные рекомендации, поддержка 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-dark text-slate-200 min-h-screen flex flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
