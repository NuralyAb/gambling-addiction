"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordMinLength"));
      return;
    }

    const tg = (tgUsername || "").replace(/^@/, "").trim();
    if (!tg) {
      setError(t("tgRequired"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tg_username: tg }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setWarning(data.warning || "");
      setSuccess(true);
    } catch {
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t("checkEmail")}</h2>
          <p className="text-slate-400 mb-6">
            {t("emailSentTo")} <strong className="text-slate-200">{email}</strong>. {t("checkSpam")}
          </p>
          {warning && (
            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm text-left">
              {warning}
            </div>
          )}
          <Link href="/login">
            <Button variant="secondary" className="w-full">{t("goToLogin")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{t("registerTitle")}</h1>
          <p className="text-slate-400 text-sm">
            {t("registerSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label={t("email")}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label={t("password")}
            type="password"
            placeholder={t("passwordPlaceholderMin")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
            <Input
              id="confirmPassword"
              label={t("confirmPassword")}
              type="password"
              placeholder={t("repeatPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Input
              id="tgUsername"
              label={t("telegramUsername")}
              type="text"
              placeholder="@username"
              value={tgUsername}
              onChange={(e) => setTgUsername(e.target.value)}
              required
            />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {t("signUp")}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
