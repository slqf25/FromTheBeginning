// One-off script to send a sample reminder email via Brevo, for checking it in a real inbox.
// Usage: node scripts/send-test-email.mjs <to-email> [week] [name]
process.loadEnvFile(new URL("../.env.local", import.meta.url));

const [, , to, weekArg, nameArg] = process.argv;
if (!to) {
  console.error('Usage: node scripts/send-test-email.mjs <to-email> [week] ["Name"]');
  process.exit(1);
}
const week = Number(weekArg) || 1;
const name = nameArg || "测试用户";

const apiKey = process.env.BREVO_API_KEY?.trim();
const from = process.env.REMINDER_FROM?.trim();
if (!apiKey || !from) {
  console.error("Missing BREVO_API_KEY or REMINDER_FROM in .env.local");
  process.exit(1);
}
const fromMatch = from.match(/^(.*?)\s*<(.+)>$/);
const sender = fromMatch ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() } : { email: from };

const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:1224";

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function reminderEmailHtml({ name, week, origin }) {
  const safeName = escapeHtml(name);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe7;padding:32px 16px;font-family:Arial,sans-serif">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fffaf4;border-radius:16px;overflow:hidden">
      <tr><td style="padding:32px 32px 20px;text-align:center">
        <img src="${origin}/church-logo.png" width="56" alt="" style="display:block;margin:0 auto 16px;border:0" />
        <p style="margin:0;color:#98613c;letter-spacing:2px;font-size:12px;font-weight:700">起初的光</p>
      </td></tr>
      <tr><td style="padding:0 32px">
        <h1 style="margin:0 0 16px;font-size:26px;color:#2f2a26;font-weight:700">${safeName}，这一周还在等你</h1>
        <p style="margin:0 0 6px;line-height:1.8;color:#2f2a26;font-size:15px">在期限结束前，回来观看第 ${week} 周的影片并留下你的打卡吧。愿你在忙碌里，也能为心留一个位置。</p>
        <p style="margin:0 0 24px;line-height:1.7;color:#7c7067;font-size:13px;font-style:italic">Before the deadline, come back to watch week ${week}'s video and check in. May you keep a place for your heart, even in the busyness.</p>
        <p style="margin:0 0 32px"><a href="${origin}" style="display:inline-block;background:#713d2f;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">回到打卡旅程</a></p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #eadfd4;text-align:center">
        <p style="margin:0 0 8px;color:#9a8e83;font-size:11px;line-height:1.7">起初的光 · 将临期旅程<br />若不想再收到此提醒，请联系活动同工协助取消。</p>
        <p style="margin:0;color:#9a8e83;font-size:11px;line-height:1.7">Light from the Beginning · Advent Journey<br />To stop these reminders, please contact the event team.</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

const res = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: { "api-key": apiKey, "content-type": "application/json" },
  body: JSON.stringify({
    sender,
    to: [{ email: to }],
    subject: `起初的光｜第 ${week} 周还在等你`,
    htmlContent: reminderEmailHtml({ name, week, origin }),
  }),
});

console.log(res.status, await res.text());
