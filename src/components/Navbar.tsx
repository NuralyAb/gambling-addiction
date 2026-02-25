"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Button from "./ui/Button";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { data: session } = useSession();
  const t = useTranslations("common");

  return (
    <nav className="border-b border-white/10 bg-dark/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0 shadow-glow-sm">
            <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-display font-semibold text-base sm:text-lg text-white truncate">{t("appName")}</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="!px-2 sm:!px-3">{t("dashboard")}</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="!px-2 sm:!px-3">{t("profile")}</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                {t("logout")}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">{t("login")}</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">{t("startFree")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
