"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface Stats {
  users: number;
  diaryEntries: number;
  chatMessages: number;
  blockEvents: number;
  pgsiResults: number;
}

interface Activity {
  users: { id: string; email: string; name: string | null; created_at: string }[];
  blocks: { id: string; user_id: string; domain: string; blocked_at: string }[];
}

interface AdminLog {
  id: string;
  admin_email: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [checkRes, statsRes, activityRes, logsRes] = await Promise.all([
          fetch("/api/admin/check"),
          fetch("/api/admin/stats"),
          fetch("/api/admin/activity?limit=15"),
          fetch("/api/admin/logs?limit=30"),
        ]);

        const check = await checkRes.json();
        if (!check.admin) {
          setError("Доступ запрещён");
          setLoading(false);
          return;
        }

        if (!statsRes.ok || !activityRes.ok) {
          setError("Ошибка загрузки данных");
          setLoading(false);
          return;
        }

        const [s, a, l] = await Promise.all([
          statsRes.json(),
          activityRes.json(),
          logsRes.json(),
        ]);
        setStats(s);
        setActivity(a);
        setLogs(l.logs ?? []);
      } catch {
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="border-red-500/30">
          <p className="text-red-400">{error}</p>
          <Link href="/dashboard" className="text-accent hover:underline mt-2 inline-block">
            Вернуться на дашборд
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
          <p className="text-slate-400 text-sm mt-1">Статистика, активность, логи</p>
        </div>
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          На дашборд
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Пользователей", value: stats.users },
            { label: "Записей дневника", value: stats.diaryEntries },
            { label: "Сообщений чата", value: stats.chatMessages },
            { label: "Блокировок", value: stats.blockEvents },
            { label: "PGSI тестов", value: stats.pgsiResults },
          ].map((item) => (
            <Card key={item.label} className="border-dark-border">
              <p className="text-slate-500 text-xs uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-bold mt-1 text-accent">
                {item.value.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent users */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Последние регистрации</h2>
          {activity?.users?.length ? (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {activity.users.map((u) => (
                <li key={u.id} className="flex justify-between items-center text-sm py-2 border-b border-dark-border last:border-0">
                  <span className="text-slate-300 truncate max-w-[70%]">{u.email}</span>
                  <span className="text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString("ru")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Нет данных</p>
          )}
        </Card>

        {/* Recent blocks */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Последние блокировки</h2>
          {activity?.blocks?.length ? (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {activity.blocks.map((b) => (
                <li key={b.id} className="flex justify-between items-center text-sm py-2 border-b border-dark-border last:border-0">
                  <span className="text-slate-300 truncate max-w-[60%] font-mono">{b.domain}</span>
                  <span className="text-slate-500 text-xs">
                    {new Date(b.blocked_at).toLocaleString("ru")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Нет данных</p>
          )}
        </Card>
      </div>

      {/* Admin logs */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Логи админов</h2>
        {logs.length > 0 ? (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((l) => (
              <li key={l.id} className="text-sm py-2 border-b border-dark-border last:border-0 flex gap-4">
                <span className="text-slate-500 shrink-0 w-36">
                  {new Date(l.created_at).toLocaleString("ru")}
                </span>
                <span className="text-accent shrink-0">{l.admin_email}</span>
                <span className="text-slate-300">{l.action}</span>
                {l.details && Object.keys(l.details).length > 0 && (
                  <span className="text-slate-500 text-xs truncate">
                    {JSON.stringify(l.details)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">
            Логи пока пусты. Выполните миграцию supabase-migration-admin.sql для создания таблицы admin_logs.
          </p>
        )}
      </Card>

      <p className="text-slate-500 text-xs mt-4">
        Админ: добавьте ADMIN_EMAIL в .env.local (например: ADMIN_EMAIL=admin@example.com). Через запятую — несколько админов.
      </p>
    </div>
  );
}
