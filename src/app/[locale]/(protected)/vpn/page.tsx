"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";

type DeviceTab = "ios" | "android" | "windows" | "mac" | "linux";

const DEVICE_TABS: { id: DeviceTab; labelKey: string }[] = [
  { id: "ios", labelKey: "ios" },
  { id: "android", labelKey: "android" },
  { id: "windows", labelKey: "windows" },
  { id: "mac", labelKey: "mac" },
  { id: "linux", labelKey: "linux" },
];

export default function VpnPage() {
  const t = useTranslations("vpn");
  const [configAvailable, setConfigAvailable] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("ios");

  useEffect(() => {
    fetch("/api/vpn/config", { method: "HEAD", credentials: "include" })
      .then((r) => setConfigAvailable(r.ok))
      .catch(() => setConfigAvailable(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/vpn/config");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.hint || data.error || "Download failed");
      }
      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "nobet-vpn.conf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setConfigAvailable(false);
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const stepsKey = `${deviceTab}Steps` as const;
  const steps = t(stepsKey);

  return (
    <div className="max-w-3xl mx-auto space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-slate-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Steps overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-dark-card border border-dark-border">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm shrink-0">
            1
          </div>
          <span className="text-sm text-slate-300">{t("step1")}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-dark-card border border-dark-border">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm shrink-0">
            2
          </div>
          <span className="text-sm text-slate-300">{t("step2")}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-dark-card border border-dark-border">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm shrink-0">
            3
          </div>
          <span className="text-sm text-slate-300">{t("step3")}</span>
        </div>
      </div>

      {/* Download card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{t("download")}</h2>
            <p className="text-sm text-slate-400 mt-1">{t("downloadDesc")}</p>
          </div>
          {configAvailable === true ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-60 shrink-0"
            >
              {downloading ? (
                <span className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {downloading ? "..." : t("download")}
            </button>
          ) : (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 font-medium text-sm">{t("notAvailable")}</p>
              <p className="text-slate-500 text-xs mt-1">
                {downloadError || t("notAvailableHint")}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Device instructions */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("deviceStepsTitle")}
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          {t("deviceHint")}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {DEVICE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDeviceTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                deviceTab === tab.id
                  ? "bg-accent text-dark"
                  : "text-slate-400 hover:text-white bg-dark-lighter hover:bg-dark-border"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="bg-dark/50 rounded-lg p-4 border border-dark-border">
          <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
            {steps.split("\n").filter(Boolean).map((line, i) => (
              <li key={i} className="leading-relaxed pl-1">
                {line.replace(/^\d+\.\s*/, "")}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href="https://apps.apple.com/app/wireguard/id1441195209"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            WireGuard для iOS →
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.wireguard.android"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            WireGuard для Android →
          </a>
          <a
            href="https://www.wireguard.com/install/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            WireGuard для Windows / Mac / Linux →
          </a>
        </div>
      </Card>

      {/* Info */}
      <Card className="bg-accent/5 border-accent/20">
        <p className="text-sm text-slate-300">
          {t("howItWorks")}
        </p>
      </Card>
    </div>
  );
}
