"use client";

import "./campaign-portal.css";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Ear, HandHeart, Heart, LockKeyhole, Play, Sunrise, UserRound } from "lucide-react";
import Image from "next/image";
import EchoText from "@/components/EchoText";
import churchLogo from "@/images/basel_logo.png";
import { campaign } from "@/features/campaign/config";
import { ScrollStarfield } from "@/features/campaign/components/scroll-starfield";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

type Participant = { id: string; name: string; email: string; checkins: number[] };
type StatusResponse = { participant: Participant | null; videoUrls: Record<string, string>; availableWeeks: number[]; openWeeks: number[] };
const weekIcons = [Heart, Ear, HandHeart, Sunrise] as const;

async function readJson<T>(response: Response): Promise<T | null> {
  const body = await response.text();
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function CampaignPortal() {
  const { t, tError } = useI18n();
  const [status, setStatus] = useState<StatusResponse>({ participant: null, videoUrls: {}, availableWeeks: [], openWeeks: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [scene, setScene] = useState<"intro" | "opening" | "checkin">("intro");
  const [message, setMessage] = useState("");
  const [postCheckin, setPostCheckin] = useState<{ week: number; stage: "success" | "video" } | null>(null);
  const [pendingCheckinWeek, setPendingCheckinWeek] = useState<number | null>(null);
  const completed = status.participant?.checkins ?? [];

  const applyStatus = useCallback((nextStatus: StatusResponse) => {
    setStatus(nextStatus);
  }, []);

  async function refresh() {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (response.ok) applyStatus(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data) applyStatus(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applyStatus]);

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
    await refresh();
    setPostCheckin({ week, stage: "success" });
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

  return (
    <main className="site-shell single-page-shell" data-scene={scene}>
      <div className="genesis-sky" aria-hidden="true">
        <div className="genesis-glow" />
        <ScrollStarfield />
      </div>
      <div className="paper-grain" />
      <header className="topbar single-topbar">
        {status.participant ? <button className="profile-pill topbar-profile" onClick={() => setModal(true)}><span>{status.participant.name.slice(0, 1)}</span>{status.participant.name}</button> : <button className="login-link topbar-profile" onClick={() => setModal(true)}><UserRound size={17} /> {t("common.profile")}</button>}
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
              <p className="intro-kicker">ADVENT JOURNEY · 28 NOV — 25 DEC</p>
              <div className="echo-title-wrap">
                <EchoText text="起初的心" echoes={12} lag={0.24} offset={36} direction="right" fade={0.72} blur={3} tint="#e4ad50" echoStyle="solid" echoScale={1} mode="both" trail="pointer" clickBurst cursorRadius={320} duration={900} ease="ease-out" fontSize="clamp(3.1rem, 15vw, 9rem)" fontWeight={400} fontFamily='"Beginning Display","Noto Serif SC",serif' className="echo-title" />
              </div>
              <p className="intro-english">{campaign.englishTitle}</p>
            </div>
          </div>

          <div className="deck-scene checkin-scene" id="journey" aria-hidden={scene !== "checkin"} inert={scene !== "checkin" ? true : undefined}>
            <div className="ticket-page">
              <div className="ticket-grid" aria-label={t("campaign.ticketsLabel")}>
                {campaign.weeks.map((week, index) => {
                  const WeekIcon = weekIcons[index];
                  const isPublished = status.availableWeeks.includes(week.number);
                  const isOpen = status.openWeeks.includes(week.number);
                  const isComplete = completed.includes(week.number);
                  const videoUrl = status.videoUrls[String(week.number)];
                  const canWatch = isComplete && Boolean(videoUrl);
                  const buttonDisabled = isComplete ? !canWatch : !isOpen;
                  const buttonLabel = isComplete
                    ? canWatch ? <><Play size={15} fill="currentColor" /> {t("campaign.watchVideo")}</> : <><Check size={16} /> {t("campaign.checkedIn")}</>
                    : isOpen ? <>{t("campaign.checkInNow")} <ArrowRight size={15} /></>
                    : isPublished ? t("campaign.weekEnded") : t("campaign.notOpen");

                  return <article className={`ticket-card ${isComplete ? "is-complete" : ""} ${!isPublished ? "is-locked" : ""}`} key={week.number}>
                    <div className="ticket-stub" aria-hidden="true">
                      <span>{t("campaign.day")}</span>
                      <strong>0{week.number}</strong>
                      <WeekIcon />
                    </div>
                    <div className="ticket-body">
                      <div className="ticket-date"><span>{isPublished ? `${t("campaign.week")} 0${week.number}` : t("campaign.opens")}</span><strong>{week.date}</strong></div>
                      {isPublished ? <><p>{t(`week.${week.number}.eyebrow` as TranslationKey)}</p><h2>{t(`week.${week.number}.title` as TranslationKey)}</h2></> : <><p>ADVENT CHECK-IN</p><h2>{t("campaign.waiting")}</h2></>}
                      <button type="button" disabled={buttonDisabled} onClick={() => isComplete ? setPostCheckin({ week: week.number, stage: "video" }) : checkIn(week.number)}>{buttonLabel}</button>
                      {message && isOpen && !isComplete && <small className="ticket-message">{message}</small>}
                    </div>
                    {isComplete && <span className="ticket-stamp"><Check size={18} /> CHECKED</span>}
                  </article>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {modal && <LoginModal participant={status.participant} onClose={() => { setModal(false); setPendingCheckinWeek(null); }} onDone={finishRegistration} />}
      {postCheckin && <PostCheckinModal week={campaign.weeks.find((week) => week.number === postCheckin.week)!} videoUrl={status.videoUrls[String(postCheckin.week)]} stage={postCheckin.stage} onWatch={() => setPostCheckin((current) => current ? { ...current, stage: "video" } : null)} onClose={() => setPostCheckin(null)} />}
      {loading && <div className="loading-screen"><Heart fill="currentColor" /></div>}
    </main>
  );
}

function PostCheckinModal({ week, videoUrl, stage, onWatch, onClose }: { week: (typeof campaign.weeks)[number]; videoUrl?: string; stage: "success" | "video"; onWatch: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const weekTitle = t(`week.${week.number}.title` as TranslationKey);

  if (stage === "video" && videoUrl) return <div className="modal-backdrop" onMouseDown={onClose}><div className="post-checkin-modal video-modal" role="dialog" aria-modal="true" aria-labelledby="optional-video-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label={t("common.close")}>×</button><div className="video-modal-heading"><span>{t("video.optional", { week: week.number })}</span><h2 id="optional-video-title">{weekTitle}</h2><p>{t("video.description")}</p></div><div className="video-frame"><iframe src={videoUrl} title={t("video.frameTitle", { week: week.number })} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><button className="secondary-btn video-close-btn" onClick={onClose}>{t("video.back")}</button></div></div>;

  return <div className="modal-backdrop" onMouseDown={onClose}><div className="post-checkin-modal result-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-success-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label={t("common.close")}>×</button><span className="result-icon"><Check size={28} /></span><p className="section-kicker">CHECK-IN COMPLETE</p><h2 id="checkin-success-title">{t("result.title", { week: week.number })}</h2><p>{t("result.description")}</p><div className="result-actions">{videoUrl && <button className="primary-btn" onClick={onWatch}><Play size={16} fill="currentColor" /> {t("result.watch")}</button>}<button className="secondary-btn" onClick={onClose}>{videoUrl ? t("result.later") : t("result.done")}</button></div></div></div>;
}

function LoginModal({ participant, onClose, onDone }: { participant: Participant | null; onClose: () => void; onDone: () => void }) {
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
  async function logout() { await fetch("/api/session", { method: "DELETE" }); onDone(); }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="login-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><p className="section-kicker">{t("login.kicker")}</p><h2>{participant ? t("login.welcome", { name: participant.name }) : t("login.title")}</h2>{participant ? <><p>{t("login.progress", { count: participant.checkins.length })}</p><button className="secondary-btn" onClick={logout}>{t("login.logout")}</button></> : <form action={submit}><label>{t("login.name")}<input name="name" required minLength={2} placeholder={t("login.namePlaceholder")} /></label><label>{t("login.email")}<input name="email" required type="email" placeholder="name@example.com" /></label><label className="consent"><input name="reminders" type="checkbox" defaultChecked /><span>{t("login.reminders")}</span></label><button className="primary-btn" type="submit">{t("login.submit")} <ArrowRight size={17} /></button>{error && <p className="form-error">{error}</p>}<small>{t("login.disclaimerBefore")} <a href="/privacy" target="_blank" rel="noreferrer">{t("common.privacy")}</a>{t("login.disclaimerAfter")}</small></form>}</div></div>;
}
