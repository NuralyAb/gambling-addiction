"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-dark-border py-6 sm:py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 text-center sm:text-left">
          <p className="max-w-xs">{t("tagline")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/about-ai" className="hover:text-slate-300 transition-colors">{t("aboutAi")}</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t("privacy")}</Link>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          {t("hotline")}{" "}
          <a href="tel:88002000122" className="text-accent hover:underline">
            8-800-2000-122
          </a>{" "}
          {t("hotlineFree")}
        </p>
      </div>
    </footer>
  );
}
