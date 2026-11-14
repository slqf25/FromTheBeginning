export const campaign = {
  title: "起初的心",
  englishTitle: "THE HEART WE HAD AT THE BEGINNING",
  shortEnglishTitle: "FROM THE BEGINNING",
  launchDate: "28.11.2026",
  weeks: [
    { number: 1, date: "29.11", isoDate: "2026-11-29", title: "回到起初", eyebrow: "记得那份单纯的相信", verse: "我们爱，因为神先爱我们。", reference: "约翰一书 4:19", tone: "amber" },
    { number: 2, date: "06.12", isoDate: "2026-12-06", title: "重新聆听", eyebrow: "在安静中听见祂的声音", verse: "你们要休息，要知道我是神。", reference: "诗篇 46:10", tone: "sage" },
    { number: 3, date: "13.12", isoDate: "2026-12-13", title: "再次回应", eyebrow: "让爱成为今天的行动", verse: "我们相爱，不要只在言语和舌头上，总要在行为和诚实上。", reference: "约翰一书 3:18", tone: "wine" },
    { number: 4, date: "20.12", isoDate: "2026-12-20", title: "带着初心出发", eyebrow: "把领受的光带进人群", verse: "那光是真光，照亮一切生在世上的人。", reference: "约翰福音 1:9", tone: "night" },
  ],
} as const;

type CampaignRuntime = Record<string, string | undefined>;

function weekStart(isoDate: string) {
  return new Date(`${isoDate}T00:00:00+08:00`);
}

function previewWeek(runtime: CampaignRuntime) {
  const value = Number(runtime.CAMPAIGN_PREVIEW_WEEK);
  return Number.isInteger(value) && value >= 1 && value <= 4 ? value : null;
}

export function availableWeekNumbers(runtime: CampaignRuntime, now = new Date()) {
  const preview = previewWeek(runtime);

  return campaign.weeks
    .filter((week) => {
      if (preview !== null) return week.number <= preview;
      return now >= weekStart(week.isoDate);
    })
    .map((week) => week.number);
}

export function openWeekNumbers(runtime: CampaignRuntime, now = new Date()) {
  const preview = previewWeek(runtime);
  if (preview !== null) return [preview];

  return campaign.weeks
    .filter((week) => {
      const start = weekStart(week.isoDate);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return now >= start && now < end;
    })
    .map((week) => week.number);
}

export function youtubeEmbedUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (url.pathname.startsWith("/embed/")) return value;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return null;
}
