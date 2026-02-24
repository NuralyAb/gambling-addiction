"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ChatWidget from "@/components/ChatWidget";
import { IconChat, IconBook, IconClipboard, IconPhone } from "@/components/Icons";

const TABS = [
  { id: "chat", label: "Поговорить", Icon: IconChat },
  { id: "learn", label: "Узнать", Icon: IconBook },
  { id: "resources", label: "Ресурсы", Icon: IconClipboard },
];

const LEARN_ITEMS = [
  { title: "Почему сложно остановиться", desc: "Мозг привыкает к азарту. Это не слабость — это нейробиология." },
  { title: "Техника HALT", desc: "Проверьте: голод, злость, одиночество, усталость — частые триггеры." },
  { title: "Первый шаг", desc: "Признание проблемы — уже половина решения. Вы здесь — это важно." },
];

const RESOURCES = [
  { title: "Анонимные игроки", desc: "Группы взаимопомощи по всему миру" },
  { title: "Для близких", desc: "Как поддержать без давления и обвинений" },
  { title: "Самоисключение", desc: "Заявка на блокировку в казино и букмекерах" },
];

export default function HelpPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTab = ["chat", "learn", "resources"].includes(tabFromUrl || "") ? tabFromUrl : "chat";
  const [tab, setTab] = useState(validTab);

  useEffect(() => {
    if (validTab) setTab(validTab);
  }, [validTab]);

  return (
    <div className="space-y-6 pb-8 w-full min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Помощь</h1>
        <p className="text-slate-400 mt-1">Поговорить, узнать, найти поддержку</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-card rounded-xl border border-dark-border">
        {TABS.map((t) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent text-dark"
                  : "text-slate-400 hover:text-white hover:bg-dark-lighter"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "chat" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <IconPhone className="w-6 h-6 text-red-400 shrink-0" />
            <p className="text-sm text-slate-300">
              <strong>Кризис:</strong> Телефон доверия{" "}
              <a href="tel:88002000122" className="text-accent hover:underline">8-800-2000-122</a>
            </p>
          </div>
          <Card className="p-4 overflow-hidden min-w-0">
            <ChatWidget compact />
          </Card>
        </div>
      )}

      {tab === "learn" && (
        <div className="space-y-4">
          {LEARN_ITEMS.map((item) => (
            <Card key={item.title}>
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </Card>
          ))}
          <Link href="/education">
            <Button variant="secondary" className="w-full">Подробнее об обучении</Button>
          </Link>
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-4">
          {RESOURCES.map((item) => (
            <Card key={item.title}>
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </Card>
          ))}
          <Link href="/resources">
            <Button variant="secondary" className="w-full">Все ресурсы</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
