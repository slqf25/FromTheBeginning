"use client";

import "./admin.css";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Gift, LogOut, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";

type GiftTier = "large" | "small" | "none";
type Row = { id: string; name: string; email: string; remindersEnabled: boolean; createdAt: string; checkins: number[]; gift: GiftTier };

export function AdminDashboard({ rows, adminName, isDeveloper }: { rows: Row[]; adminName: string; isDeveloper: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const large = rows.filter((row) => row.checkins.length === 4).length;
  const small = rows.filter((row) => row.checkins.length > 0 && row.checkins.length < 4).length;
  const giftLabel = (gift: GiftTier) => gift === "large" ? t("admin.giftLarge") : gift === "small" ? t("admin.giftSmall") : t("admin.giftNone");
  function exportCsv() {
    const header = [t("admin.participant"), "Email", t("admin.week", { week: 1 }), t("admin.week", { week: 2 }), t("admin.week", { week: 3 }), t("admin.week", { week: 4 }), t("admin.total"), t("admin.gift")].join(",");
    const csv = [header, ...rows.map((row) => [row.name, row.email].concat([1, 2, 3, 4].map((w) => row.checkins.includes(w) ? t("admin.complete") : "—"), [String(row.checkins.length), giftLabel(row.gift)]).map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); link.download = "起初的心-礼物名单.csv"; link.click(); URL.revokeObjectURL(link.href);
  }
  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }
  return <main className="admin-shell"><header className="admin-top"><div><Link href="/"><ArrowLeft size={15} /> {t("admin.back")}</Link><p>ADMIN DASHBOARD</p><h1>{t("admin.title")}</h1></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><LanguageSwitch className="admin-language-switch" /><div className="admin-user">{t("admin.user")}<br /><strong>{adminName}</strong></div>{isDeveloper && <Link href="/admin/manage" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#874d38" }}><ShieldCheck size={13} /> {t("admin.manageLink")}</Link>}<button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#874d38" }}><LogOut size={13} /> {t("admin.logout")}</button></div></header><section className="stats-grid"><article><Users /><span>{t("admin.registered")}</span><strong>{rows.length}</strong></article><article><Gift /><span>{t("admin.largeGift")}</span><strong>{large}</strong></article><article><Sparkles /><span>{t("admin.smallGift")}</span><strong>{small}</strong></article><article><span>{t("admin.total")}</span><strong>{rows.reduce((sum, row) => sum + row.checkins.length, 0)}</strong></article></section><section className="admin-table-card"><div className="table-tools"><div><h2>{t("admin.participants")}</h2><p>{t("admin.description")}</p></div><div className="tool-actions"><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("admin.search")} /></label><button onClick={exportCsv}><Download size={15} /> {t("admin.export")}</button></div></div><div className="table-scroll"><table><thead><tr><th>{t("admin.participant")}</th>{[1,2,3,4].map((week) => <th key={week}>{t("admin.week", { week })}</th>)}<th>{t("admin.progress")}</th><th>{t("admin.gift")}</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td>{[1,2,3,4].map((week) => <td key={week}><span className={row.checkins.includes(week) ? "status-dot yes" : "status-dot"}>{row.checkins.includes(week) ? "✓" : "—"}</span></td>)}<td>{row.checkins.length} / 4</td><td><span className={`gift-status ${row.gift}`}>{giftLabel(row.gift)}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-row">{t("admin.empty")}</div>}</div></section></main>;
}
