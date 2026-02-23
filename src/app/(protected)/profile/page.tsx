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

  const loadProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setCity(data.city || "");
        setPhone(data.phone || "");
        setTrustedName(data.trusted_person_name || "");
        setTrustedEmail(data.trusted_person_email || "");
        setTrustedTg(data.trusted_person_tg || "");
        setTgUsername(data.tg_username || "");
      })
      .catch(() => setError("Ошибка загрузки профиля"))
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

  const hasTrustedBot = !!(profile?.trusted_person_tg && profile?.trusted_person_chat_id);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
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
                🔔 Тест связи
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={reportLoading}
                disabled={!hasTrustedBot}
                onClick={handleSendReport}
                className="flex-1"
              >
                📊 Отправить отчёт
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
                  🔄 Проверить подключение бота
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
    </div>
  );
}
