"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface TokenData {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  revoked: boolean;
  last_used_at: string | null;
}

interface Stats {
  today: number;
  week: number;
  month: number;
  topDomains: { domain: string; count: number }[];
  recent: { id: string; domain: string; blocked_at: string }[];
}

export default function ExtensionPage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [activeToken, setActiveToken] = useState<TokenData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tab, setTab] = useState<"setup" | "stats" | "unlock">("setup");
  const [unlockPauseLeft, setUnlockPauseLeft] = useState(30);
  const [unlockCanSubmit, setUnlockCanSubmit] = useState(false);
  const [whatChanged, setWhatChanged] = useState("");
  const [plan, setPlan] = useState("");
  const [ifLose, setIfLose] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{ status: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tokRes, statsRes] = await Promise.all([
        fetch("/api/extension/token"),
        fetch("/api/extension/stats"),
      ]);
      const tokData = await tokRes.json();
      const statsData = await statsRes.json();
      setTokens(tokData.tokens || []);
      setActiveToken(tokData.active || null);
      setStats(statsData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load unlock requests when on unlock tab
  useEffect(() => {
    if (tab === "unlock") {
      fetch("/api/unlock-request")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          const pending = Array.isArray(data) ? data.find((r: { status: string }) => r.status === "pending") : null;
          setPendingRequest(pending || null);
        })
        .catch(() => {});
    }
  }, [tab]);

  // Reset 30s pause when switching to unlock tab
  useEffect(() => {
    if (tab === "unlock") {
      setUnlockPauseLeft(30);
      setUnlockCanSubmit(false);
    }
  }, [tab]);

  // 30 second forced pause before unlock button
  useEffect(() => {
    if (tab !== "unlock" || unlockCanSubmit) return;
    if (unlockPauseLeft <= 0) {
      setUnlockCanSubmit(true);
      return;
    }
    const t = setInterval(() => setUnlockPauseLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [tab, unlockPauseLeft, unlockCanSubmit]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/extension/token", { method: "POST" });
      if (res.ok) {
        const newToken = await res.json();
        setActiveToken(newToken);
        setShowToken(true);
        await loadData();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeToken) return;
    setRevoking(true);
    try {
      await fetch(`/api/extension/token?id=${activeToken.id}`, { method: "DELETE" });
      setShowToken(false);
      await loadData();
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = () => {
    if (!activeToken) return;
    navigator.clipboard.writeText(activeToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskToken = (t: string) => t.slice(0, 8) + "..." + t.slice(-6);

  const tabs = [
    { id: "setup" as const, label: "Установка" },
    { id: "stats" as const, label: "Статистика" },
    { id: "unlock" as const, label: "Запрос разблокировки" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Chrome Расширение</h1>
        <p className="text-slate-400 mt-1">
          Блокировка азартных сайтов и отслеживание попыток доступа
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.id
                ? "bg-accent text-dark"
                : "text-slate-400 hover:text-white hover:bg-dark-lighter"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "setup" && (
        <div className="space-y-6">
          {/* About Extension */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">SafeBet Shield</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Расширение автоматически блокирует доступ к азартным сайтам и 
                  отправляет события в вашу систему мониторинга. Каждая попытка 
                  зайти на запрещённый сайт фиксируется и учитывается в профиле риска.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-dark/50 rounded-lg p-3 text-center">
                <div className="text-accent font-bold text-lg">500+</div>
                <div className="text-xs text-slate-500">Сайтов в базе</div>
              </div>
              <div className="bg-dark/50 rounded-lg p-3 text-center">
                <div className="text-accent font-bold text-lg">24/7</div>
                <div className="text-xs text-slate-500">Мониторинг</div>
              </div>
              <div className="bg-dark/50 rounded-lg p-3 text-center">
                <div className="text-accent font-bold text-lg">0 ms</div>
                <div className="text-xs text-slate-500">Задержка блокировки</div>
              </div>
            </div>
          </Card>

          {/* Install Step */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                1
              </div>
              <h3 className="text-white font-semibold">Установите расширение</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Загрузите расширение из папки <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-xs">chrome-extension/</code> через Chrome в режиме разработчика.
            </p>
            <ol className="text-sm text-slate-400 space-y-2 ml-4 list-decimal">
              <li>Откройте <code className="text-slate-300 bg-dark/50 px-1.5 py-0.5 rounded text-xs">chrome://extensions</code></li>
              <li>Включите &quot;Режим разработчика&quot; (правый верхний угол)</li>
              <li>Нажмите &quot;Загрузить распакованное расширение&quot;</li>
              <li>Выберите папку <code className="text-slate-300 bg-dark/50 px-1.5 py-0.5 rounded text-xs">chrome-extension</code> из проекта</li>
            </ol>
          </Card>

          {/* Connect Step */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                2
              </div>
              <h3 className="text-white font-semibold">Подключите к аккаунту</h3>
            </div>

            {activeToken ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-green-400">Расширение подключено</span>
                </div>

                <div className="bg-dark/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Токен</span>
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      {showToken ? "Скрыть" : "Показать"}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <code className="flex-1 min-w-0 text-sm text-slate-300 bg-dark rounded px-3 py-2 font-mono break-all">
                      {showToken ? activeToken.token : maskToken(activeToken.token)}
                    </code>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                      {copied ? "Скопировано!" : "Копировать"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Создан: {new Date(activeToken.created_at).toLocaleDateString("ru-RU")}</span>
                    {activeToken.last_used_at && (
                      <span>Использован: {new Date(activeToken.last_used_at).toLocaleDateString("ru-RU")}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleGenerate} loading={generating} className="flex-1">
                    Пересоздать токен
                  </Button>
                  <Button variant="ghost" onClick={handleRevoke} loading={revoking} className="text-red-400 hover:text-red-300">
                    Отключить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Создайте токен для подключения расширения к вашему аккаунту.
                  Токен используется для безопасной отправки событий блокировки.
                </p>
                <Button onClick={handleGenerate} loading={generating} className="w-full">
                  Подключить расширение
                </Button>
              </div>
            )}
          </Card>

          {/* Step 3 — Configure */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                3
              </div>
              <h3 className="text-white font-semibold">Настройте расширение</h3>
            </div>
            <p className="text-sm text-slate-400">
              После установки откройте popup расширения, вставьте токен 
              и нажмите &quot;Подключить&quot;. Расширение начнёт автоматически 
              блокировать азартные сайты и отправлять события в систему.
            </p>
          </Card>

          {/* Token history */}
          {tokens.length > 1 && (
            <Card>
              <h3 className="text-white font-semibold mb-3">История токенов</h3>
              <div className="space-y-2">
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-dark-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.revoked ? "bg-slate-500" : "bg-green-400"}`} />
                      <code className="text-slate-400 font-mono text-xs">{maskToken(t.token)}</code>
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.revoked ? "Отозван" : "Активен"} &middot; {new Date(t.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="text-center">
              <div className="text-3xl font-bold text-accent">{stats?.today ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Сегодня</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-accent">{stats?.week ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">За неделю</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-accent">{stats?.month ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">За месяц</div>
            </Card>
          </div>

          {/* Top Domains */}
          <Card>
            <h3 className="text-white font-semibold mb-4">Топ заблокированных сайтов</h3>
            {stats?.topDomains && stats.topDomains.length > 0 ? (
              <div className="space-y-3">
                {stats.topDomains.map((d, i) => {
                  const maxCount = stats.topDomains[0].count;
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.domain} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 w-4 text-right">{i + 1}.</span>
                          <span className="text-slate-200 font-mono text-xs">{d.domain}</span>
                        </div>
                        <span className="text-slate-400 text-xs">{d.count}</span>
                      </div>
                      <div className="ml-6 h-1.5 bg-dark rounded-full overflow-hidden">
                        <div className="h-full bg-accent/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Пока нет данных о блокировках
              </p>
            )}
          </Card>

          {/* Recent Events */}
          <Card>
            <h3 className="text-white font-semibold mb-4">Последние блокировки</h3>
            {stats?.recent && stats.recent.length > 0 ? (
              <div className="space-y-2">
                {stats.recent.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-sm text-slate-300 font-mono">{e.domain}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(e.blocked_at).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Нет событий блокировки
              </p>
            )}
          </Card>
        </div>
      )}

      {tab === "unlock" && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-white font-semibold mb-2">Запрос на снятие блокировки</h3>
            <p className="text-sm text-slate-500 mb-4">
              Перед отправкой запроса доверенному лицу необходимо ответить на три вопроса.
              Это помогает выйти из импульса и обдумать решение.
            </p>

            {pendingRequest ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 font-medium">Запрос ожидает ответа</p>
                <p className="text-sm text-slate-400 mt-1">
                  Доверенное лицо получит уведомление в Telegram. Ожидайте решения.
                </p>
              </div>
            ) : unlockSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-400 font-medium">Запрос отправлен</p>
                <p className="text-sm text-slate-400 mt-1">
                  Доверенное лицо получит уведомление в Telegram.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Что изменилось с момента блокировки?
                    </label>
                    <textarea
                      placeholder="Опишите минимум 20 символов..."
                      value={whatChanged}
                      onChange={(e) => setWhatChanged(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Какой план на ближайшие дни?
                    </label>
                    <textarea
                      placeholder="Опишите минимум 20 символов..."
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Что будет, если проиграешь?
                    </label>
                    <textarea
                      placeholder="Опишите минимум 20 символов..."
                      value={ifLose}
                      onChange={(e) => setIfLose(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent min-h-[80px]"
                    />
                  </div>
                </div>

                {!unlockCanSubmit && (
                  <div className="mb-6 p-4 rounded-xl bg-dark-lighter border border-dark-border">
                    <p className="text-sm text-slate-400">
                      Подождите <span className="text-accent font-bold">{unlockPauseLeft}</span> сек. перед отправкой.
                      Это даёт время обдумать решение.
                    </p>
                  </div>
                )}

                {unlockError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {unlockError}
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!unlockCanSubmit || !whatChanged.trim() || !plan.trim() || !ifLose.trim()
                    || whatChanged.length < 20 || plan.length < 20 || ifLose.length < 20}
                  loading={unlockLoading}
                  onClick={async () => {
                    setUnlockError("");
                    setUnlockLoading(true);
                    try {
                      const res = await fetch("/api/unlock-request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          what_changed: whatChanged.trim(),
                          plan: plan.trim(),
                          if_lose: ifLose.trim(),
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setUnlockError(data.error || "Ошибка");
                        return;
                      }
                      setUnlockSuccess(true);
                      setPendingRequest({ status: "pending" });
                    } catch {
                      setUnlockError("Ошибка соединения");
                    } finally {
                      setUnlockLoading(false);
                    }
                  }}
                >
                  Отправить запрос доверенному лицу
                </Button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
