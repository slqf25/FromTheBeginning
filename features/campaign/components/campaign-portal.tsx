"use client";

import "./campaign-portal.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronUp, Heart, LockKeyhole, UserRound } from "lucide-react";
import Image from "next/image";
import EchoText from "@/components/EchoText";
import churchLogo from "@/images/basel_logo.png";
import { campaign } from "@/features/campaign/config";
import { isVideoAccessOpen, resolveActiveVideoWeek } from "@/features/campaign/video-visibility";
import { ScrollStarfield } from "@/features/campaign/components/scroll-starfield";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

type Participant = { id: string; name: string; email: string; checkins: number[]; remindersEnabled: boolean };
type StatusResponse = { participant: Participant | null; videoUrls: Record<string, string>; availableWeeks: number[]; openWeeks: number[]; currentWeek: number | null; nextTransitionAt: string | null };

function WeekLightMark({ week }: { week: number }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.55, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  if (week === 1) return <svg {...common} className="week-light-mark light-mark-glimmer"><path d="M12 2.8c.55 5.8 1.6 7.85 7.2 8.45-5.6.6-7.65 2.65-8.2 8.45-.55-5.8-1.6-7.85-7.2-8.45 5.6-.6 7.65-2.65 8.2-8.45Z" /><path d="M18.4 3.8v3.4M16.7 5.5h3.4" /></svg>;
  if (week === 2) return <svg {...common} className="week-light-mark light-mark-echo"><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="4.25" /><circle cx="12" cy="12" r="7.35" /></svg>;
  if (week === 3) return <svg {...common} className="week-light-mark light-mark-flame"><path d="M12.1 2.9c.9 4.15 4.9 5.45 4.9 10.05a5 5 0 0 1-10 0c0-2.85 1.45-5.2 4.05-7.45-.1 2.45.55 3.65 1.45 4.35 1.15-2.3.85-4.85-.4-6.95Z" /><path d="M12 12.1c1.25 1.35 1.8 2.45 1.8 3.55a1.8 1.8 0 0 1-3.6 0c0-1 .55-2.2 1.8-3.55Z" /></svg>;
  return <svg {...common} className="week-light-mark light-mark-dawn"><path d="M4 18h16M6.2 18a5.8 5.8 0 0 1 11.6 0M12 3.4v3M5.9 6l2.05 2.05M18.1 6l-2.05 2.05M3.5 12h3M17.5 12h3" /></svg>;
}

async function readJson<T>(response: Response): Promise<T | null> {
  const body = await response.text();
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

function withAutoplay(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    url.searchParams.set("autoplay", "1");
    if (url.hostname.includes("youtube")) url.searchParams.set("mute", "1");
    if (url.hostname.includes("vimeo")) url.searchParams.set("muted", "1");
    return url.toString();
  } catch {
    return videoUrl;
  }
}

export function CampaignPortal() {
  const { t, tError } = useI18n();
  const [status, setStatus] = useState<StatusResponse>({ participant: null, videoUrls: {}, availableWeeks: [], openWeeks: [], currentWeek: null, nextTransitionAt: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [scene, setScene] = useState<"intro" | "opening" | "checkin">("intro");
  const [message, setMessage] = useState("");
  const [postCheckinWeek, setPostCheckinWeek] = useState<number | null>(null);
  const [activeVideoWeek, setActiveVideoWeek] = useState<number | null>(null);
  const [pendingCheckinWeek, setPendingCheckinWeek] = useState<number | null>(null);
  const completed = status.participant?.checkins ?? [];

  const applyStatus = useCallback((nextStatus: StatusResponse) => {
    setStatus(nextStatus);
    setActiveVideoWeek((currentActiveWeek) => resolveActiveVideoWeek({ completedWeeks: nextStatus.participant?.checkins ?? [], currentWeek: nextStatus.currentWeek, videoUrls: nextStatus.videoUrls }, currentActiveWeek));
  }, []);

  const refresh = useCallback(async (): Promise<StatusResponse | null> => {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) { setLoading(false); return null; }
    const nextStatus = await response.json() as StatusResponse;
    applyStatus(nextStatus);
    setLoading(false);
    return nextStatus;
  }, [applyStatus]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data) applyStatus(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applyStatus]);

  useEffect(() => {
    if (!status.nextTransitionAt) return;
    const delay = Math.max(1000, new Date(status.nextTransitionAt).getTime() - Date.now() + 1000);
    const timer = window.setTimeout(() => { void refresh(); }, Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [refresh, status.nextTransitionAt]);

  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [refresh]);

  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  useEffect(() => {
    if (scene !== "intro") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setScene("opening"), reducedMotion ? 2500 : 3000);
    return () => window.clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene !== "opening") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setScene("checkin"), reducedMotion ? 30 : 680);
    return () => window.clearTimeout(timer);
  }, [scene]);

  function openIntro() {
    setScene("intro");
  }

  async function recordCheckIn(week: number) {
    setMessage(t("campaign.recording"));
    const response = await fetch("/api/checkins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ week }) });
    const data = await readJson<{ error?: string }>(response);
    if (!response.ok) { setMessage(tError(data?.error, "campaign.genericError")); return; }
    setMessage("");
    const nextStatus = await refresh();
    setActiveVideoWeek(nextStatus?.videoUrls[String(week)] ? week : null);
    setPostCheckinWeek(week);
  }

  async function checkIn(week: number) {
    if (!status.participant) { setPendingCheckinWeek(week); setModal(true); return; }
    await recordCheckIn(week);
  }

  async function finishRegistration() {
    await refresh();
    setModal(false);
    if (pendingCheckinWeek !== null) {
      const week = pendingCheckinWeek;
      setPendingCheckinWeek(null);
      await recordCheckIn(week);
    }
  }

  async function toggleReminders() {
    if (!status.participant) return;
    const nextEnabled = !status.participant.remindersEnabled;
    setStatus((current) => current.participant ? { ...current, participant: { ...current.participant, remindersEnabled: nextEnabled } } : current);
    await fetch("/api/session", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ remindersEnabled: nextEnabled }) });
  }

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    await refresh();
  }

  const activeWeek = activeVideoWeek === null ? null : campaign.weeks.find((week) => week.number === activeVideoWeek) ?? null;
  const activeVideoUrl = activeWeek ? status.videoUrls[String(activeWeek.number)] : undefined;
  const showVideoLayout = Boolean(activeWeek && activeVideoUrl);
  const videoAccessOpen = isVideoAccessOpen({ completedWeeks: completed, currentWeek: status.currentWeek, videoUrls: status.videoUrls });
  const playableWeeks = campaign.weeks.filter((week) => completed.includes(week.number) && Boolean(status.videoUrls[String(week.number)]));
  const activeVideoIndex = activeWeek ? playableWeeks.findIndex((week) => week.number === activeWeek.number) : -1;
  const previousVideoWeek = activeVideoIndex > 0 ? playableWeeks[activeVideoIndex - 1] : null;
  const nextVideoWeek = activeVideoIndex >= 0 && activeVideoIndex < playableWeeks.length - 1 ? playableWeeks[activeVideoIndex + 1] : null;

  return (
    <main className="site-shell single-page-shell" data-scene={scene}>
      <div className="genesis-sky" aria-hidden="true">
        <div className="genesis-glow" />
        <ScrollStarfield />
      </div>
      <div className="paper-grain" />
      <header className="topbar single-topbar">
        {status.participant ? <ProfileMenu participant={status.participant} onToggleReminders={toggleReminders} onLogout={logout} /> : <button className="login-link topbar-profile" onClick={() => setModal(true)}><UserRound size={17} /> {t("common.profile")}</button>}
        <button className="brand topbar-title deck-home" type="button" onClick={openIntro} aria-label={t("common.backHome")}><span className="brand-mark"><Image src={churchLogo} alt="" priority /></span><span>{t("common.brand")}</span></button>
        <div className="topbar-actions">
          <LanguageSwitch />
          <a className="contact-link" href="/privacy" aria-label={t("common.privacy")}>{t("common.privacy")} <LockKeyhole size={15} /></a>
        </div>
      </header>
      <div className="campaign-deck" id="top" data-scene={scene} aria-label={t("campaign.journeyLabel")}>
        <div className="scene-track">
          <div className="deck-scene intro-scene" aria-hidden={scene === "checkin"} inert={scene === "checkin" ? true : undefined}>
            <div className="intro-curtain intro-curtain-top" aria-hidden="true" />
            <div className="intro-curtain intro-curtain-bottom" aria-hidden="true" />
            <div className="intro-seam" aria-hidden="true" />
            <div className="intro-light" aria-hidden="true" />
            <div className="intro-content">
              <p className="intro-kicker">{t("intro.kicker")}</p>
              <div className="echo-title-wrap">
                <EchoText text={t("intro.title")} echoes={12} lag={0.24} offset={36} direction="right" fade={0.72} blur={3} tint="#e4ad50" echoStyle="solid" echoScale={1} mode="both" trail="pointer" clickBurst cursorRadius={320} duration={900} ease="ease-out" fontSize="clamp(3.1rem, 15vw, 9rem)" fontWeight={400} fontFamily={'"Beginning Display","Noto Serif SC",serif'} className="echo-title" />
              </div>
              <p className="intro-english">{t("intro.subtitle")}</p>
            </div>
          </div>

          <div className="deck-scene checkin-scene" id="journey" aria-hidden={scene !== "checkin"} inert={scene !== "checkin" ? true : undefined}>
            <div className={`ticket-page ${showVideoLayout ? "is-video-layout" : ""}`}>
              <div className="ticket-grid" aria-label={t("campaign.ticketsLabel")}>
                {campaign.weeks.map((week) => {
                  const isPublished = status.availableWeeks.includes(week.number);
                  const isOpen = status.openWeeks.includes(week.number);
                  const isComplete = completed.includes(week.number);
                  const videoUrl = status.videoUrls[String(week.number)];
                  const canWatch = videoAccessOpen && isComplete && Boolean(videoUrl);
                  const buttonDisabled = !isOpen;
                  const buttonLabel = isOpen ? <>{t("campaign.checkInNow")} <ArrowRight size={15} /></> : isPublished ? t("campaign.weekEnded") : t("campaign.notOpen");

                  const isActiveVideo = activeVideoWeek === week.number && canWatch;

                  return <article className={`ticket-card ${isComplete ? "is-complete" : ""} ${!isPublished ? "is-locked" : ""} ${isActiveVideo ? "is-active-video" : ""} ${canWatch ? "has-video" : ""}`} key={week.number} role={canWatch ? "button" : undefined} tabIndex={canWatch ? 0 : undefined} onClick={canWatch ? () => setActiveVideoWeek(week.number) : undefined} onKeyDown={canWatch ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveVideoWeek(week.number); } } : undefined}>
                    <div className="ticket-stub" aria-hidden="true">
                      <span>{t("campaign.day")}</span>
                      <strong>0{week.number}</strong>
                      <WeekLightMark week={week.number} />
                    </div>
                    <div className="ticket-body">
                      <div className="ticket-date"><span>{isPublished ? t("campaign.weekLabel", { week: week.number }) : t("campaign.opens")}</span><strong>{week.date}</strong></div>
                      <h2>{isPublished ? t(`week.${week.number}.title` as TranslationKey) : t("campaign.waiting")}</h2>
                      {!isComplete && <button type="button" disabled={buttonDisabled} onClick={() => checkIn(week.number)}>{buttonLabel}</button>}
                      {message && isOpen && !isComplete && <small className="ticket-message">{message}</small>}
                    </div>
                    {isComplete && <span className="ticket-stamp"><Check size={18} /> {t("campaign.stamp")}</span>}
                  </article>;
                })}
              </div>
              {activeWeek && activeVideoUrl && <section className="home-video-stage" aria-labelledby="home-video-title">
                <header className="home-video-heading">
                  <div><span>{t("video.optional", { week: activeWeek.number })}</span><h2 id="home-video-title">{t(`week.${activeWeek.number}.title` as TranslationKey)}</h2></div>
                  <div className="home-video-actions">
                    <nav className="video-week-nav" aria-label={t("video.navigation")}>
                      <button type="button" disabled={!previousVideoWeek} onClick={() => previousVideoWeek && setActiveVideoWeek(previousVideoWeek.number)} aria-label={t("video.previous")}><ChevronLeft size={20} /></button>
                      <button type="button" disabled={!nextVideoWeek} onClick={() => nextVideoWeek && setActiveVideoWeek(nextVideoWeek.number)} aria-label={t("video.next")}><ChevronRight size={20} /></button>
                    </nav>
                    {completed.includes(4) && <button className="video-collapse-button" type="button" onClick={() => setActiveVideoWeek(null)} aria-label={t("video.back")}><ChevronUp size={17} /><span>{t("video.back")}</span></button>}
                  </div>
                </header>
                <div className="video-frame"><iframe key={`week-video-${activeWeek.number}`} src={withAutoplay(activeVideoUrl)} title={t("video.frameTitle", { week: activeWeek.number })} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
              </section>}
            </div>
          </div>
        </div>
      </div>
      {modal && <LoginModal onClose={() => { setModal(false); setPendingCheckinWeek(null); }} onDone={finishRegistration} />}
      {postCheckinWeek !== null && <PostCheckinModal week={campaign.weeks.find((week) => week.number === postCheckinWeek)!} videoUrl={status.videoUrls[String(postCheckinWeek)]} onClose={() => setPostCheckinWeek(null)} />}
      {loading && <div className="loading-screen"><Heart fill="currentColor" /></div>}
    </main>
  );
}

function PostCheckinModal({ week, videoUrl, onClose }: { week: (typeof campaign.weeks)[number]; videoUrl?: string; onClose: () => void }) {
  const { t } = useI18n();
  const nextWeek = campaign.weeks.find((item) => item.number === week.number + 1);

  return <div className="modal-backdrop result-backdrop" onMouseDown={onClose}><div className="post-checkin-modal result-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-success-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label={t("common.close")}>×</button>
    <header className="result-ticket-head"><span>{t("result.kicker")}</span><strong>{t("result.weekNumber", { week: week.number })}</strong></header>
    <div className="result-ticket-body">
      <div className="result-success-heading">
        <span className="result-icon"><Check size={24} /></span>
        <h2 id="checkin-success-title">{t("result.title", { week: week.number })}</h2>
      </div>
      <blockquote><p>“{t(`week.${week.number}.verse` as TranslationKey)}”</p><cite>{t(`week.${week.number}.reference` as TranslationKey)}</cite></blockquote>
      <div className="result-next"><span>{t(nextWeek ? "result.nextLabel" : "result.finalLabel")}</span><strong>{nextWeek ? t("result.nextDate", { date: nextWeek.date }) : t("result.finalNote")}</strong></div>
      <div className="result-actions"><button className="primary-btn" onClick={onClose}>{videoUrl ? t("result.continue") : t("result.done")} <ArrowRight size={16} /></button></div>
    </div>
  </div></div>;
}

function ProfileMenu({ participant, onToggleReminders, onLogout }: { participant: Participant; onToggleReminders: () => void; onLogout: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return <div className="profile-menu" ref={menuRef}>
    <button type="button" className="profile-pill topbar-profile" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
      <span>{participant.name.slice(0, 1)}</span>{participant.name}
    </button>
    {open && <div className="profile-dropdown" role="menu">
      <label className="profile-dropdown-item consent">
        <input type="checkbox" checked={participant.remindersEnabled} onChange={onToggleReminders} />
        <span>{t("login.reminders")}</span>
      </label>
      <button type="button" className="profile-dropdown-item profile-dropdown-logout" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>{t("login.logout")}</button>
    </div>}
  </div>;
}

function LoginModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t, tError } = useI18n();
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setError("");
    try {
      const response = await fetch("/api/session", { method: "POST", body: formData });
      const data = await readJson<{ error?: string }>(response);
      if (!response.ok) return setError(tError(data?.error, "error.registration"));
      onDone();
    } catch {
      setError(t("error.network"));
    }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="login-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label={t("common.close")}>×</button><p className="section-kicker">{t("login.kicker")}</p><h2>{t("login.title")}</h2><form action={submit}><label>{t("login.name")}<input name="name" required minLength={2} placeholder={t("login.namePlaceholder")} /></label><label>{t("login.email")}<input name="email" required type="email" placeholder="name@example.com" /></label><label className="consent"><input name="reminders" type="checkbox" defaultChecked /><span>{t("login.reminders")}</span></label><button className="primary-btn" type="submit">{t("login.submit")} <ArrowRight size={17} /></button>{error && <p className="form-error">{error}</p>}<small>{t("login.disclaimerBefore")} <a href="/privacy" target="_blank" rel="noreferrer">{t("common.privacy")}</a>{t("login.disclaimerAfter")}</small></form></div></div>;
}
