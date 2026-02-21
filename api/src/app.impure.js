import Database from "better-sqlite3";
import OpenAI from "openai";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  statSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const DATA_DIR = "data";
const DB_FILE = "app.db";
const LOGS_DIR = "logs";
const API_LOG_FILE = "api.log";
const LOG_LEVEL_INFO = "info";
const LOG_EVENT_CACHE_HIT = "cache_hit";
const CACHE_KEY_PROMPTS_LATEST = "prompts:list:latest";
const CACHE_PREFIX_PROMPTS = "prompts:";
const CACHE_PREFIX_AI_REPLY = "ai:reply:";
const CACHE_PREFIX_MOTD = "motd:";
const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    reply TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;
const SQL_INSERT_PROMPT = "INSERT INTO prompts (prompt, reply, created_at) VALUES (?, ?, ?)";
const SQL_SELECT_PROMPTS = "SELECT id, prompt, reply, created_at FROM prompts ORDER BY id DESC LIMIT 20";
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

const dbFile = resolve(process.cwd(), DATA_DIR, DB_FILE);
mkdirSync(dirname(dbFile), { recursive: true });
const db = new Database(dbFile);

const logsDir = resolve(process.cwd(), "..", LOGS_DIR);
mkdirSync(logsDir, { recursive: true });
const apiLogFile = join(logsDir, API_LOG_FILE);

db.exec(SQLITE_SCHEMA);

const openai = new OpenAI({ apiKey: process.env[OPENAI_KEY_ENV] });
const memoryCache = new Map();

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
