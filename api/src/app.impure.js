import Database from "better-sqlite3";
import OpenAI from "openai";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const DATA_DIR = "data";
const DB_FILE = "app.db";
const LOGS_DIR = "logs";
const WEB_PUBLIC_DIR = "../web/public";
const UPLOADS_DIR = "uploads";
const API_LOG_FILE = "api.log";
const LOG_LEVEL_INFO = "info";
const LOG_EVENT_CACHE_HIT = "cache_hit";
const CACHE_KEY_PROMPTS_LATEST = "prompts:list:latest";
const CACHE_PREFIX_PROMPTS = "prompts:";
const CACHE_PREFIX_AI_REPLY = "ai:reply:";
const CACHE_PREFIX_MOTD = "motd:";
const CACHE_PREFIX_BLOGS = "blogs:";
const CACHE_PREFIX_ANIME_SEARCH = "anime:search:";
const CACHE_PREFIX_ANIME_DAILY_QUESTION = "anime:question:day:";
const CACHE_KEY_BLOGS_LIST = "blogs:list:latest";
const CACHE_KEY_BLOGS_DASHBOARD = "blogs:dashboard:latest";
const SAMPLE_POST_PUBLISHED = 1;
const SAMPLE_POST_SUFFIX = "-sample";
const BLOG_VARIANT_DEFAULT = "blog";
const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    reply TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;
const SQLITE_BLOG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    variant TEXT NOT NULL DEFAULT 'blog',
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
const SQLITE_BLOG_CATEGORIES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS blog_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )
`;
const SQLITE_BLOG_TAGS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS blog_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )
`;
const SQLITE_BLOG_CATEGORY_MAP_SCHEMA = `
  CREATE TABLE IF NOT EXISTS blog_category_map (
    blog_id INTEGER NOT NULL UNIQUE,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (blog_id, category_id)
  )
`;
const SQLITE_BLOG_TAG_MAP_SCHEMA = `
  CREATE TABLE IF NOT EXISTS blog_tag_map (
    blog_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (blog_id, tag_id)
  )
`;
const SQLITE_BUDGET_PROFILE_CURRENT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS budget_profile_current (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    profile_json TEXT NOT NULL,
    saved_at_iso TEXT NOT NULL
  )
`;
const SQLITE_BUDGET_PROFILE_HISTORY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS budget_profile_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_json TEXT NOT NULL,
    saved_at_iso TEXT NOT NULL
  )
`;
const SQLITE_TRACKED_ANIME_SCHEMA = `
  CREATE TABLE IF NOT EXISTS tracked_anime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anilist_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    cover_image TEXT NOT NULL DEFAULT '',
    anime_status TEXT NOT NULL DEFAULT '',
    episodes INTEGER NOT NULL DEFAULT 0,
    anime_format TEXT NOT NULL DEFAULT '',
    season_year INTEGER NOT NULL DEFAULT 0,
    site_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
const SQL_INSERT_PROMPT = "INSERT INTO prompts (prompt, reply, created_at) VALUES (?, ?, ?)";
const SQL_SELECT_PROMPTS = "SELECT id, prompt, reply, created_at FROM prompts ORDER BY id DESC LIMIT 20";
const SQL_LIST_BLOGS = "SELECT id, title, slug, summary, content, variant, published, created_at, updated_at FROM blogs ORDER BY updated_at DESC LIMIT 100";
const SQL_GET_BLOG = "SELECT id, title, slug, summary, content, variant, published, created_at, updated_at FROM blogs WHERE id = ?";
const SQL_INSERT_BLOG = "INSERT INTO blogs (title, slug, summary, content, variant, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const SQL_UPDATE_BLOG = "UPDATE blogs SET title = ?, slug = ?, summary = ?, content = ?, variant = ?, published = ?, updated_at = ? WHERE id = ?";
const SQL_UPDATE_BLOG_PUBLISHED = "UPDATE blogs SET published = ?, updated_at = ? WHERE id = ?";
const SQL_DELETE_BLOG = "DELETE FROM blogs WHERE id = ?";
const SQL_COUNT_BLOGS = "SELECT COUNT(1) AS total FROM blogs";
const SQL_COUNT_PUBLISHED = "SELECT COUNT(1) AS total FROM blogs WHERE published = 1";
const SQL_LIST_BLOG_TITLES = "SELECT title FROM blogs";
const SQL_LIST_CATEGORIES = "SELECT id, name, created_at FROM blog_categories ORDER BY name ASC";
const SQL_INSERT_CATEGORY = "INSERT INTO blog_categories (name, created_at) VALUES (?, ?)";
const SQL_LIST_TAGS = "SELECT id, name, created_at FROM blog_tags ORDER BY name ASC";
const SQL_INSERT_TAG = "INSERT INTO blog_tags (name, created_at) VALUES (?, ?)";
const SQL_GET_TAG_BY_NAME = "SELECT id, name FROM blog_tags WHERE name = ?";
const SQL_DELETE_BLOG_TAG_MAP = "DELETE FROM blog_tag_map WHERE blog_id = ?";
const SQL_INSERT_BLOG_TAG_MAP = "INSERT OR IGNORE INTO blog_tag_map (blog_id, tag_id) VALUES (?, ?)";
const SQL_DELETE_BLOG_CATEGORY_MAP = "DELETE FROM blog_category_map WHERE blog_id = ?";
const SQL_INSERT_BLOG_CATEGORY_MAP = "INSERT OR REPLACE INTO blog_category_map (blog_id, category_id) VALUES (?, ?)";
const SQL_BLOG_CATEGORY_ROWS = `
  SELECT bcm.blog_id, bc.id AS category_id, bc.name AS category_name
  FROM blog_category_map bcm
  JOIN blog_categories bc ON bc.id = bcm.category_id
`;
const SQL_BLOG_TAG_ROWS = `
  SELECT btm.blog_id, bt.id AS tag_id, bt.name AS tag_name
  FROM blog_tag_map btm
  JOIN blog_tags bt ON bt.id = btm.tag_id
`;
const SQL_UPSERT_BUDGET_PROFILE_CURRENT = "INSERT INTO budget_profile_current (id, profile_json, saved_at_iso) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET profile_json = excluded.profile_json, saved_at_iso = excluded.saved_at_iso";
const SQL_INSERT_BUDGET_PROFILE_HISTORY = "INSERT INTO budget_profile_history (profile_json, saved_at_iso) VALUES (?, ?)";
const SQL_GET_BUDGET_PROFILE_CURRENT = "SELECT profile_json, saved_at_iso FROM budget_profile_current WHERE id = 1";
const SQL_LIST_TRACKED_ANIME = "SELECT id, anilist_id, title, cover_image, anime_status, episodes, anime_format, season_year, site_url, created_at, updated_at FROM tracked_anime ORDER BY updated_at DESC, id DESC LIMIT 300";
const SQL_UPSERT_TRACKED_ANIME = "INSERT INTO tracked_anime (anilist_id, title, cover_image, anime_status, episodes, anime_format, season_year, site_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(anilist_id) DO UPDATE SET title = excluded.title, cover_image = excluded.cover_image, anime_status = excluded.anime_status, episodes = excluded.episodes, anime_format = excluded.anime_format, season_year = excluded.season_year, site_url = excluded.site_url, updated_at = excluded.updated_at";
const SQL_DELETE_TRACKED_ANIME_BY_ANILIST_ID = "DELETE FROM tracked_anime WHERE anilist_id = ?";
const ERR_BUDGET_PROFILE_JSON_REQUIRED = "Budget profile json is required";
const ERR_ANIME_QUERY_REQUIRED = "Anime search query is required";
const ERR_ANILIST_ID_REQUIRED = "AniList id is required";
const ERR_SLACKANIME_FEED_BASE_URL_REQUIRED = "SlackAnime feed base URL is required";
const LOG_EVENT_ANIME_CACHE_HIT_HOT = "anime_cache_hit_hot";
const LOG_EVENT_ANIME_CACHE_HIT_STALE = "anime_cache_hit_stale";
const LOG_EVENT_ANIME_CACHE_REFRESH_START = "anime_cache_refresh_start";
const LOG_EVENT_ANIME_CACHE_REFRESH_SUCCESS = "anime_cache_refresh_success";
const LOG_EVENT_ANIME_CACHE_REFRESH_ERROR = "anime_cache_refresh_error";
const LOG_EVENT_ANIME_CACHE_INFLIGHT_WAIT = "anime_cache_inflight_wait";
const PATH_SLACKANIME_PAGE = "/slackanime";
const RSS_DATE_FALLBACK = "date unavailable";
const RSS_FEED_TITLE_TRACKED = "SlackAnime Tracked Releases Feed";
const RSS_FEED_DESC_TRACKED = "Tracked anime updates and status snapshots.";
const RSS_FEED_TITLE_QUESTION = "SlackAnime Daily Questions Feed";
const RSS_FEED_DESC_QUESTION = "Daily anime discussion prompt feed.";
const RSS_GUID_PREFIX_TRACKED = "slackanime-tracked-";
const RSS_GUID_PREFIX_QUESTION = "slackanime-question-";
const RSS_GUID_PREFIX_DEBUG = "slackanime-debug-";
const RSS_DEBUG_TITLE = "Debug Message";
const ANILIST_API_URL = "https://graphql.anilist.co";
const ANILIST_GRAPHQL_QUERY = "query ($search: String) { Page(page: 1, perPage: 12) { media(search: $search, type: ANIME, sort: [POPULARITY_DESC, START_DATE_DESC]) { id title { romaji english native } coverImage { large medium } status episodes format seasonYear siteUrl } } }";
const defaultAnimeSearchCacheTtlMs = 1_800_000;
const defaultAnimeSearchStaleTtlMs = 86_400_000;
const defaultAnimeQuestionCacheTtlMs = 3_600_000;
const ANIME_QUESTION_MAX_LEN = 220;
const DAILY_ANIME_QUESTIONS = [
  "What currently airing anime has the strongest world-building this season?",
  "Which anime character had the best growth arc this year?",
  "What opening theme are you replaying most this week?",
  "Which anime deserves a sequel right now?",
  "What anime episode had the best pacing recently?",
  "Which studio has the strongest lineup this season?",
  "What under-watched anime should more people pick up?",
  "Which fight scene had the best choreography lately?",
  "What anime side character stole the show for you?",
  "Which genre twist in anime surprised you most recently?",
  "What anime has the strongest emotional payoff right now?",
  "Which anime adaptation improved on its source material?",
  "What anime ending song has been your favorite this month?",
  "Which anime has the most interesting power system currently?",
  "What anime recommendation would you give a non-anime watcher?",
  "Which anime handled tension and suspense the best lately?",
  "What anime character would make the best mentor and why?",
  "Which anime episode had the most rewatch value this season?",
  "What anime soundtrack has been the most memorable recently?",
  "Which anime has the best balance of action and story right now?",
  "What anime romance subplot actually works for you?",
  "Which anime protagonist feels the most grounded and believable?",
  "What anime has the strongest art direction this season?",
  "Which anime reveal or twist landed perfectly for you?",
  "What anime world would you most want to explore for a day?",
  "Which anime had the cleanest first episode hook recently?",
  "What anime deserves more discussion in your community?",
  "Which anime antagonist is the most compelling this year?",
  "What anime scene made you pause and think the longest?",
  "Which anime has the best long-term story potential right now?"
];
const OPENAI_MODEL = "gpt-5-nano-2025-08-07";
const OPENAI_KEY_ENV = "OPENAI_API_KEY";
const ERR_EMPTY_OUTPUT = "Model returned empty output";
const EMPTY_REPLY = "";
const LOG_ENCODING = "utf8";
const LOG_ENTRY_SEPARATOR = "\n";
const maxLogBytes = 1_000_000;
const maxLogFiles = 5;
const defaultPromptsCacheTtlMs = 15000;
const defaultAiReplyCacheTtlMs = 300000;
const motdCacheTtlMs = 86_400_000;
const MOTD_PROMPT_PREFIX = "Generate one short inspiring quote for software engineers. Keep it under 22 words. No markdown. No attribution line. Date key:";
const ANIME_DAILY_QUESTION_PROMPT_PREFIX = "Generate one fun, concise anime community question for engagement.";
const ANIME_DAILY_QUESTION_PROMPT_SUFFIX = "Return one line only, no numbering, no markdown, no emoji.";
const SAMPLE_BLOG_POSTS = [
  {
    title: "Designing for Failure First",
    summary: "How to surface failure modes before they become outages.",
    content: "Production reliability starts with failure-mode mapping. Write the recovery path before the feature path.\n\n```js\nconst recover = (state) => state?.fallback ?? \"safe\";\n```\n\nShip the rollback plan with the feature.",
    category: "systems",
    tags: ["reliability", "operations", "architecture"]
  },
  {
    title: "Constraint-Driven API Design",
    summary: "A practical approach to API boundaries under real latency and ownership limits.",
    content: "Good APIs are shaped by constraints, not opinions.\n\n- Who owns schema changes?\n- What does backward compatibility cost?\n- What is the max acceptable p95?\n\n```ts\ntype ApiResult<T> = { value: T | null; err: string | null };\n```",
    category: "backend",
    tags: ["api", "latency", "design"]
  },
  {
    title: "Go Service Warm-Path Profiling",
    summary: "Measure startup and request hot paths before optimization.",
    content: "Optimization starts with measurement.\n\n```go\nfunc handler(w http.ResponseWriter, r *http.Request) {\n  start := time.Now()\n  defer func() { log.Println(\"latency_ms\", time.Since(start).Milliseconds()) }()\n  w.WriteHeader(http.StatusOK)\n}\n```",
    category: "performance",
    tags: ["go", "profiling", "observability"]
  },
  {
    title: "Code Review Rubric for Senior Teams",
    summary: "A lightweight review checklist that catches regressions early.",
    content: "A fast review still needs structure.\n\n1. Behavior correctness\n2. Failure handling\n3. Operability and logs\n4. Test gaps\n\nUse severity labels so discussion stays objective.",
    category: "engineering",
    tags: ["code-review", "quality", "teamwork"]
  },
  {
    title: "Java Integration Boundaries",
    summary: "How to isolate legacy adapters from core domain logic.",
    content: "Keep adapters boring and core logic deterministic.\n\n```java\npublic record PaymentResult(String id, String status) {}\n```\n\nIntegration boundaries should be obvious in the directory layout.",
    category: "backend",
    tags: ["java", "legacy", "architecture"]
  },
  {
    title: "C# Service Health Model",
    summary: "Health endpoints should reflect dependencies, not just process liveness.",
    content: "A process can be alive and still unable to serve traffic.\n\n```csharp\napp.MapGet(\"/health\", () => Results.Ok(new { status = \"ok\", db = \"ready\" }));\n```\n\nSeparate readiness from liveness checks.",
    category: "operations",
    tags: ["csharp", "healthchecks", "sre"]
  },
  {
    title: "CSS Systems for Internal Tools",
    summary: "Small design tokens create consistency without a huge design system.",
    content: "Internal tools benefit from consistency.\n\n```css\n:root {\n  --ink: #e7edf5;\n  --line: #2a3749;\n  --accent: #f4b942;\n}\n```\n\nPrefer tokens and utility classes over one-off styles.",
    category: "frontend",
    tags: ["css", "ui", "design-systems"]
  },
  {
    title: "Zig Notes from Building Zerver",
    summary: "What explicit memory and error handling changed in my web framework thinking.",
    content: "Zig forces intention. That pressure improves API design.\n\n```zig\npub fn main() !void {\n    std.debug.print(\"hello zerver\\n\", .{});\n}\n```\n\nExplicit control makes runtime behavior easier to reason about.",
    category: "systems",
    tags: ["zig", "zerver", "runtime"]
  },
  {
    title: "Incident Timeline Discipline",
    summary: "How structured incident timelines reduce mean time to resolution.",
    content: "Write a timeline in UTC with one source of truth.\n\n- Detection timestamp\n- Mitigation timestamp\n- Resolution timestamp\n\nTimeline quality strongly affects postmortem quality.",
    category: "operations",
    tags: ["incident-response", "postmortem", "oncall"]
  },
  {
    title: "Building AI Features with Guardrails",
    summary: "Patterns for adding AI outputs to product workflows safely.",
    content: "AI output is a draft until validated.\n\n```js\nconst applyGuardrails = (text) => text.slice(0, 500).trim();\n```\n\nUse bounded prompts, schema validation, and clear fallback behavior.",
    category: "ai",
    tags: ["openai", "product", "safety"]
  }
];

const dbFile = resolve(process.cwd(), DATA_DIR, DB_FILE);
mkdirSync(dirname(dbFile), { recursive: true });
const db = new Database(dbFile);

const logsDir = resolve(process.cwd(), "..", LOGS_DIR);
mkdirSync(logsDir, { recursive: true });
const apiLogFile = join(logsDir, API_LOG_FILE);
const uploadsDir = resolve(process.cwd(), WEB_PUBLIC_DIR, UPLOADS_DIR);
mkdirSync(uploadsDir, { recursive: true });

db.exec(SQLITE_SCHEMA);
db.exec(SQLITE_BLOG_SCHEMA);
db.exec(SQLITE_BLOG_CATEGORIES_SCHEMA);
db.exec(SQLITE_BLOG_TAGS_SCHEMA);
db.exec(SQLITE_BLOG_CATEGORY_MAP_SCHEMA);
db.exec(SQLITE_BLOG_TAG_MAP_SCHEMA);
db.exec(SQLITE_BUDGET_PROFILE_CURRENT_SCHEMA);
db.exec(SQLITE_BUDGET_PROFILE_HISTORY_SCHEMA);
db.exec(SQLITE_TRACKED_ANIME_SCHEMA);
ensureBlogVariantColumn();

const openai = new OpenAI({ apiKey: process.env[OPENAI_KEY_ENV] });
const memoryCache = new Map();
const animeSearchStaleCache = new Map();
const animeSearchInflight = new Map();
const sampleSeedRes = ensureSampleBlogs();
if (sampleSeedRes.err) {
  console.error("[seed_samples_failed]", sampleSeedRes.err.message);
}

/**
 * @param {string} prompt
 * @returns {Result<{id: number}>}
 */
export function savePromptOnly(prompt) {
  const stmt = db.prepare(SQL_INSERT_PROMPT);
  const info = stmt.run(prompt, EMPTY_REPLY, new Date().toISOString());
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_PROMPTS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { id: Number(info.lastInsertRowid) }, err: null };
}

/**
 * @param {number} [ttlMs]
 * @returns {Result<Array<{id: number, prompt: string, reply: string, created_at: string}>>}
 */
export function listPromptsCached(ttlMs = defaultPromptsCacheTtlMs) {
  const cacheRes = readCache(CACHE_KEY_PROMPTS_LATEST);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }

  if (cacheRes.value) {
    const logRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_CACHE_HIT, { cacheKey: CACHE_KEY_PROMPTS_LATEST });
    if (logRes.err) {
      return { value: null, err: logRes.err };
    }
    return { value: cacheRes.value, err: null };
  }

  const rowsRes = listPrompts();
  if (rowsRes.err) {
    return { value: null, err: rowsRes.err };
  }

  const writeRes = writeCache(CACHE_KEY_PROMPTS_LATEST, rowsRes.value, ttlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: rowsRes.value, err: null };
}

/**
 * @param {string} modelPrompt
 * @param {number} [ttlMs]
 * @returns {Promise<Result<string>>}
 */
export async function generateReplyCached(modelPrompt, ttlMs = defaultAiReplyCacheTtlMs) {
  const cacheKey = `${CACHE_PREFIX_AI_REPLY}${modelPrompt}`;
  const cacheRes = readCache(cacheKey);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }

  if (cacheRes.value) {
    const logRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_CACHE_HIT, { cacheKey });
    if (logRes.err) {
      return { value: null, err: logRes.err };
    }
    return { value: cacheRes.value, err: null };
  }

  const replyRes = await generateReply(modelPrompt);
  if (replyRes.err) {
    return { value: null, err: replyRes.err };
  }

  const writeRes = writeCache(cacheKey, replyRes.value, ttlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: replyRes.value, err: null };
}

/**
 * @param {string} modelPrompt
 * @returns {Promise<Result<string>>}
 */
export async function generateReply(modelPrompt) {
  const completionRes = await fromPromise(
    openai.responses.create({ model: OPENAI_MODEL, input: modelPrompt })
  );

  if (completionRes.err) {
    return { value: null, err: completionRes.err };
  }

  const output = completionRes.value.output_text;
  if (!output) {
    return { value: null, err: new Error(ERR_EMPTY_OUTPUT) };
  }

  return { value: output, err: null };
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<Result<string>>}
 */
export async function getMessageOfDay(forceRefresh = false) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const cacheKey = `${CACHE_PREFIX_MOTD}${dateKey}`;
  if (!forceRefresh) {
    const cacheRes = readCache(cacheKey);
    if (cacheRes.err) {
      return { value: null, err: cacheRes.err };
    }

    if (cacheRes.value) {
      const logRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_CACHE_HIT, { cacheKey });
      if (logRes.err) {
        return { value: null, err: logRes.err };
      }
      return { value: cacheRes.value, err: null };
    }
  }

  const refreshSalt = forceRefresh ? ` refresh-seed:${Date.now()}` : "";
  const replyRes = await generateReply(`${MOTD_PROMPT_PREFIX} ${dateKey}${refreshSalt}`);
  if (replyRes.err) {
    return { value: null, err: replyRes.err };
  }

  const cleanQuote = String(replyRes.value).replace(/\s+/g, " ").trim();
  const writeRes = writeCache(cacheKey, cleanQuote, motdCacheTtlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: cleanQuote, err: null };
}

/**
 * @returns {Result<Array<{id: number, prompt: string, reply: string, created_at: string}>>}
 */
export function listPrompts() {
  const stmt = db.prepare(SQL_SELECT_PROMPTS);
  return { value: stmt.all(), err: null };
}

/**
 * @returns {Result<Array<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string}>>}
 */
export function listBlogs() {
  const rows = db.prepare(SQL_LIST_BLOGS).all();
  if (rows.length === 0) {
    return { value: [], err: null };
  }

  const blogIds = rows.map((r) => r.id);
  const placeholders = blogIds.map(() => "?").join(",");

  const categoryRows = db.prepare(`${SQL_BLOG_CATEGORY_ROWS} WHERE bcm.blog_id IN (${placeholders})`).all(...blogIds);
  const tagRows = db.prepare(`${SQL_BLOG_TAG_ROWS} WHERE btm.blog_id IN (${placeholders})`).all(...blogIds);
  const categoryMap = new Map();
  const tagMap = new Map();

  for (const row of categoryRows) {
    categoryMap.set(row.blog_id, { id: row.category_id, name: row.category_name });
  }
  for (const row of tagRows) {
    if (!tagMap.has(row.blog_id)) {
      tagMap.set(row.blog_id, []);
    }
    tagMap.get(row.blog_id).push({ id: row.tag_id, name: row.tag_name });
  }

  const merged = rows.map((row) => ({
    ...row,
    category: categoryMap.get(row.id) || null,
    tags: tagMap.get(row.id) || []
  }));
  return { value: merged, err: null };
}

/**
 * @param {number} [ttlMs]
 * @returns {Result<Array<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string}>>}
 */
export function listBlogsCached(ttlMs = defaultPromptsCacheTtlMs) {
  const cacheRes = readCache(CACHE_KEY_BLOGS_LIST);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }

  if (cacheRes.value) {
    return { value: cacheRes.value, err: null };
  }

  const blogsRes = listBlogs();
  if (blogsRes.err) {
    return { value: null, err: blogsRes.err };
  }

  const writeRes = writeCache(CACHE_KEY_BLOGS_LIST, blogsRes.value, ttlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: blogsRes.value, err: null };
}

/**
 * @param {number} id
 * @returns {Result<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string} | null>}
 */
export function getBlogById(id) {
  const row = db.prepare(SQL_GET_BLOG).get(id) || null;
  if (!row) {
    return { value: null, err: null };
  }
  const categoryRow = db.prepare(`${SQL_BLOG_CATEGORY_ROWS} WHERE bcm.blog_id = ?`).get(id) || null;
  const tagRows = db.prepare(`${SQL_BLOG_TAG_ROWS} WHERE btm.blog_id = ?`).all(id);
  return {
    value: {
      ...row,
      category: categoryRow ? { id: categoryRow.category_id, name: categoryRow.category_name } : null,
      tags: tagRows.map((tag) => ({ id: tag.tag_id, name: tag.tag_name }))
    },
    err: null
  };
}

/**
 * @param {number} id
 * @param {number} [ttlMs]
 * @returns {Result<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string} | null>}
 */
export function getBlogByIdCached(id, ttlMs = defaultPromptsCacheTtlMs) {
  const cacheKey = `${CACHE_PREFIX_BLOGS}id:${id}`;
  const cacheRes = readCache(cacheKey);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }

  if (cacheRes.value) {
    return { value: cacheRes.value, err: null };
  }

  const blogRes = getBlogById(id);
  if (blogRes.err) {
    return { value: null, err: blogRes.err };
  }

  const writeRes = writeCache(cacheKey, blogRes.value, ttlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: blogRes.value, err: null };
}

/**
 * @param {string} title
 * @returns {string}
 */
function toSlug(title) {
  const core = String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return core || `post-${Date.now()}`;
}

/**
 * @param {{title: string, summary: string, content: string, variant: string, published: number}} payload
 * @returns {Result<{id: number}>}
 */
export function createBlog(payload) {
  const now = new Date().toISOString();
  const slug = `${toSlug(payload.title)}-${Date.now()}`;
  const stmt = db.prepare(SQL_INSERT_BLOG);
  const info = stmt.run(payload.title, slug, payload.summary, payload.content, payload.variant || BLOG_VARIANT_DEFAULT, payload.published, now, now);
  const blogId = Number(info.lastInsertRowid);
  const mapRes = upsertBlogRelations(blogId, payload.categoryId, payload.tags);
  if (mapRes.err) {
    return { value: null, err: mapRes.err };
  }
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { id: blogId }, err: null };
}

/**
 * @param {number} id
 * @param {{title: string, summary: string, content: string, variant: string, published: number}} payload
 * @returns {Result<boolean>}
 */
export function updateBlog(id, payload) {
  const now = new Date().toISOString();
  const slug = `${toSlug(payload.title)}-${id}`;
  const stmt = db.prepare(SQL_UPDATE_BLOG);
  const info = stmt.run(payload.title, slug, payload.summary, payload.content, payload.variant || BLOG_VARIANT_DEFAULT, payload.published, now, id);
  if (info.changes === 0) {
    return { value: false, err: null };
  }
  const mapRes = upsertBlogRelations(id, payload.categoryId, payload.tags);
  if (mapRes.err) {
    return { value: null, err: mapRes.err };
  }
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: true, err: null };
}

/**
 * @param {number} id
 * @param {number} published
 * @returns {Result<boolean>}
 */
export function setBlogPublished(id, published) {
  const stmt = db.prepare(SQL_UPDATE_BLOG_PUBLISHED);
  const info = stmt.run(published ? 1 : 0, new Date().toISOString(), id);
  if (info.changes === 0) {
    return { value: false, err: null };
  }
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: true, err: null };
}

/**
 * @param {number} id
 * @returns {Result<boolean>}
 */
export function deleteBlog(id) {
  const info = db.prepare(SQL_DELETE_BLOG).run(id);
  if (info.changes === 0) {
    return { value: false, err: null };
  }
  db.prepare(SQL_DELETE_BLOG_TAG_MAP).run(id);
  db.prepare(SQL_DELETE_BLOG_CATEGORY_MAP).run(id);
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: true, err: null };
}

/**
 * @returns {Result<Array<{id: number, name: string, created_at: string}>>}
 */
export function listBlogCategories() {
  return { value: db.prepare(SQL_LIST_CATEGORIES).all(), err: null };
}

/**
 * @param {string} name
 * @returns {Result<{id: number}>}
 */
export function createBlogCategory(name) {
  const now = new Date().toISOString();
  const info = db.prepare(SQL_INSERT_CATEGORY).run(name, now);
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { id: Number(info.lastInsertRowid) }, err: null };
}

/**
 * @returns {Result<Array<{id: number, name: string, created_at: string}>>}
 */
export function listBlogTags() {
  return { value: db.prepare(SQL_LIST_TAGS).all(), err: null };
}

/**
 * @param {string} name
 * @returns {Result<{id: number}>}
 */
export function createBlogTag(name) {
  const now = new Date().toISOString();
  const info = db.prepare(SQL_INSERT_TAG).run(name, now);
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_BLOGS);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { id: Number(info.lastInsertRowid) }, err: null };
}

/**
 * @param {number} blogId
 * @param {number | null} categoryId
 * @param {Array<string>} tagNames
 * @returns {Result<boolean>}
 */
function upsertBlogRelations(blogId, categoryId, tagNames) {
  db.prepare(SQL_DELETE_BLOG_CATEGORY_MAP).run(blogId);
  if (categoryId) {
    db.prepare(SQL_INSERT_BLOG_CATEGORY_MAP).run(blogId, categoryId);
  }

  db.prepare(SQL_DELETE_BLOG_TAG_MAP).run(blogId);
  for (const rawName of tagNames || []) {
    const normalized = String(rawName).trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    const tagRow = db.prepare(SQL_GET_TAG_BY_NAME).get(normalized);
    let tagId = tagRow ? Number(tagRow.id) : null;
    if (!tagId) {
      const created = db.prepare(SQL_INSERT_TAG).run(normalized, new Date().toISOString());
      tagId = Number(created.lastInsertRowid);
    }
    db.prepare(SQL_INSERT_BLOG_TAG_MAP).run(blogId, tagId);
  }
  return { value: true, err: null };
}

/**
 * @returns {Result<{total: number, published: number, drafts: number}>}
 */
export function getBlogDashboard() {
  const totalRow = db.prepare(SQL_COUNT_BLOGS).get();
  const publishedRow = db.prepare(SQL_COUNT_PUBLISHED).get();
  const total = Number(totalRow.total || 0);
  const published = Number(publishedRow.total || 0);
  return { value: { total, published, drafts: total - published }, err: null };
}

/**
 * @param {number} [ttlMs]
 * @returns {Result<{total: number, published: number, drafts: number}>}
 */
export function getBlogDashboardCached(ttlMs = defaultPromptsCacheTtlMs) {
  const cacheRes = readCache(CACHE_KEY_BLOGS_DASHBOARD);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }

  if (cacheRes.value) {
    return { value: cacheRes.value, err: null };
  }

  const dashboardRes = getBlogDashboard();
  if (dashboardRes.err) {
    return { value: null, err: dashboardRes.err };
  }

  const writeRes = writeCache(CACHE_KEY_BLOGS_DASHBOARD, dashboardRes.value, ttlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }

  return { value: dashboardRes.value, err: null };
}

/**
 * @param {string} profileJsonText
 * @returns {Result<{savedAtIso: string}>}
 */
export function saveBudgetProfileJson(profileJsonText) {
  const normalized = typeof profileJsonText === "string" ? profileJsonText.trim() : "";
  if (!normalized) {
    return { value: null, err: new Error(ERR_BUDGET_PROFILE_JSON_REQUIRED) };
  }
  const savedAtIso = new Date().toISOString();
  db.prepare(SQL_UPSERT_BUDGET_PROFILE_CURRENT).run(normalized, savedAtIso);
  db.prepare(SQL_INSERT_BUDGET_PROFILE_HISTORY).run(normalized, savedAtIso);
  return { value: { savedAtIso }, err: null };
}

/**
 * @returns {Result<{profileJson: string, savedAtIso: string} | null>}
 */
export function getBudgetProfileJson() {
  const row = db.prepare(SQL_GET_BUDGET_PROFILE_CURRENT).get();
  if (!row) {
    return { value: null, err: null };
  }
  return {
    value: {
      profileJson: String(row.profile_json || ""),
      savedAtIso: String(row.saved_at_iso || "")
    },
    err: null
  };
}

/**
 * @param {string} query
 * @param {number} [ttlMs]
 * @param {number} [staleTtlMs]
 * @returns {Promise<Result<Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>>}
 */
export async function searchAniListAiringCached(query, ttlMs = defaultAnimeSearchCacheTtlMs, staleTtlMs = defaultAnimeSearchStaleTtlMs) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return { value: null, err: new Error(ERR_ANIME_QUERY_REQUIRED) };
  }
  const now = Date.now();
  const cacheKey = `${CACHE_PREFIX_ANIME_SEARCH}${normalizedQuery.toLowerCase()}`;
  const cacheRes = readCache(cacheKey);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }
  if (cacheRes.value) {
    const logRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_HIT_HOT, { cacheKey });
    if (logRes.err) {
      return { value: null, err: logRes.err };
    }
    return { value: cacheRes.value, err: null };
  }

  const staleEntry = animeSearchStaleCache.get(cacheKey);
  const hasUsableStale = Boolean(staleEntry && staleEntry.staleUntil > now && Array.isArray(staleEntry.rows));
  const inflightRes = readAnimeSearchInflight(cacheKey);
  if (inflightRes.err) {
    return { value: null, err: inflightRes.err };
  }

  if (inflightRes.value && hasUsableStale) {
    const logRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_HIT_STALE, { cacheKey, mode: "stale_while_revalidate" });
    if (logRes.err) {
      return { value: null, err: logRes.err };
    }
    return { value: staleEntry.rows, err: null };
  }

  if (inflightRes.value) {
    const waitLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_INFLIGHT_WAIT, { cacheKey });
    if (waitLogRes.err) {
      return { value: null, err: waitLogRes.err };
    }
    const awaitedRes = await inflightRes.value;
    if (awaitedRes.err) {
      if (hasUsableStale) {
        const staleLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_HIT_STALE, { cacheKey, mode: "stale_after_inflight_error" });
        if (staleLogRes.err) {
          return { value: null, err: staleLogRes.err };
        }
        return { value: staleEntry.rows, err: null };
      }
      return { value: null, err: awaitedRes.err };
    }
    return { value: awaitedRes.value, err: null };
  }

  const startLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_REFRESH_START, { cacheKey, normalizedQuery });
  if (startLogRes.err) {
    return { value: null, err: startLogRes.err };
  }
  const requestPromise = fetchAnimeRowsAndUpdateCache(normalizedQuery, cacheKey, ttlMs, staleTtlMs);
  const writeInflightRes = writeAnimeSearchInflight(cacheKey, requestPromise);
  if (writeInflightRes.err) {
    return { value: null, err: writeInflightRes.err };
  }

  if (hasUsableStale) {
    requestPromise.then((refreshRes) => {
      const logRes = refreshRes.err
        ? logEvent(LOG_LEVEL_ERROR, LOG_EVENT_ANIME_CACHE_REFRESH_ERROR, { cacheKey, message: String(refreshRes.err?.message || "") })
        : logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_REFRESH_SUCCESS, { cacheKey, rows: Array.isArray(refreshRes.value) ? refreshRes.value.length : 0, mode: "background" });
      if (logRes.err) {
        return { value: null, err: logRes.err };
      }
      return { value: true, err: null };
    });
    const staleLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_HIT_STALE, { cacheKey, mode: "stale_while_revalidate" });
    if (staleLogRes.err) {
      return { value: null, err: staleLogRes.err };
    }
    return { value: staleEntry.rows, err: null };
  }

  const refreshRes = await requestPromise;
  if (refreshRes.err) {
    if (hasUsableStale) {
      const staleLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_HIT_STALE, { cacheKey, mode: "stale_after_refresh_error" });
      if (staleLogRes.err) {
        return { value: null, err: staleLogRes.err };
      }
      return { value: staleEntry.rows, err: null };
    }
    return { value: null, err: refreshRes.err };
  }
  const successLogRes = logEvent(LOG_LEVEL_INFO, LOG_EVENT_ANIME_CACHE_REFRESH_SUCCESS, { cacheKey, rows: refreshRes.value.length, mode: "foreground" });
  if (successLogRes.err) {
    return { value: null, err: successLogRes.err };
  }
  return { value: refreshRes.value, err: null };
}

/**
 * @param {string} normalizedQuery
 * @param {string} cacheKey
 * @param {number} ttlMs
 * @param {number} staleTtlMs
 * @returns {Promise<Result<Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>>}
 */
async function fetchAnimeRowsAndUpdateCache(normalizedQuery, cacheKey, ttlMs, staleTtlMs) {
  const requestPayload = {
    query: ANILIST_GRAPHQL_QUERY,
    variables: { search: normalizedQuery }
  };
  const responseRes = await fromPromise(fetch(ANILIST_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload)
  }));
  if (responseRes.err) {
    const deleteRes = deleteAnimeSearchInflight(cacheKey);
    if (deleteRes.err) {
      return { value: null, err: deleteRes.err };
    }
    return { value: null, err: responseRes.err };
  }
  const jsonRes = await fromPromise(responseRes.value.json());
  if (jsonRes.err) {
    const deleteRes = deleteAnimeSearchInflight(cacheKey);
    if (deleteRes.err) {
      return { value: null, err: deleteRes.err };
    }
    return { value: null, err: jsonRes.err };
  }
  const mediaRows = Array.isArray(jsonRes.value?.data?.Page?.media) ? jsonRes.value.data.Page.media : [];
  const rows = mediaRows
    .map((row) => ({
      anilistId: Number(row?.id || 0),
      title: String(row?.title?.english || row?.title?.romaji || row?.title?.native || "").trim(),
      coverImage: String(row?.coverImage?.large || row?.coverImage?.medium || "").trim(),
      status: String(row?.status || "").trim(),
      episodes: Number(row?.episodes || 0),
      format: String(row?.format || "").trim(),
      seasonYear: Number(row?.seasonYear || 0),
      siteUrl: String(row?.siteUrl || "").trim()
    }))
    .filter((row) => row.anilistId > 0 && row.title.length > 0);
  const writeRes = writeCache(cacheKey, rows, ttlMs);
  if (writeRes.err) {
    const deleteRes = deleteAnimeSearchInflight(cacheKey);
    if (deleteRes.err) {
      return { value: null, err: deleteRes.err };
    }
    return { value: null, err: writeRes.err };
  }
  const staleWriteRes = writeAnimeSearchStale(cacheKey, rows, staleTtlMs);
  if (staleWriteRes.err) {
    const deleteRes = deleteAnimeSearchInflight(cacheKey);
    if (deleteRes.err) {
      return { value: null, err: deleteRes.err };
    }
    return { value: null, err: staleWriteRes.err };
  }
  const deleteRes = deleteAnimeSearchInflight(cacheKey);
  if (deleteRes.err) {
    return { value: null, err: deleteRes.err };
  }
  return { value: rows, err: null };
}

/**
 * @param {string} key
 * @param {Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>} rows
 * @param {number} staleTtlMs
 * @returns {Result<boolean>}
 */
function writeAnimeSearchStale(key, rows, staleTtlMs) {
  animeSearchStaleCache.set(key, { rows, staleUntil: Date.now() + staleTtlMs });
  return { value: true, err: null };
}

/**
 * @param {string} key
 * @returns {Result<Promise<Result<Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>> | null>}
 */
function readAnimeSearchInflight(key) {
  return { value: animeSearchInflight.get(key) || null, err: null };
}

/**
 * @param {string} key
 * @param {Promise<Result<Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>>} promise
 * @returns {Result<boolean>}
 */
function writeAnimeSearchInflight(key, promise) {
  animeSearchInflight.set(key, promise);
  return { value: true, err: null };
}

/**
 * @param {string} key
 * @returns {Result<boolean>}
 */
function deleteAnimeSearchInflight(key) {
  animeSearchInflight.delete(key);
  return { value: true, err: null };
}

/**
 * @returns {Result<Array<{id: number, anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string, createdAt: string, updatedAt: string}>>}
 */
export function listTrackedAnime() {
  const rows = db.prepare(SQL_LIST_TRACKED_ANIME).all();
  return {
    value: rows.map((row) => ({
      id: Number(row.id),
      anilistId: Number(row.anilist_id),
      title: String(row.title || ""),
      coverImage: String(row.cover_image || ""),
      status: String(row.anime_status || ""),
      episodes: Number(row.episodes || 0),
      format: String(row.anime_format || ""),
      seasonYear: Number(row.season_year || 0),
      siteUrl: String(row.site_url || ""),
      createdAt: String(row.created_at || ""),
      updatedAt: String(row.updated_at || "")
    })),
    err: null
  };
}

/**
 * @param {{anilistId: number, title: string, coverImage?: string, status?: string, episodes?: number, format?: string, seasonYear?: number, siteUrl?: string}} anime
 * @returns {Result<{saved: boolean}>}
 */
export function upsertTrackedAnime(anime) {
  const anilistId = Number(anime?.anilistId || 0);
  const title = String(anime?.title || "").trim();
  if (anilistId <= 0 || !title) {
    return { value: null, err: new Error(ERR_ANILIST_ID_REQUIRED) };
  }
  const now = new Date().toISOString();
  db.prepare(SQL_UPSERT_TRACKED_ANIME).run(
    anilistId,
    title,
    String(anime?.coverImage || "").trim(),
    String(anime?.status || "").trim(),
    Number(anime?.episodes || 0),
    String(anime?.format || "").trim(),
    Number(anime?.seasonYear || 0),
    String(anime?.siteUrl || "").trim(),
    now,
    now
  );
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_ANIME_SEARCH);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { saved: true }, err: null };
}

/**
 * @param {number} anilistId
 * @returns {Result<{removed: boolean}>}
 */
export function removeTrackedAnime(anilistId) {
  const normalizedId = Number(anilistId || 0);
  if (normalizedId <= 0) {
    return { value: null, err: new Error(ERR_ANILIST_ID_REQUIRED) };
  }
  db.prepare(SQL_DELETE_TRACKED_ANIME_BY_ANILIST_ID).run(normalizedId);
  const invalidateRes = invalidateCacheByPrefix(CACHE_PREFIX_ANIME_SEARCH);
  if (invalidateRes.err) {
    return { value: null, err: invalidateRes.err };
  }
  return { value: { removed: true }, err: null };
}

/**
 * @param {string} baseUrl
 * @returns {Result<string>}
 */
export function buildSlackAnimeRssFeedXml(baseUrl, debugMessage = "") {
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    return { value: null, err: new Error(ERR_SLACKANIME_FEED_BASE_URL_REQUIRED) };
  }
  const trackedRes = listTrackedAnime();
  if (trackedRes.err) {
    return { value: null, err: trackedRes.err };
  }
  const nowRfc = new Date().toUTCString();
  const itemsXml = trackedRes.value
    .map((anime) => {
      const title = escapeXml(anime.title);
      const status = escapeXml(anime.status || "UNKNOWN");
      const format = escapeXml(anime.format || "ANIME");
      const episodes = anime.episodes > 0 ? `${anime.episodes} eps` : "episodes tbd";
      const season = anime.seasonYear > 0 ? String(anime.seasonYear) : RSS_DATE_FALLBACK;
      const siteUrl = anime.siteUrl ? escapeXml(anime.siteUrl) : `${normalizedBaseUrl}${PATH_SLACKANIME_PAGE}`;
      const updatedAt = anime.updatedAt ? new Date(anime.updatedAt).toUTCString() : nowRfc;
      const description = escapeXml(`${format} • ${status} • ${episodes} • ${season}`);
      const guid = `${RSS_GUID_PREFIX_TRACKED}${anime.anilistId}`;
      return `<item><title>${title}</title><link>${siteUrl}</link><description>${description}</description><guid isPermaLink="false">${guid}</guid><pubDate>${updatedAt}</pubDate></item>`;
    })
    .join("");
  const debugItem = buildDebugRssItemXml(normalizedBaseUrl, debugMessage, nowRfc);
  if (debugItem.err) {
    return { value: null, err: debugItem.err };
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${RSS_FEED_TITLE_TRACKED}</title><link>${normalizedBaseUrl}${PATH_SLACKANIME_PAGE}</link><description>${RSS_FEED_DESC_TRACKED}</description><lastBuildDate>${nowRfc}</lastBuildDate>${debugItem.value}${itemsXml}</channel></rss>`;
  return { value: xml, err: null };
}

/**
 * @param {string} baseUrl
 * @returns {Promise<Result<string>>}
 */
export async function buildSlackAnimeQuestionRssFeedXml(baseUrl, debugMessage = "") {
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    return { value: null, err: new Error(ERR_SLACKANIME_FEED_BASE_URL_REQUIRED) };
  }
  const questionRes = await getDailyAnimeQuestionCached();
  if (questionRes.err) {
    return { value: null, err: questionRes.err };
  }
  const row = questionRes.value;
  const nowRfc = new Date().toUTCString();
  const questionText = escapeXml(row?.question || "");
  const dateKey = escapeXml(row?.dateKey || RSS_DATE_FALLBACK);
  const guid = `${RSS_GUID_PREFIX_QUESTION}${dateKey}`;
  const link = `${normalizedBaseUrl}${PATH_SLACKANIME_PAGE}`;
  const item = `<item><title>Daily Anime Question - ${dateKey}</title><link>${link}</link><description>${questionText}</description><guid isPermaLink="false">${guid}</guid><pubDate>${nowRfc}</pubDate></item>`;
  const debugItem = buildDebugRssItemXml(normalizedBaseUrl, debugMessage, nowRfc);
  if (debugItem.err) {
    return { value: null, err: debugItem.err };
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${RSS_FEED_TITLE_QUESTION}</title><link>${link}</link><description>${RSS_FEED_DESC_QUESTION}</description><lastBuildDate>${nowRfc}</lastBuildDate>${debugItem.value}${item}</channel></rss>`;
  return { value: xml, err: null };
}

/**
 * @param {string} baseUrl
 * @param {string} debugMessage
 * @param {string} nowRfc
 * @returns {Result<string>}
 */
function buildDebugRssItemXml(baseUrl, debugMessage, nowRfc) {
  const normalized = String(debugMessage || "").trim();
  if (!normalized) {
    return { value: "", err: null };
  }
  const escapedMessage = escapeXml(normalized);
  const guid = `${RSS_GUID_PREFIX_DEBUG}${Date.now()}`;
  const link = `${baseUrl}${PATH_SLACKANIME_PAGE}`;
  const item = `<item><title>${RSS_DEBUG_TITLE}</title><link>${link}</link><description>${escapedMessage}</description><guid isPermaLink="false">${guid}</guid><pubDate>${nowRfc}</pubDate></item>`;
  return { value: item, err: null };
}

/**
 * @returns {Promise<Result<{dateKey: string, question: string, index: number, source?: string}>>}
 */
export async function getDailyAnimeQuestionCached() {
  const date = new Date();
  const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  const cacheKey = `${CACHE_PREFIX_ANIME_DAILY_QUESTION}${dayKey}`;
  const cacheRes = readCache(cacheKey);
  if (cacheRes.err) {
    return { value: null, err: cacheRes.err };
  }
  if (cacheRes.value) {
    return { value: cacheRes.value, err: null };
  }
  const prompt = `${ANIME_DAILY_QUESTION_PROMPT_PREFIX} Date key: ${dayKey}. ${ANIME_DAILY_QUESTION_PROMPT_SUFFIX}`;
  const generatedRes = await generateReply(prompt);
  const cleanedRes = generatedRes.err ? { value: "", err: null } : normalizeAnimeQuestionText(generatedRes.value);
  const fallbackRes = selectFallbackDailyAnimeQuestion(dayKey);
  if (fallbackRes.err) {
    return { value: null, err: fallbackRes.err };
  }
  const payload = cleanedRes.value
    ? { dateKey: dayKey, question: cleanedRes.value, index: fallbackRes.value.index, source: "openai" }
    : { dateKey: dayKey, question: fallbackRes.value.question, index: fallbackRes.value.index, source: "fallback" };
  const writeRes = writeCache(cacheKey, payload, defaultAnimeQuestionCacheTtlMs);
  if (writeRes.err) {
    return { value: null, err: writeRes.err };
  }
  return { value: payload, err: null };
}

/**
 * @param {string} dateKey
 * @returns {Result<{question: string, index: number}>}
 */
function selectFallbackDailyAnimeQuestion(dateKey) {
  const dayNumber = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86_400_000);
  const questionIndex = Math.abs(dayNumber) % DAILY_ANIME_QUESTIONS.length;
  return { value: { question: DAILY_ANIME_QUESTIONS[questionIndex], index: questionIndex }, err: null };
}

/**
 * @param {string} value
 * @returns {Result<string>}
 */
function normalizeAnimeQuestionText(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { value: "", err: null };
  }
  const withoutQuotes = normalized.replace(/^["'`]+|["'`]+$/g, "");
  const truncated = withoutQuotes.slice(0, ANIME_QUESTION_MAX_LEN).trim();
  if (!truncated) {
    return { value: "", err: null };
  }
  const question = /[?]$/.test(truncated) ? truncated : `${truncated}?`;
  return { value: question, err: null };
}

/**
 * Adds missing sample posts once by title match so repeated restarts do not duplicate data.
 * @returns {Result<boolean>}
 */
function ensureSampleBlogs() {
  const existingRows = db.prepare(SQL_LIST_BLOG_TITLES).all();
  const existingTitles = new Set(existingRows.map((row) => String(row.title)));
  const now = new Date().toISOString();
  for (const sample of SAMPLE_BLOG_POSTS) {
    if (existingTitles.has(sample.title)) {
      continue;
    }
    const slug = `${toSlug(sample.title)}${SAMPLE_POST_SUFFIX}`;
    const info = db.prepare(SQL_INSERT_BLOG).run(sample.title, slug, sample.summary, sample.content, BLOG_VARIANT_DEFAULT, SAMPLE_POST_PUBLISHED, now, now);
    const blogId = Number(info.lastInsertRowid);
    const relationRes = upsertBlogRelations(blogId, ensureCategoryId(sample.category), sample.tags);
    if (relationRes.err) {
      return { value: null, err: relationRes.err };
    }
    existingTitles.add(sample.title);
  }
  return { value: true, err: null };
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * @param {string} name
 * @returns {number}
 */
function ensureCategoryId(name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) {
    return 0;
  }
  const row = db.prepare("SELECT id FROM blog_categories WHERE name = ?").get(normalized);
  if (row && row.id) {
    return Number(row.id);
  }
  const created = db.prepare(SQL_INSERT_CATEGORY).run(normalized, new Date().toISOString());
  return Number(created.lastInsertRowid);
}

/**
 * Adds `variant` for older DBs that predate vlog support.
 * @returns {Result<boolean>}
 */
function ensureBlogVariantColumn() {
  const columns = db.prepare("PRAGMA table_info(blogs)").all();
  const hasVariant = columns.some((column) => column && column.name === "variant");
  if (hasVariant) {
    return { value: true, err: null };
  }
  db.exec(`ALTER TABLE blogs ADD COLUMN variant TEXT NOT NULL DEFAULT '${BLOG_VARIANT_DEFAULT}'`);
  return { value: true, err: null };
}

/**
 * @template T
 * @param {string} key
 * @returns {Result<T | null>}
 */
export function readCache(key) {
  const now = Date.now();
  const entry = memoryCache.get(key);
  if (!entry) {
    return { value: null, err: null };
  }
  if (entry.expiresAt <= now) {
    memoryCache.delete(key);
    return { value: null, err: null };
  }
  return { value: entry.value, err: null };
}

/**
 * @template T
 * @param {string} key
 * @param {T} value
 * @param {number} ttlMs
 * @returns {Result<boolean>}
 */
export function writeCache(key, value, ttlMs) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return { value: true, err: null };
}

/**
 * @param {string} prefix
 * @returns {Result<boolean>}
 */
export function invalidateCacheByPrefix(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  if (prefix.startsWith(CACHE_PREFIX_ANIME_SEARCH)) {
    for (const key of animeSearchStaleCache.keys()) {
      if (key.startsWith(prefix)) {
        animeSearchStaleCache.delete(key);
      }
    }
    for (const key of animeSearchInflight.keys()) {
      if (key.startsWith(prefix)) {
        animeSearchInflight.delete(key);
      }
    }
  }
  return { value: true, err: null };
}

/**
 * @param {"debug" | "info" | "warn" | "error"} level
 * @param {string} event
 * @param {Record<string, unknown>} [meta]
 * @returns {Result<boolean>}
 */
export function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, meta });
  const rotateRes = rotateApiLogsIfNeeded();
  if (rotateRes.err) {
    return { value: null, err: rotateRes.err };
  }
  console.log(line);
  appendFileSync(apiLogFile, `${line}${LOG_ENTRY_SEPARATOR}`, LOG_ENCODING);
  return { value: true, err: null };
}

/**
 * @returns {Result<boolean>}
 */
export function rotateApiLogsIfNeeded() {
  if (!existsSync(apiLogFile)) {
    return { value: true, err: null };
  }

  const fileSize = statSync(apiLogFile).size;
  if (fileSize < maxLogBytes) {
    return { value: true, err: null };
  }

  for (let i = maxLogFiles - 1; i >= 1; i -= 1) {
    const src = `${apiLogFile}.${i}`;
    const dest = `${apiLogFile}.${i + 1}`;
    if (existsSync(src)) {
      renameSync(src, dest);
    }
  }

  renameSync(apiLogFile, `${apiLogFile}.1`);
  return { value: true, err: null };
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<Result<T>>}
 */
export function fromPromise(promise) {
  return promise.then(
    (value) => ({ value, err: null }),
    (err) => ({ value: null, err: err instanceof Error ? err : new Error(String(err)) })
  );
}

/**
 * @param {Buffer} bytes
 * @param {string} extension
 * @returns {Result<{url: string, fileName: string}>}
 */
export function saveUploadedImage(bytes, extension) {
  const safeExt = extension.startsWith(".") ? extension : `.${extension}`;
  const fileName = `img-${Date.now()}-${Math.floor(Math.random() * 10000)}${safeExt}`;
  const fullPath = join(uploadsDir, fileName);
  writeFileSync(fullPath, bytes);
  return { value: { url: `/uploads/${fileName}`, fileName }, err: null };
}
