"use client";

import "@/features/admin/components/admin.css";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json() as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error || t("adminLogin.genericError"));
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin-denied">
      <LanguageSwitch className="admin-language-switch" style={{ position: "absolute", top: 20, right: 20 }} />
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, width: "min(100%, 320px)", textAlign: "left" }}>
        <h1 style={{ textAlign: "center", marginBottom: 8 }}>{t("adminLogin.title")}</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label htmlFor="admin-email">{t("adminLogin.email")}</Label>
          <Input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label htmlFor="admin-password">{t("adminLogin.password")}</Label>
          <Input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? t("adminLogin.submitting") : t("adminLogin.submit")}</Button>
      </form>
    </main>
  );
}
