import assert from "node:assert/strict";
import test from "node:test";
import { availableWeekNumbers, nextCampaignTransition, openWeekNumbers } from "./config";
import { isVideoAccessOpen, resolveActiveVideoWeek } from "./video-visibility";

const production = { NODE_ENV: "production" };
const videos = { "1": "week-1", "2": "week-2", "3": "week-3", "4": "week-4" };

test("campaign weeks switch at Malaysia midnight on each Sunday", () => {
  assert.deepEqual(openWeekNumbers(production, new Date("2026-11-28T15:59:59Z")), []);
  assert.deepEqual(openWeekNumbers(production, new Date("2026-11-28T16:00:00Z")), [1]);
  assert.deepEqual(openWeekNumbers(production, new Date("2026-12-05T16:00:00Z")), [2]);
  assert.deepEqual(availableWeekNumbers(production, new Date("2026-12-05T16:00:00Z")), [1, 2]);
  assert.equal(nextCampaignTransition(production, new Date("2026-12-05T15:59:59Z")), "2026-12-05T16:00:00.000Z");
});

test("an incomplete current week hides every video", () => {
  const state = { completedWeeks: [1], currentWeek: 2, videoUrls: videos };
  assert.equal(isVideoAccessOpen(state), false);
  assert.equal(resolveActiveVideoWeek(state, 1), null);
});

test("finishing the current week opens its video", () => {
  const state = { completedWeeks: [1, 2], currentWeek: 2, videoUrls: videos };
  assert.equal(isVideoAccessOpen(state), true);
  assert.equal(resolveActiveVideoWeek(state, null), 2);
});

test("test mode can keep the latest completed video visible", () => {
  const state = { completedWeeks: [1, 2, 3], currentWeek: null, videoUrls: videos };
  assert.equal(isVideoAccessOpen(state), true);
  assert.equal(resolveActiveVideoWeek(state, null), 3);
  assert.equal(resolveActiveVideoWeek(state, 1), 1);
});

test("week four completion opens week four video", () => {
  const state = { completedWeeks: [1, 2, 3, 4], currentWeek: 4, videoUrls: videos };
  assert.equal(resolveActiveVideoWeek(state, null), 4);
});
