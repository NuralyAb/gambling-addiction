"use client";

import { useEffect, useState } from "react";
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
  risk_score: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [trustedName, setTrustedName] = useState("");
  const [trustedEmail, setTrustedEmail] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setCity(data.city || "");
        setPhone(data.phone || "");
        setTrustedName(data.trusted_person_name || "");
        setTrustedEmail(data.trusted_person_email || "");
      })
      .catch(() => setError("Ошибка загрузки профиля"))
      .finally(() => setLoading(false));
  }, []);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage("Профиль сохранён");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

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
              id="phone"
              label="Телефон доверенного лица"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </Card>

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
