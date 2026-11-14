"use client";

import "./admin.css";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";

type AdminRow = { email: string; displayName: string | null; role: string; createdAt: string };

export function AdminManage({ initialAdmins, currentEmail }: { initialAdmins: AdminRow[]; currentEmail: string }) {
  const { t, locale } = useI18n();
  const [admins, setAdmins] = useState(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "developer">("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/admins");
    if (res.ok) setAdmins((await res.json()).admins);
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, displayName, role }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error || t("adminManage.genericError")); return; }
    setEmail(""); setPassword(""); setDisplayName(""); setRole("admin"); setShowForm(false);
    await refresh();
  }

  async function handleDelete(target: string) {
    if (!window.confirm(t("adminManage.confirmDelete", { email: target }))) return;
    setDeleting(target);
    const res = await fetch(`/api/admin/admins/${encodeURIComponent(target)}`, { method: "DELETE" });
    const data = await res.json() as { error?: string };
    setDeleting(null);
    if (!res.ok) { alert(data.error || t("adminManage.deleteError")); return; }
    await refresh();
  }

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div>
          <Link href="/admin"><ArrowLeft size={15} /> {t("adminManage.back")}</Link>
          <p>{t("adminManage.kicker")}</p>
          <h1>{t("adminManage.title")}</h1>
        </div>
        <LanguageSwitch className="admin-language-switch" />
      </header>

      <section className="admin-table-card">
        <div className="table-tools">
          <div>
            <h2>{t("adminManage.listTitle")}</h2>
            <p>{t("adminManage.listDescription")}</p>
          </div>
          <div className="tool-actions">
            <Button type="button" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> {t("adminManage.add")}</Button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", padding: "16px 0", borderBottom: "1px solid #e8ddce" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label htmlFor="new-admin-email">{t("adminManage.email")}</Label>
              <Input id="new-admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label htmlFor="new-admin-password">{t("adminManage.password")}</Label>
              <Input id="new-admin-password" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label htmlFor="new-admin-name">{t("adminManage.displayName")}</Label>
              <Input id="new-admin-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Label htmlFor="new-admin-role">{t("adminManage.role")}</Label>
              <select id="new-admin-role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "developer")} style={{ height: 36, borderRadius: 6, border: "1px solid #d8cdbd", padding: "0 8px" }}>
                <option value="admin">{t("adminManage.roleAdmin")}</option>
                <option value="developer">{t("adminManage.roleDeveloper")}</option>
              </select>
            </div>
            <Button type="submit" disabled={loading}>{loading ? t("adminManage.adding") : t("adminManage.confirmAdd")}</Button>
          </form>
        )}
        {error && <p style={{ color: "#b3261e", fontSize: 13, padding: "8px 0" }}>{error}</p>}

        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>{t("adminManage.colEmail")}</th><th>{t("adminManage.colDisplayName")}</th><th>{t("adminManage.colRole")}</th><th>{t("adminManage.colCreatedAt")}</th><th></th></tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.email}>
                  <td>{admin.email}{admin.email === currentEmail && <small> {t("adminManage.current")}</small>}</td>
                  <td>{admin.displayName || "—"}</td>
                  <td>{admin.role === "developer" ? t("adminManage.roleDeveloperShort") : t("adminManage.roleAdminShort")}</td>
                  <td>{new Date(admin.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</td>
                  <td>
                    <button onClick={() => handleDelete(admin.email)} disabled={admin.email === currentEmail || deleting === admin.email} style={{ display: "flex", alignItems: "center", gap: 4, color: admin.email === currentEmail ? "#bbb" : "#b3261e", fontSize: 12 }}>
                      <Trash2 size={13} /> {deleting === admin.email ? t("adminManage.deleting") : t("adminManage.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
