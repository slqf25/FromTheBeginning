"use client";

import "./admin.css";
import { useMemo, useState } from "react";
import { ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Gift, LogOut, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";
import { AdminVideoLinks } from "@/features/admin/components/admin-video-links";

type GiftTier = "large" | "small" | "none";
type GiftFilter = "all" | GiftTier;
type ParticipantSort = "name-asc" | "name-desc" | "checkins-desc" | "checkins-asc" | "newest" | "oldest";
type Row = { id: string; name: string; email: string; remindersEnabled: boolean; createdAt: string; checkins: number[]; gift: GiftTier; giftCollectedAt: string | null };
type VideoRow = { week: number; videoUrl: string | null };
const PARTICIPANTS_PER_PAGE = 50;

export function AdminDashboard({ rows: initialRows, videos, adminName, isDeveloper }: { rows: Row[]; videos: VideoRow[]; adminName: string; isDeveloper: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("all");
  const [sortBy, setSortBy] = useState<ParticipantSort>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const filtered = useMemo(() => rows.filter((row) => {
    const matchesQuery = `${row.name} ${row.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesGift = giftFilter === "all" || row.gift === giftFilter;
    return matchesQuery && matchesGift;
  }), [giftFilter, query, rows]);
  const sortedRows = useMemo(() => {
    const collator = new Intl.Collator(locale === "zh" ? "zh-Hans" : "en", { numeric: true, sensitivity: "base" });
    return [...filtered].sort((a, b) => {
      if (sortBy === "name-desc") return collator.compare(b.name, a.name);
      if (sortBy === "checkins-desc") return b.checkins.length - a.checkins.length || collator.compare(a.name, b.name);
      if (sortBy === "checkins-asc") return a.checkins.length - b.checkins.length || collator.compare(a.name, b.name);
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return collator.compare(a.name, b.name);
    });
  }, [filtered, locale, sortBy]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PARTICIPANTS_PER_PAGE));
  const pageStart = (currentPage - 1) * PARTICIPANTS_PER_PAGE;
  const pagedRows = sortedRows.slice(pageStart, pageStart + PARTICIPANTS_PER_PAGE);
  const rangeStart = sortedRows.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PARTICIPANTS_PER_PAGE, sortedRows.length);
  const large = rows.filter((row) => row.checkins.length === 4).length;
  const small = rows.filter((row) => row.checkins.length > 0 && row.checkins.length < 4).length;
  const collectedCount = rows.filter((row) => row.giftCollectedAt).length;
  const giftLabel = (gift: GiftTier) => gift === "large" ? t("admin.giftLarge") : gift === "small" ? t("admin.giftSmall") : t("admin.giftNone");
  function exportCsv() {
    const header = [t("admin.participant"), t("admin.email"), t("admin.week", { week: 1 }), t("admin.week", { week: 2 }), t("admin.week", { week: 3 }), t("admin.week", { week: 4 }), t("admin.total"), t("admin.gift"), t("admin.giftStatus")].join(",");
    const csv = [header, ...sortedRows.map((row) => [row.name, row.email].concat([1, 2, 3, 4].map((w) => row.checkins.includes(w) ? t("admin.complete") : "—"), [String(row.checkins.length), giftLabel(row.gift), row.giftCollectedAt ? t("admin.giftCollected") : t("admin.giftNotCollected")]).map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const filterSuffix = giftFilter === "all" ? "" : `-${giftLabel(giftFilter)}`;
    const filename = t("admin.csvFilename").replace(/\.csv$/i, `${filterSuffix}.csv`);
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
  }
  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }
  async function toggleCollected(row: Row) {
    const nextCollected = !row.giftCollectedAt;
    setTogglingId(row.id);
    const res = await fetch("/api/admin/gifts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ participantId: row.id, collected: nextCollected }),
    });
    setTogglingId(null);
    if (!res.ok) return;
    const data = await res.json() as { participant: { giftCollectedAt: string | null } };
    setRows((current) => current.map((r) => r.id === row.id ? { ...r, giftCollectedAt: data.participant.giftCollectedAt } : r));
  }
  return (
    <main className="admin-shell">
      <header className="admin-top admin-dashboard-top">
        <div className="admin-header-left">
          <details className="admin-account-menu">
            <summary className="admin-account">
              <span className="admin-avatar" aria-hidden="true">{adminName.trim().charAt(0).toUpperCase()}</span>
              <span className="admin-user"><span>{t("admin.user")}</span><strong>{adminName}</strong></span>
              <ChevronDown className="admin-account-chevron" size={15} aria-hidden="true" />
            </summary>
            <div className="admin-account-dropdown">
              <button type="button" onClick={handleLogout}><LogOut size={15} /><span>{t("admin.logout")}</span></button>
            </div>
          </details>
        </div>
        <div className="admin-heading-copy">
          <p>{t("admin.kicker")}</p>
          <h1>{t("admin.title")}</h1>
        </div>
        <div className="admin-header-right">
          <div className="admin-header-actions">
            <LanguageSwitch className="admin-language-switch" />
            {isDeveloper && <Link className="admin-action-button" href="/admin/manage"><ShieldCheck size={15} /><span>{t("admin.manageLink")}</span></Link>}
          </div>
        </div>
      </header>

      <section className="stats-grid" aria-label={t("admin.kicker")}>
        <article><span className="stat-icon"><Users /></span><div className="stat-copy"><span>{t("admin.registered")}</span><strong>{rows.length}</strong></div></article>
        <article><span className="stat-icon"><Gift /></span><div className="stat-copy"><span>{t("admin.largeGift")}</span><strong>{large}</strong></div></article>
        <article><span className="stat-icon"><Sparkles /></span><div className="stat-copy"><span>{t("admin.smallGift")}</span><strong>{small}</strong></div></article>
      </section>

      <section className="admin-table-card">
        <div className="table-tools"><div><h2>{t("admin.participants")}</h2><p>{t("admin.description")} · {t("admin.giftCollected")} {collectedCount}/{rows.length}</p></div><div className="tool-actions"><label><Search size={15} /><input value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} placeholder={t("admin.search")} /></label><label className="admin-filter-control"><Filter size={14} /><select value={giftFilter} onChange={(e) => { setGiftFilter(e.target.value as GiftFilter); setCurrentPage(1); }} aria-label={t("admin.filterGiftLabel")}><option value="all">{t("admin.filterAllGifts")}</option><option value="large">{t("admin.largeGift")}</option><option value="small">{t("admin.smallGift")}</option><option value="none">{t("admin.giftNone")}</option></select></label><label className="admin-sort-control"><ArrowUpDown size={14} /><select value={sortBy} onChange={(e) => { setSortBy(e.target.value as ParticipantSort); setCurrentPage(1); }} aria-label={t("admin.sortLabel")}><option value="name-asc">{t("admin.sortNameAsc")}</option><option value="name-desc">{t("admin.sortNameDesc")}</option><option value="checkins-desc">{t("admin.sortCheckinsDesc")}</option><option value="checkins-asc">{t("admin.sortCheckinsAsc")}</option><option value="newest">{t("admin.sortNewest")}</option><option value="oldest">{t("admin.sortOldest")}</option></select></label><button onClick={exportCsv} disabled={sortedRows.length === 0}><Download size={15} /> {t("admin.export")}</button></div></div>
        <div className="table-scroll"><table><thead><tr><th>{t("admin.participant")}</th>{[1,2,3,4].map((week) => <th key={week}>{t("admin.week", { week })}</th>)}<th>{t("admin.progress")}</th><th>{t("admin.gift")}</th><th>{t("admin.giftStatus")}</th></tr></thead><tbody>{pagedRows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td>{[1,2,3,4].map((week) => <td key={week}><span className={row.checkins.includes(week) ? "status-dot yes" : "status-dot"}>{row.checkins.includes(week) ? "✓" : "—"}</span></td>)}<td>{row.checkins.length} / 4</td><td><span className={`gift-status ${row.gift}`}>{giftLabel(row.gift)}</span></td><td>{row.gift === "none" ? "—" : <button onClick={() => toggleCollected(row)} disabled={togglingId === row.id} aria-pressed={Boolean(row.giftCollectedAt)} title={row.giftCollectedAt ? t("admin.giftCollected") : t("admin.markCollected")} className={`gift-checkbox${row.giftCollectedAt ? " checked" : ""}`}>{row.giftCollectedAt && <Check size={14} />}</button>}</td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-row">{t("admin.empty")}</div>}</div>
        {filtered.length > 0 && <nav className="admin-pagination" aria-label={t("admin.participants")}>
          <p>{t("admin.paginationRange", { start: rangeStart, end: rangeEnd, total: filtered.length })}</p>
          <div className="admin-pagination-controls">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} aria-label={t("admin.paginationPrevious")} title={t("admin.paginationPrevious")}><ChevronLeft size={16} /></button>
            <span>{t("admin.paginationPage", { page: currentPage, pages: pageCount })}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} aria-label={t("admin.paginationNext")} title={t("admin.paginationNext")}><ChevronRight size={16} /></button>
          </div>
        </nav>}
      </section>
      <AdminVideoLinks initialVideos={videos} isDeveloper={isDeveloper} />
    </main>
  );
}
