import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { vi } from "vitest";

function readUtcDayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function readTagValue(xmlText, tagName) {
  const match = String(xmlText || "").match(new RegExp(`<${tagName}>(.*?)</${tagName}>`));
  return match ? match[1] : "";
}

function readAtomSelfHref(xmlText) {
  const match = String(xmlText || "").match(/<atom:link href="([^"]+)" rel="self" type="application\/rss\+xml" \/>/);
  return match ? match[1] : "";
}

describe("Anime RSS feeds", () => {
  const originalCwd = process.cwd();
  const tempRoot = mkdtempSync(join(tmpdir(), "website-2025-api-rss-"));
  const tempApiDir = join(tempRoot, "api");
  mkdirSync(tempApiDir, { recursive: true });
  /** @type {typeof import("./app.impure.js")} */
  let appImpure;

  beforeAll(async () => {
    process.chdir(tempApiDir);
    const moduleUrl = new URL(`./app.impure.js?test=${Date.now()}`, import.meta.url);
    appImpure = await import(moduleUrl.href);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    try {
      rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      // Windows can briefly hold SQLite handles after the module test run.
    }
  });

  it("builds an empty tracked-show feed with deterministic channel metadata", () => {
    const feedRes = appImpure.buildSlackAnimeRssFeedXml("http://localhost:8081");

    expect(feedRes.err).toBeNull();
    expect(feedRes.value).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(feedRes.value).toContain("<language>en-us</language>");
    expect(feedRes.value).toContain("<ttl>60</ttl>");
    expect(feedRes.value).toContain("<docs>https://www.rssboard.org/rss-specification</docs>");
    expect(feedRes.value).toContain("<generator>website_2025 Anime Release Radar</generator>");
    expect(readAtomSelfHref(feedRes.value)).toBe("http://localhost:8081/api/slackanime/feed/tracked.xml");
    expect(readTagValue(feedRes.value, "lastBuildDate")).toBe("Thu, 01 Jan 1970 00:00:00 GMT");
  });

  it("builds a tracked-show feed with stable item and channel timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    appImpure.upsertTrackedAnime({
      anilistId: 101,
      title: "Orbital Beats",
      status: "RELEASING",
      episodes: 8,
      format: "TV",
      seasonYear: 2026,
      siteUrl: "https://anilist.co/anime/101"
    });
    vi.setSystemTime(new Date("2026-03-02T05:30:00.000Z"));
    appImpure.upsertTrackedAnime({
      anilistId: 202,
      title: "Signal Bloom",
      status: "FINISHED",
      episodes: 12,
      format: "TV",
      seasonYear: 2025,
      siteUrl: "https://anilist.co/anime/202"
    });

    const firstFeedRes = appImpure.buildSlackAnimeRssFeedXml("http://localhost:8081");
    const secondFeedRes = appImpure.buildSlackAnimeRssFeedXml("http://localhost:8081");
    vi.useRealTimers();

    expect(firstFeedRes.err).toBeNull();
    expect(secondFeedRes.err).toBeNull();
    expect(firstFeedRes.value).toBe(secondFeedRes.value);

    const xmlText = firstFeedRes.value;
    expect(xmlText).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xmlText).toContain("<language>en-us</language>");
    expect(xmlText).toContain("<ttl>60</ttl>");
    expect(xmlText).toContain("<docs>https://www.rssboard.org/rss-specification</docs>");
    expect(xmlText).toContain("<generator>website_2025 Anime Release Radar</generator>");
    expect(readAtomSelfHref(xmlText)).toBe("http://localhost:8081/api/slackanime/feed/tracked.xml");
    expect(xmlText).toContain("<title>Anime Release Radar - Tracked Releases</title>");
    expect(xmlText).toContain("<link>http://localhost:8081/slackanime</link>");
    expect(xmlText).toContain("<guid isPermaLink=\"false\">slackanime-tracked-101</guid>");
    expect(xmlText).toContain("<guid isPermaLink=\"false\">slackanime-tracked-202</guid>");
    expect(xmlText).toContain("<pubDate>Mon, 02 Mar 2026 05:30:00 GMT</pubDate>");
    expect(readTagValue(xmlText, "lastBuildDate")).toBe("Mon, 02 Mar 2026 05:30:00 GMT");
  });

  it("builds the daily-question feed with a stable day-based publication timestamp", async () => {
    const dayKey = readUtcDayKey();
    const cacheKey = `anime:question:day:${dayKey}`;
    const questionPayload = {
      dateKey: dayKey,
      question: "Which airing anime has the strongest pacing right now?",
      index: 3,
      source: "test"
    };

    appImpure.writeCache(cacheKey, questionPayload, 60_000);

    const firstFeedRes = await appImpure.buildSlackAnimeQuestionRssFeedXml("http://localhost:8081");
    const secondFeedRes = await appImpure.buildSlackAnimeQuestionRssFeedXml("http://localhost:8081");

    expect(firstFeedRes.err).toBeNull();
    expect(secondFeedRes.err).toBeNull();
    expect(firstFeedRes.value).toBe(secondFeedRes.value);

    const xmlText = firstFeedRes.value;
    const stableDayPubDate = new Date(`${dayKey}T00:00:00.000Z`).toUTCString();
    expect(xmlText).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xmlText).toContain("<language>en-us</language>");
    expect(xmlText).toContain("<ttl>60</ttl>");
    expect(xmlText).toContain("<docs>https://www.rssboard.org/rss-specification</docs>");
    expect(xmlText).toContain("<generator>website_2025 Anime Release Radar</generator>");
    expect(readAtomSelfHref(xmlText)).toBe("http://localhost:8081/api/slackanime/feed/questions.xml");
    expect(xmlText).toContain(`<guid isPermaLink="false">slackanime-question-${dayKey}</guid>`);
    expect(xmlText).toContain(`<pubDate>${stableDayPubDate}</pubDate>`);
    expect(readTagValue(xmlText, "lastBuildDate")).toBe(stableDayPubDate);
    expect(xmlText).toContain("<title>Anime Release Radar - Daily Prompts</title>");
    expect(xmlText).toContain("<link>http://localhost:8081/slackanime</link>");
  });
});
