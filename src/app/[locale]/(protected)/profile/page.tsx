"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface ProfileData {
  email: string;
  name: string;
  city: string;
  phone: string;
  trusted_person_name: string;
  trusted_person_email: string;
  trusted_person_tg: string;
  trusted_person_chat_id: number | null;
  tg_username: string;
  risk_score: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [trustedName, setTrustedName] = useState("");
  const [trustedEmail, setTrustedEmail] = useState("");
  const [trustedTg, setTrustedTg] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProfile = () => {
    fetch("/api/profile")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ошибка загрузки профиля");
          setProfile(null);
          return;
        }
        setProfile(data);
        setName(data.name || "");
        setCity(data.city || "");
        setPhone(data.phone || "");
        setTrustedName(data.trusted_person_name || "");
        setTrustedEmail(data.trusted_person_email || "");
        setTrustedTg(data.trusted_person_tg || "");
        setTgUsername(data.tg_username || "");
      })
      .catch(() => {
        setError("Ошибка загрузки профиля");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const pollBot = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/poll", { method: "POST" });
      const data = await res.json();
      if (data.processed > 0) loadProfile();
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (autoPoll) {
      pollBot();
      pollRef.current = setInterval(pollBot, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [autoPoll, pollBot]);

  const showMsg = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const showErr = (text: string) => {
    setError(text);
    setTimeout(() => setError(""), 5000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          phone,
          trusted_person_name: trustedName,
          trusted_person_email: trustedEmail,
          trusted_person_tg: trustedTg.replace(/^@/, "") || undefined,
          tg_username: tgUsername.replace(/^@/, "") || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showErr(data.error);
        return;
      }

      loadProfile();

      if (data.trustedTgChanged) {
        showMsg("Профиль сохранён. Попросите доверенное лицо написать /start боту в Telegram.");
      } else if (data.hasTrustedChatId) {
        showMsg("Профиль сохранён. Тестовое сообщение отправлено доверенному лицу.");
      } else {
        showMsg("Профиль сохранён");
      }
    } catch {
      showErr("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncBot = async () => {
    setSyncLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/telegram/poll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showErr(data.error);
        return;
      }
      loadProfile();
      showMsg(data.message || "Синхронизация завершена");
    } catch {
      showErr("Ошибка синхронизации");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showErr(data.error);
        return;
      }
      showMsg("Тестовое сообщение отправлено в Telegram");
    } catch {
      showErr("Ошибка отправки");
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendReport = async () => {
    setReportLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/reports/weekly", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showErr(data.error);
        return;
      }
      showMsg(`Отчёт отправлен. Риск-скор: ${data.riskScore}/100 (${data.riskLevel})`);
    } catch {
      showErr("Ошибка отправки отчёта");
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nobet-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("Данные экспортированы");
    } catch {
      showErr("Ошибка экспорта данных");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!res.ok) {
        const data = await res.json();
        showErr(data.error || "Ошибка удаления");
        return;
      }
      window.location.href = "/login";
    } catch {
      showErr("Ошибка удаления аккаунта");
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasTrustedBot = !!(profile?.trusted_person_tg && profile?.trusted_person_chat_id);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Профиль</h1>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Не удалось загрузить профиль"}
        </div>
        <Button onClick={loadProfile}>Попробовать снова</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Профиль</h1>
        <p className="text-slate-400 mt-1">
          Управляйте вашими данными и настройками
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Личная информация</h2>
          <div className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="opacity-60"
            />
            <Input
              id="name"
              label="Имя"
              type="text"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id="city"
              label="Город"
              type="text"
              placeholder="Ваш город"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              id="tgUsername"
              label="Ваш Telegram username"
              type="text"
              placeholder="@username"
              value={tgUsername}
              onChange={(e) => setTgUsername(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-2">Доверенное лицо</h2>
          <p className="text-sm text-slate-500 mb-4">
            Этот человек получит уведомление, если AI обнаружит высокий уровень риска.
            Это может быть близкий друг, родственник или психолог.
          </p>
          <div className="space-y-4">
            <Input
              id="trustedName"
              label="Имя доверенного лица"
              type="text"
              placeholder="Имя человека"
              value={trustedName}
              onChange={(e) => setTrustedName(e.target.value)}
            />
            <Input
              id="trustedEmail"
              label="Email доверенного лица"
              type="email"
              placeholder="email@example.com"
              value={trustedEmail}
              onChange={(e) => setTrustedEmail(e.target.value)}
            />
            <Input
              id="trustedTg"
              label="Telegram username доверенного лица"
              type="text"
              placeholder="@username"
              value={trustedTg}
              onChange={(e) => setTrustedTg(e.target.value)}
            />

            {/* Connection status */}
            {profile?.trusted_person_tg && (
              <div className={`flex items-center justify-between gap-2 p-3 rounded-lg text-sm ${
                hasTrustedBot
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasTrustedBot ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
                  {hasTrustedBot
                    ? `Бот подключён к @${profile.trusted_person_tg}`
                    : `@${profile.trusted_person_tg} ещё не написал /start боту`}
                </div>
                {!hasTrustedBot && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={syncLoading}
                    onClick={handleSyncBot}
                    className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
                  >
                    Проверить
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 -mt-2">
              Доверенное лицо будет получать еженедельные отчёты и сможет одобрять/отклонять запросы на снятие блокировки через Telegram бот.
            </p>
            <Input
              id="phone"
              label="Телефон доверенного лица"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </Card>

        {/* Telegram actions */}
        {profile?.trusted_person_tg && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-2">Telegram</h2>
            <p className="text-sm text-slate-500 mb-4">
              Отправьте тестовое сообщение или еженедельный отчёт доверенному лицу.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="secondary"
                loading={testLoading}
                disabled={!hasTrustedBot}
                onClick={handleTestConnection}
                className="flex-1"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  Тест связи
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={reportLoading}
                disabled={!hasTrustedBot}
                onClick={handleSendReport}
                className="flex-1"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Отправить отчёт
                </span>
              </Button>
            </div>
            {!hasTrustedBot && profile.trusted_person_tg && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-500">
                  Кнопки станут активны после того, как @{profile.trusted_person_tg} напишет /start боту.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={syncLoading}
                  onClick={handleSyncBot}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Проверить подключение бота
                  </span>
                </Button>
              </div>
            )}

            {/* Auto-poll toggle for dev (localhost) */}
            <div className="mt-4 pt-4 border-t border-dark-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Авто-синхронизация бота</p>
                  <p className="text-xs text-slate-500">
                    {autoPoll
                      ? "Бот отвечает на команды в реальном времени"
                      : "Включите, чтобы бот реагировал на /settings, /status и другие команды"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPoll(!autoPoll)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    autoPoll ? "bg-accent" : "bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    autoPoll ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
              {autoPoll && (
                <div className="mt-2 flex items-center gap-2 text-xs text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Polling активен — бот отвечает на команды
                </div>
              )}
            </div>
          </Card>
        )}

        {message && (
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={saving}>
          Сохранить изменения
        </Button>
      </form>

      {/* Data & Privacy */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-2">Данные и конфиденциальность</h2>
        <p className="text-sm text-slate-500 mb-4">
          Управление вашими данными в соответствии с GDPR
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-lighter border border-dark-border hover:border-accent/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Экспорт данных</p>
                <p className="text-xs text-slate-500">Скачать все ваши данные в JSON</p>
              </div>
            </div>
            {exportLoading ? (
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>

          <a
            href="/privacy"
            className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-lighter border border-dark-border hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Политика конфиденциальности</p>
                <p className="text-xs text-slate-500">Как мы храним и обрабатываем ваши данные</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="!border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Опасная зона</h2>
        <p className="text-sm text-slate-500 mb-4">
          Удаление аккаунта необратимо. Все данные будут удалены навсегда.
        </p>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
            className="!border-red-500/30 !text-red-400 hover:!bg-red-500/10"
          >
            Удалить аккаунт
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 font-medium">
              Вы уверены? Введите DELETE для подтверждения:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-dark border border-red-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="button"
                loading={deleteLoading}
                disabled={deleteConfirmText !== "DELETE"}
                onClick={handleDeleteAccount}
                className="flex-1 !bg-red-500 hover:!bg-red-600 disabled:!bg-red-500/30"
              >
                Удалить навсегда
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
