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
const CACHE_KEY_BLOGS_LIST = "blogs:list:latest";
const CACHE_KEY_BLOGS_DASHBOARD = "blogs:dashboard:latest";
const SAMPLE_POST_PUBLISHED = 1;
const SAMPLE_POST_SUFFIX = "-sample";
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
const SQL_INSERT_PROMPT = "INSERT INTO prompts (prompt, reply, created_at) VALUES (?, ?, ?)";
const SQL_SELECT_PROMPTS = "SELECT id, prompt, reply, created_at FROM prompts ORDER BY id DESC LIMIT 20";
const SQL_LIST_BLOGS = "SELECT id, title, slug, summary, content, published, created_at, updated_at FROM blogs ORDER BY updated_at DESC LIMIT 100";
const SQL_GET_BLOG = "SELECT id, title, slug, summary, content, published, created_at, updated_at FROM blogs WHERE id = ?";
const SQL_INSERT_BLOG = "INSERT INTO blogs (title, slug, summary, content, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
const SQL_UPDATE_BLOG = "UPDATE blogs SET title = ?, slug = ?, summary = ?, content = ?, published = ?, updated_at = ? WHERE id = ?";
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
const OPENAI_MODEL = "gpt-4.1-mini";
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

const openai = new OpenAI({ apiKey: process.env[OPENAI_KEY_ENV] });
const memoryCache = new Map();
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
 * @returns {Promise<Result<string>>}
 */
export async function getMessageOfDay() {
  const dateKey = new Date().toISOString().slice(0, 10);
  const cacheKey = `${CACHE_PREFIX_MOTD}${dateKey}`;
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

  const replyRes = await generateReply(`${MOTD_PROMPT_PREFIX} ${dateKey}`);
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
 * @returns {Result<Array<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string}>>}
 */
export function listBlogs() {
  const rows = db.prepare(SQL_LIST_BLOGS).all();
  const categoryRows = db.prepare(SQL_BLOG_CATEGORY_ROWS).all();
  const tagRows = db.prepare(SQL_BLOG_TAG_ROWS).all();
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
 * @returns {Result<Array<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string}>>}
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
 * @returns {Result<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string} | null>}
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
 * @returns {Result<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string} | null>}
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
 * @param {{title: string, summary: string, content: string, published: number}} payload
 * @returns {Result<{id: number}>}
 */
export function createBlog(payload) {
  const now = new Date().toISOString();
  const slug = `${toSlug(payload.title)}-${Date.now()}`;
  const stmt = db.prepare(SQL_INSERT_BLOG);
  const info = stmt.run(payload.title, slug, payload.summary, payload.content, payload.published, now, now);
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
 * @param {{title: string, summary: string, content: string, published: number}} payload
 * @returns {Result<boolean>}
 */
export function updateBlog(id, payload) {
  const now = new Date().toISOString();
  const slug = `${toSlug(payload.title)}-${id}`;
  const stmt = db.prepare(SQL_UPDATE_BLOG);
  stmt.run(payload.title, slug, payload.summary, payload.content, payload.published, now, id);
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
 * @returns {Result<boolean>}
 */
export function deleteBlog(id) {
  db.prepare(SQL_DELETE_BLOG_TAG_MAP).run(id);
  db.prepare(SQL_DELETE_BLOG_CATEGORY_MAP).run(id);
  const stmt = db.prepare(SQL_DELETE_BLOG);
  stmt.run(id);
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
    const info = db.prepare(SQL_INSERT_BLOG).run(sample.title, slug, sample.summary, sample.content, SAMPLE_POST_PUBLISHED, now, now);
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
