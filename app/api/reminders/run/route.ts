import { and, eq, notExists } from "drizzle-orm";
import { getDb } from "@/db";
import { checkins, participants, reminderLogs } from "@/db/schema";
import { campaign } from "@/features/campaign/config";

// Brevo's free plan caps transactional email at 300/day. The reminder window
// spans three days, so capping each run (up to 900 total) lets the remaining
// recipients (already excluded via reminderLogs once sent) roll over to the
// next day's run.
const DAILY_EMAIL_LIMIT = 300;

function activeReminderWeek(now = new Date()) {
  for (const week of campaign.weeks) {
    const start = new Date(`${week.isoDate}T00:00:00+08:00`);
    const reminderDay = new Date(start.getTime() + 4 * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    if (now >= reminderDay && now < end) return week.number;
  }
  return null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function reminderDeadline(week: number) {
  const campaignWeek = campaign.weeks.find((item) => item.number === week);
  if (!campaignWeek) return null;
  return new Date(new Date(`${campaignWeek.isoDate}T00:00:00+08:00`).getTime() + 7 * 86400000 - 60000);
}

function reminderEmailHtml({ name, week, origin }: { name: string; week: number; origin: string }) {
  const safeName = escapeHtml(name);
  const deadline = reminderDeadline(week);
  const chineseDeadline = deadline?.toLocaleString("zh-MY", { timeZone: "Asia/Kuala_Lumpur", month: "long", day: "numeric", weekday: "long", hour: "numeric", minute: "2-digit", hour12: true });
  const englishDeadline = deadline?.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe7;padding:32px 16px;font-family:Arial,sans-serif">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fffaf4;border-radius:16px;overflow:hidden">
      <tr><td style="padding:32px 32px 20px;text-align:center">
        <img src="${origin}/church-logo.png" width="56" alt="" style="display:block;margin:0 auto 16px;border:0" />
        <p style="margin:0;color:#98613c;letter-spacing:2px;font-size:12px;font-weight:700">起初的光</p>
      </td></tr>
      <tr><td style="padding:0 32px">
        <h1 style="margin:0 0 16px;font-size:26px;color:#2f2a26;font-weight:700">${safeName}，记得完成第 ${week} 周打卡</h1>
        <p style="margin:0 0 6px;line-height:1.8;color:#2f2a26;font-size:15px">这是第 ${week} 周的打卡提醒。若你还没完成，可在本周结束前点击下方按钮打卡。</p>
        <p style="margin:0 0 18px;line-height:1.7;color:#7c7067;font-size:13px">This is a reminder that your week ${week} check-in is still pending.</p>
        ${deadline ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:#f6eee4;border-radius:12px"><tr><td style="padding:14px 16px;color:#5f5148;font-size:13px;line-height:1.7"><strong style="color:#2f2a26">截止时间</strong>　${chineseDeadline}<br /><strong style="color:#2f2a26">Deadline</strong>　${englishDeadline} MYT</td></tr></table>` : ""}
        <p style="margin:0 0 32px"><a href="${origin}" style="display:inline-block;background:#713d2f;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">前往打卡</a></p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #eadfd4;text-align:center">
        <p style="margin:0;color:#9a8e83;font-size:11px;line-height:1.7">起初的光<br />如需关闭提醒，请登录打卡页面后在个人资料中更改设置。<br />To turn off reminders, update the setting in your profile.</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export async function POST(request: Request) {
  const runtime = process.env;
  const cronSecret = runtime.CRON_SECRET || runtime.REMINDER_CRON_SECRET;
  const authorized = Boolean(cronSecret) && (
    request.headers.get("authorization") === `Bearer ${cronSecret}` ||
    request.headers.get("x-reminder-key") === cronSecret
  );
  if (!authorized) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!runtime.BREVO_API_KEY || !runtime.REMINDER_FROM) return Response.json({ error: "Email service is not configured" }, { status: 503 });
  const fromMatch = runtime.REMINDER_FROM.match(/^(.*?)\s*<(.+)>$/);
  const sender = fromMatch ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() } : { email: runtime.REMINDER_FROM };
  const week = activeReminderWeek();
  if (!week) return Response.json({ ok: true, sent: 0, note: "No reminder window is active" });
  const db = getDb();
  const eligible = await db.select().from(participants).where(and(eq(participants.remindersEnabled, true), notExists(db.select().from(checkins).where(and(eq(checkins.participantId, participants.id), eq(checkins.week, week)))), notExists(db.select().from(reminderLogs).where(and(eq(reminderLogs.participantId, participants.id), eq(reminderLogs.week, week))))));
  const recipients = eligible.slice(0, DAILY_EMAIL_LIMIT);
  const origin = new URL(request.url).origin;
  let sent = 0;
  for (const person of recipients) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": runtime.BREVO_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ sender, to: [{ email: person.email, name: person.name }], subject: `【起初的光】第 ${week} 周打卡提醒`, htmlContent: reminderEmailHtml({ name: person.name, week, origin }) }) });
    const status = response.ok ? "sent" : `failed:${response.status}`;
    await db.insert(reminderLogs).values({ participantId: person.id, week, status }).onConflictDoNothing();
    if (response.ok) sent++;
  }
  return Response.json({ ok: true, week, sent, considered: recipients.length, remaining: eligible.length - recipients.length });
}

// Vercel Cron invokes routes with GET; keep POST for manual/local execution.
export const GET = POST;
