export type VideoVisibilityState = {
  completedWeeks: number[];
  currentWeek: number | null;
  videoUrls: Record<string, string>;
};

export function isVideoAccessOpen({ completedWeeks, currentWeek }: VideoVisibilityState) {
  return currentWeek === null || completedWeeks.includes(currentWeek);
}

export function resolveActiveVideoWeek(state: VideoVisibilityState, currentActiveWeek: number | null) {
  const { completedWeeks, currentWeek, videoUrls } = state;

  if (currentWeek !== null) {
    if (!completedWeeks.includes(currentWeek)) return null;
    return videoUrls[String(currentWeek)] ? currentWeek : null;
  }

  if (currentActiveWeek !== null && completedWeeks.includes(currentActiveWeek) && videoUrls[String(currentActiveWeek)]) {
    return currentActiveWeek;
  }

  return [...completedWeeks]
    .sort((a, b) => b - a)
    .find((week) => Boolean(videoUrls[String(week)])) ?? null;
}
