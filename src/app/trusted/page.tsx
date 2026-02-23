"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface UserInfo {
  id: string;
  name: string;
  tg_username: string;
  risk_score: number;
  created_at: string;
}

interface UnlockRequest {
  id: string;
  user_id: string;
  userName: string;
  userTg: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  created_at: string;
  reviewed_at: string | null;
}

interface WeeklyReport {
  id: string;
  user_id: string;
  userName: string;
  userTg: string;
  week_start: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  total_sessions: number;
  total_amount: number;
  total_time_minutes: number;
  night_sessions: number;
  disable_attempts: number;
  analysis_summary: string;
  sent_at: string;
}

type Tab = "overview" | "requests" | "reports";

function riskBadge(level: string, score: number) {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold";
  if (level === "HIGH" || score >= 61)
    return (
      <span className={`${base} bg-red-500/20 text-red-400`}>
        🔴 Высокий {score}
      </span>
    );
  if (level === "MEDIUM" || score >= 31)
    return (
      <span className={`${base} bg-yellow-500/20 text-yellow-400`}>
        🟡 Средний {score}
      </span>
    );
  return (
    <span className={`${base} bg-green-500/20 text-green-400`}>
      🟢 Низкий {score}
    </span>
  );
}

function statusBadge(status: string) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
  if (status === "approved")
    return <span className={`${base} bg-green-500/15 text-green-400`}>Одобрен</span>;
  if (status === "rejected")
    return <span className={`${base} bg-red-500/15 text-red-400`}>Отклонён</span>;
  return <span className={`${base} bg-yellow-500/15 text-yellow-400`}>Ожидает</span>;
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}м`;
  return `${h}ч ${m}м`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  return `${days}д назад`;
}

const AUTO_REFRESH_MS = 30_000;

export default function TrustedDashboardPage() {
  const [tgInput, setTgInput] = useState("");
  const [tg, setTg] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (username: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/trusted?tg=${encodeURIComponent(username)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка загрузки");
        return;
      }
      setUsers(data.users || []);
      setUnlockRequests(data.unlockRequests || []);
      setWeeklyReports(data.weeklyReports || []);
      setLastRefresh(new Date());
    } catch {
      if (!silent) setError("Ошибка соединения");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("trusted_tg");
    if (saved) {
      setTgInput(saved);
      setTg(saved);
      load(saved);
    }
  }, [load]);

  useEffect(() => {
    if (!tg) return;
    refreshTimer.current = setInterval(() => load(tg, true), AUTO_REFRESH_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [tg, load]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tgInput.replace(/^@/, "").trim();
    if (!clean) return;
    localStorage.setItem("trusted_tg", clean);
    setTg(clean);
    load(clean);
  };

  const handleLogout = () => {
    localStorage.removeItem("trusted_tg");
    setTg("");
    setTgInput("");
    setUsers([]);
    setUnlockRequests([]);
    setWeeklyReports([]);
    setActiveTab("overview");
    setSelectedUserId(null);
  };

  const handleUnlockAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoading(requestId + action);
    try {
      const res = await fetch(`/api/trusted/unlock/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, tg }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ошибка");
        return;
      }
      await load(tg);
    } catch {
      alert("Ошибка соединения");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = unlockRequests.filter((r) => r.status === "pending");

  const filteredRequests = selectedUserId
    ? unlockRequests.filter((r) => r.user_id === selectedUserId)
    : unlockRequests;
  const filteredReports = selectedUserId
    ? weeklyReports.filter((r) => r.user_id === selectedUserId)
    : weeklyReports;
  const filteredPending = filteredRequests.filter(
    (r) => r.status === "pending"
  );
  const filteredResolved = filteredRequests.filter(
    (r) => r.status !== "pending"
  );

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Обзор" },
    {
      key: "requests",
      label: "Запросы",
      badge: pendingRequests.length || undefined,
    },
    { key: "reports", label: "Отчёты" },
  ];

  return (
    <div className="min-h-screen bg-dark text-slate-200">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-white text-sm">SafeBet AI</span>
            </Link>
            <span className="text-slate-600 text-sm hidden sm:inline">/ Доверенное лицо</span>
          </div>
          {tg && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                @{tg}
              </span>
              {lastRefresh && (
                <span className="text-[10px] text-slate-600 hidden md:inline">
                  обновлено {timeAgo(lastRefresh.toISOString())}
                </span>
              )}
              <button
                onClick={() => load(tg)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-dark-lighter transition-colors"
                title="Обновить"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Login screen */}
        {!tg && (
          <div className="max-w-md mx-auto pt-12 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Дашборд доверенного лица
              </h1>
              <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
                Мониторинг и контроль для поддержки близкого человека в борьбе с
                игровой зависимостью
              </p>
            </div>
            <Card>
              <p className="text-sm text-slate-400 mb-4">
                Введите ваш Telegram username, который пользователь указал в
                своём профиле. Убедитесь, что вы написали боту{" "}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-accent text-xs">
                  /start
                </code>
              </p>
              <form onSubmit={handleConnect} className="flex gap-3">
                <input
                  type="text"
                  placeholder="@username"
                  value={tgInput}
                  onChange={(e) => setTgInput(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                  autoFocus
                />
                <Button type="submit">Войти</Button>
              </form>
            </Card>
            <div className="text-center">
              <Link
                href="/login"
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                Вы пользователь? Войдите в аккаунт
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && tg && users.length === 0 && !error && (
          <Card className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">
              Нет подключённых пользователей.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Убедитесь, что пользователь указал{" "}
              <span className="text-white">@{tg}</span> в своём профиле и
              написал боту /start в Telegram.
            </p>
          </Card>
        )}

        {/* Dashboard content */}
        {!loading && tg && users.length > 0 && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-dark-border -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-accent"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {tab.badge}
                    </span>
                  ) : null}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
                  )}
                </button>
              ))}

              {/* User filter */}
              {users.length > 1 && (
                <div className="ml-auto">
                  <select
                    value={selectedUserId || ""}
                    onChange={(e) =>
                      setSelectedUserId(e.target.value || null)
                    }
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-accent"
                  >
                    <option value="">Все пользователи</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || `@${u.tg_username}` || u.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Подопечных</p>
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{pendingRequests.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Ожидает ответа</p>
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{weeklyReports.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Отчётов</p>
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {users.length > 0
                        ? Math.round(
                            users.reduce((s, u) => s + (u.risk_score || 0), 0) /
                              users.length
                          )
                        : 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Средний риск</p>
                  </div>
                </div>

                {/* Connected users */}
                <Card>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Подопечные
                  </h2>
                  <div className="space-y-2">
                    {users.map((u) => {
                      const userPending = pendingRequests.filter(
                        (r) => r.user_id === u.id
                      );
                      const latestReport = weeklyReports.find(
                        (r) => r.user_id === u.id
                      );
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(
                              selectedUserId === u.id ? null : u.id
                            );
                          }}
                          className={`w-full text-left p-4 rounded-lg transition-colors ${
                            selectedUserId === u.id
                              ? "bg-accent/10 border border-accent/30"
                              : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium truncate">
                                  {u.name || `@${u.tg_username}` || "—"}
                                </p>
                                {userPending.length > 0 && (
                                  <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                                    {userPending.length}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {u.tg_username && (
                                  <span className="text-xs text-slate-500">
                                    @{u.tg_username}
                                  </span>
                                )}
                                {latestReport && (
                                  <span className="text-[10px] text-slate-600">
                                    последний отчёт:{" "}
                                    {timeAgo(latestReport.sent_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {riskBadge("", u.risk_score || 0)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Pending unlock requests (quick view) */}
                {pendingRequests.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Запросы на разблокировку
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                          {pendingRequests.length}
                        </span>
                      </h2>
                      <button
                        onClick={() => setActiveTab("requests")}
                        className="text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        Все запросы →
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Без вашего подтверждения блокировка не снимается
                      (dual-control)
                    </p>
                    <div className="space-y-3">
                      {pendingRequests.map((r) => (
                        <UnlockRequestCard
                          key={r.id}
                          request={r}
                          actionLoading={actionLoading}
                          onAction={handleUnlockAction}
                        />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Latest report preview */}
                {weeklyReports.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Последний отчёт
                      </h2>
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        Все отчёты →
                      </button>
                    </div>
                    <ReportCard report={weeklyReports[0]} />
                  </Card>
                )}

                {/* Instructions */}
                <Card>
                  <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Как это работает
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-300 mb-1">📊 Еженедельные отчёты</p>
                      <p className="text-[11px] text-slate-500">Вы получаете анализ активности с риск-скором. Отчёты приходят в Telegram и отображаются здесь.</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-300 mb-1">🔐 Dual-control блокировка</p>
                      <p className="text-[11px] text-slate-500">Пользователь не может снять блокировку самостоятельно. Требуется ваше одобрение.</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-300 mb-1">🤖 Telegram бот</p>
                      <p className="text-[11px] text-slate-500">Запросы и отчёты также приходят в Telegram с интерактивными кнопками.</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-300 mb-1">🔄 Автообновление</p>
                      <p className="text-[11px] text-slate-500">Данные обновляются автоматически каждые 30 секунд. Или нажмите кнопку обновления.</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ====== REQUESTS TAB ====== */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                {selectedUser && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    Фильтр:{" "}
                    <span className="text-white font-medium">
                      {selectedUser.name || `@${selectedUser.tg_username}`}
                    </span>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 ml-1"
                    >
                      ✕ Сбросить
                    </button>
                  </div>
                )}

                {filteredPending.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      Ожидают ответа ({filteredPending.length})
                    </h3>
                    <div className="space-y-3">
                      {filteredPending.map((r) => (
                        <UnlockRequestCard
                          key={r.id}
                          request={r}
                          actionLoading={actionLoading}
                          onAction={handleUnlockAction}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredPending.length === 0 && (
                  <Card className="text-center py-6">
                    <p className="text-slate-400 text-sm">
                      Нет ожидающих запросов
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Все запросы обработаны
                    </p>
                  </Card>
                )}

                {filteredResolved.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">
                      История ({filteredResolved.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredResolved.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-slate-800/30 border border-dark-border rounded-lg"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-slate-300 text-sm font-medium truncate">
                                  {r.userName}
                                  {r.userTg ? ` (@${r.userTg})` : ""}
                                </p>
                                {statusBadge(r.status)}
                              </div>
                              {r.reason && (
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {r.reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-slate-600">
                                {new Date(r.created_at).toLocaleDateString(
                                  "ru-RU",
                                  { day: "numeric", month: "short" }
                                )}
                              </p>
                              {r.reviewed_at && (
                                <p className="text-[10px] text-slate-600">
                                  ответ:{" "}
                                  {new Date(r.reviewed_at).toLocaleDateString(
                                    "ru-RU",
                                    { day: "numeric", month: "short" }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ====== REPORTS TAB ====== */}
            {activeTab === "reports" && (
              <div className="space-y-4">
                {selectedUser && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    Фильтр:{" "}
                    <span className="text-white font-medium">
                      {selectedUser.name || `@${selectedUser.tg_username}`}
                    </span>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 ml-1"
                    >
                      ✕ Сбросить
                    </button>
                  </div>
                )}

                {filteredReports.length === 0 && (
                  <Card className="text-center py-6">
                    <p className="text-slate-400 text-sm">
                      Нет еженедельных отчётов
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Отчёты появятся после первой недели мониторинга
                    </p>
                  </Card>
                )}

                {filteredReports.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UnlockRequestCard({
  request: r,
  actionLoading,
  onAction,
}: {
  request: UnlockRequest;
  actionLoading: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">
            {r.userName}
            {r.userTg ? ` (@${r.userTg})` : ""}
          </p>
          {r.reason && (
            <p className="text-sm text-slate-400 mt-1">
              Причина: <em className="text-slate-300">{r.reason}</em>
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1.5">
            {new Date(r.created_at).toLocaleString("ru-RU")} ·{" "}
            {timeAgo(r.created_at)}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="text-green-400 border-green-500/30 hover:bg-green-500/10"
            loading={actionLoading === r.id + "approve"}
            onClick={() => onAction(r.id, "approve")}
          >
            ✓ Одобрить
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            loading={actionLoading === r.id + "reject"}
            onClick={() => onAction(r.id, "reject")}
          >
            ✕ Отклонить
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report: r }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-sm truncate">
              {r.userName}
              {r.userTg ? ` (@${r.userTg})` : ""}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Неделя:{" "}
              {new Date(r.week_start).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })}
              {r.sent_at && (
                <span className="ml-2 text-slate-600">
                  · отправлен {timeAgo(r.sent_at)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {riskBadge(r.risk_level, r.risk_score)}
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-dark-border pt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatBlock label="Сессий" value={r.total_sessions} />
            <StatBlock
              label="Сумма"
              value={`$${r.total_amount?.toFixed(0) || 0}`}
              alert={r.total_amount > 200}
            />
            <StatBlock
              label="Время"
              value={formatMinutes(r.total_time_minutes || 0)}
            />
            <StatBlock
              label="Ночных"
              value={r.night_sessions}
              alert={r.night_sessions > 2}
            />
          </div>
          {r.disable_attempts > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg text-xs text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Попыток отключить систему: {r.disable_attempts}
            </div>
          )}
          {r.analysis_summary && (
            <p className="text-xs text-slate-400 italic leading-relaxed">
              {r.analysis_summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  alert,
}: {
  label: string;
  value: string | number;
  alert?: boolean;
}) {
  return (
    <div
      className={`text-center p-2.5 rounded-lg ${
        alert
          ? "bg-red-500/10 border border-red-500/20"
          : "bg-slate-700/40"
      }`}
    >
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-lg font-semibold mt-0.5 ${
          alert ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
