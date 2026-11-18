"use client";

import "./admin.css";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Plus, Trash2, UserCog } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitch, useI18n } from "@/components/i18n-provider";

type AdminRow = { email: string; displayName: string | null; role: string; createdAt: string };

export function AdminManage({ initialAdmins, currentEmail }: { initialAdmins: AdminRow[]; currentEmail: string }) {
  const { t, tError, locale } = useI18n();
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
    if (!res.ok) { setError(tError(data.error, "adminManage.genericError")); return; }
    setEmail(""); setPassword(""); setDisplayName(""); setRole("admin"); setShowForm(false);
    await refresh();
  }

  async function handleDelete(target: string) {
    if (!window.confirm(t("adminManage.confirmDelete", { email: target }))) return;
    setDeleting(target);
    const res = await fetch(`/api/admin/admins/${encodeURIComponent(target)}`, { method: "DELETE" });
    const data = await res.json() as { error?: string };
    setDeleting(null);
    if (!res.ok) { alert(tError(data.error, "adminManage.deleteError")); return; }
    await refresh();
  }

  return (
    <main className="admin-shell">
      <header className="admin-top admin-manage-top">
        <Link className="admin-manage-back" href="/admin" aria-label={t("adminManage.back")} title={t("adminManage.back")}><ArrowLeft size={17} /></Link>
        <div className="admin-manage-heading">
          <p>{t("adminManage.kicker")}</p>
          <h1>{t("adminManage.title")}</h1>
        </div>
        <div className="admin-manage-language"><LanguageSwitch className="admin-language-switch" /></div>
      </header>

      <section className="admin-table-card admin-manage-card">
        <div className="admin-manage-card-header">
          <div className="admin-manage-card-title">
            <span className="admin-manage-card-icon"><UserCog size={19} /></span>
            <div>
            <h2>{t("adminManage.listTitle")}</h2>
            <p>{t("adminManage.listDescription")}</p>
            </div>
          </div>
          <Button className="admin-add-button" type="button" aria-expanded={showForm} onClick={() => setShowForm((v) => !v)}><Plus size={15} /> {t("adminManage.add")}</Button>
        </div>

        {showForm && (
          <form className="admin-create-form" onSubmit={handleAdd}>
            <div className="admin-form-field">
              <Label htmlFor="new-admin-email">{t("adminManage.email")}</Label>
              <Input id="new-admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <Label htmlFor="new-admin-password">{t("adminManage.password")}</Label>
              <Input id="new-admin-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <Label htmlFor="new-admin-name">{t("adminManage.displayName")}</Label>
              <Input id="new-admin-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="admin-form-field admin-role-field">
              <Label htmlFor="new-admin-role">{t("adminManage.role")}</Label>
              <select id="new-admin-role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "developer")}>
                <option value="admin">{t("adminManage.roleAdmin")}</option>
                <option value="developer">{t("adminManage.roleDeveloper")}</option>
              </select>
            </div>
            <Button className="admin-confirm-button" type="submit" disabled={loading}>{loading ? t("adminManage.adding") : t("adminManage.confirmAdd")}</Button>
          </form>
        )}
        {error && <p className="admin-form-error" role="alert">{error}</p>}

        <div className="table-scroll admin-manage-table-wrap">
          <table className="admin-manage-table">
            <thead>
              <tr><th>{t("adminManage.colEmail")}</th><th>{t("adminManage.colDisplayName")}</th><th>{t("adminManage.colRole")}</th><th>{t("adminManage.colCreatedAt")}</th><th></th></tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.email}>
                  <td><div className="admin-email-cell"><strong>{admin.email}</strong>{admin.email === currentEmail && <small>{t("adminManage.current")}</small>}</div></td>
                  <td>{admin.displayName || "—"}</td>
                  <td><span className={`admin-role-badge ${admin.role}`}>{admin.role === "developer" ? t("adminManage.roleDeveloperShort") : t("adminManage.roleAdminShort")}</span></td>
                  <td>{new Date(admin.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-MY")}</td>
                  <td>
                    <button className="admin-delete-button" type="button" onClick={() => handleDelete(admin.email)} disabled={admin.email === currentEmail || deleting === admin.email}>
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
