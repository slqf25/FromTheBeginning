"use client";

import "./admin.css";
import { useEffect, useRef, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

type VideoRow = { week: number; videoUrl: string | null };

export function AdminVideoLinks({ initialVideos, isDeveloper }: { initialVideos: VideoRow[]; isDeveloper: boolean }) {
  const { t, tError } = useI18n();
  const byWeek = new Map(initialVideos.map((v) => [v.week, v.videoUrl ?? ""]));
  const [values, setValues] = useState<Record<number, string>>({
    1: byWeek.get(1) ?? "", 2: byWeek.get(2) ?? "", 3: byWeek.get(3) ?? "", 4: byWeek.get(4) ?? "",
  });
  const [busy, setBusy] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<number, { kind: "saved" | "error"; message?: string } | undefined>>({});
  const clearTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = clearTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  function setStatusWithExpiry(week: number, value: { kind: "saved" | "error"; message?: string }) {
    clearTimeout(clearTimers.current[week]);
    setStatus((s) => ({ ...s, [week]: value }));
    if (value.kind === "saved") {
      clearTimers.current[week] = setTimeout(() => setStatus((s) => ({ ...s, [week]: undefined })), 2500);
    }
  }

  async function handleSave(week: number) {
    setBusy(week);
    clearTimeout(clearTimers.current[week]);
    setStatus((s) => ({ ...s, [week]: undefined }));
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ week, videoUrl: values[week] }),
    });
    const data = await res.json() as { error?: string };
    setBusy(null);
    setStatusWithExpiry(week, res.ok ? { kind: "saved" } : { kind: "error", message: tError(data.error, "adminVideos.saveError") });
  }

  async function handleDelete(week: number) {
    if (!window.confirm(t("adminVideos.confirmDelete", { week }))) return;
    setBusy(week);
    clearTimeout(clearTimers.current[week]);
    setStatus((s) => ({ ...s, [week]: undefined }));
    const res = await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ week }),
    });
    const data = await res.json() as { error?: string };
    setBusy(null);
    if (res.ok) setValues((v) => ({ ...v, [week]: "" }));
    setStatusWithExpiry(week, res.ok ? { kind: "saved" } : { kind: "error", message: tError(data.error, "adminVideos.saveError") });
  }

  return (
    <section className="admin-table-card admin-video-card">
      <div className="admin-card-heading">
        <h2>{t("adminVideos.title")}</h2>
      </div>
      <div className="video-link-list">
        {[1, 2, 3, 4].map((week) => (
          <div className="video-link-row" key={week}>
            <label>{t("admin.week", { week })}</label>
            <Input
              className="video-link-input"
              value={values[week]}
              onChange={(e) => setValues((v) => ({ ...v, [week]: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <div className="video-link-actions">
              <Button className="video-action-button" type="button" size="sm" disabled={busy === week} onClick={() => handleSave(week)}>
                <Save size={13} /> {busy === week ? t("adminVideos.saving") : t("adminVideos.save")}
              </Button>
              {isDeveloper && (
                <Button className="video-action-button is-delete" type="button" size="sm" variant="outline" disabled={busy === week || !values[week]} onClick={() => handleDelete(week)}>
                  <Trash2 size={13} /> {t("adminVideos.delete")}
                </Button>
              )}
            </div>
            {status[week]?.kind === "saved" && <small className="video-status is-saved">{t("adminVideos.saved")}</small>}
            {status[week]?.kind === "error" && <small className="video-status is-error">{status[week]?.message || t("adminVideos.saveError")}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}
