"use client";

import "./privacy-content.css";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";

export function PrivacyContent() {
  const { t } = useI18n();
  return (
    <main className="privacy-page">
      <div className="privacy-glow" aria-hidden="true" />
      <article className="privacy-document">
        <header className="privacy-header">
          <div className="privacy-header-top">
            <Link href="/" className="privacy-back">
              <ArrowLeft size={16} /> {t("privacy.back")}
            </Link>
            <LanguageSwitch className="privacy-language-switch" />
          </div>
          <span className="privacy-mark"><Heart size={18} fill="currentColor" /></span>
          <p>{t("privacy.kicker")}</p>
          <h1>{t("privacy.title")}</h1>
          <span>{t("privacy.updated")}</span>
        </header>

        <section>
          <h2>{t("privacy.s1.title")}</h2>
          <p>{t("privacy.s1.p1")}</p>
        </section>

        <section>
          <h2>{t("privacy.s2.title")}</h2>
          <ul>
            <li>{t("privacy.s2.i1")}</li>
            <li>{t("privacy.s2.i2")}</li>
            <li>{t("privacy.s2.i3")}</li>
            <li>{t("privacy.s2.i4")}</li>
          </ul>
          <p>{t("privacy.s2.p1")}</p>
        </section>

        <section>
          <h2>{t("privacy.s3.title")}</h2>
          <ul>
            <li>{t("privacy.s3.i1")}</li>
            <li>{t("privacy.s3.i2")}</li>
            <li>{t("privacy.s3.i3")}</li>
            <li>{t("privacy.s3.i4")}</li>
          </ul>
          <p>{t("privacy.s3.p1")}</p>
        </section>

        <section>
          <h2>{t("privacy.s4.title")}</h2>
          <p>{t("privacy.s4.p1")}</p>
          <p>{t("privacy.s4.p2")}</p>
        </section>

        <section>
          <h2>{t("privacy.s5.title")}</h2>
          <p>{t("privacy.s5.p1")}</p>
        </section>

        <section>
          <h2>{t("privacy.s6.title")}</h2>
          <p>{t("privacy.s6.p1")}</p>
        </section>

        <section>
          <h2>{t("privacy.s7.title")}</h2>
          <p>{t("privacy.s7.p1")}</p>
          <p>{t("privacy.s7.p2")}</p>
        </section>

        <section>
          <h2>{t("privacy.s8.title")}</h2>
          <p>{t("privacy.s8.p1")}</p>
        </section>

        <footer className="privacy-footer">
          <span className="brand"><span className="brand-mark"><Heart size={14} fill="currentColor" /></span>{t("common.brand")}</span>
          <Link href="/">{t("common.backHome")}</Link>
        </footer>
      </article>
    </main>
  );
}
