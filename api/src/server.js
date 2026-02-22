import { randomUUID } from "node:crypto";
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { secureHeaders } from "hono/secure-headers";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import {
  buildModelPrompt,
  toPublicError,
  validateCategoryBody,
  validateBlogBody,
  validateBlogId,
  validatePublishBody,
  validateTagBody,
  validatePromptBody
} from "./app.pure.js";
import {
  createBlogCategory,
  createBlogTag,
  buildSlackAnimeQuestionRssFeedXml,
  buildSlackAnimeRssFeedXml,
  createBlog,
  deleteBlog,
  fromPromise,
  getBlogByIdCached,
  getBlogDashboardCached,
  getHomePageContent,
  getMessageOfDay,
  generateReplyCached,
  listBlogsCached,
  listBlogCategories,
  listBlogTags,
  listPromptsCached,
  getDailyAnimeQuestionCached,
  listTrackedAnime,
  logEvent,
  removeTrackedAnime,
  runAnimeReleaseCheckJob,
  searchAniListAiringCached,
  getBudgetProfileJson,
  saveUploadedImage,
  saveBudgetProfileJson,
  savePromptOnly,
  setBlogPublished,
  upsertTrackedAnime,
  updateBlog
} from "./app.impure.js";

const HEADER_REQUEST_ID = "x-request-id";
const CACHE_CONTROL = "Cache-Control";
const CACHE_NO_STORE = "no-store";
const CACHE_PUBLIC_PROMPTS = "public, max-age=15, stale-while-revalidate=30";
const EVENT_REQUEST_START = "request_start";
const EVENT_REQUEST_COMPLETE = "request_complete";
const EVENT_REQUEST_PIPELINE_ERROR = "request_pipeline_error";
const EVENT_API_BOOT = "api_boot";
const EVENT_ANIME_CRON_BOOT = "anime_cron_boot";
const EVENT_ANIME_CRON_DISABLED = "anime_cron_disabled";
const EVENT_ANIME_CRON_TICK_START = "anime_cron_tick_start";
const EVENT_ANIME_CRON_TICK_COMPLETE = "anime_cron_tick_complete";
const EVENT_ANIME_CRON_TICK_ERROR = "anime_cron_tick_error";
const EVENT_ANIME_CRON_TICK_SKIPPED = "anime_cron_tick_skipped";
const EVENT_RATE_LIMIT_EXCEEDED = "rate_limit_exceeded";
const EVENT_SHUTDOWN_SIGNAL = "shutdown_signal";
const EVENT_SHUTDOWN_COMPLETE = "shutdown_complete";
const EVENT_SHUTDOWN_ERROR = "shutdown_error";
const LEVEL_INFO = "info";
const LEVEL_ERROR = "error";
const PATH_API_HEALTH = "/api/health";
const PATH_API_PROMPTS = "/api/prompts";
const PATH_API_AI = "/api/ai";
const PATH_API_MOTD = "/api/message-of-day";
const PATH_API_HOME_CONTENT = "/api/home-content";
const PATH_API_BLOGS = "/api/blogs";
const PATH_API_BLOGS_ID = "/api/blogs/:id";
const PATH_API_BLOGS_PUBLISH = "/api/blogs/:id/publish";
const PATH_API_BLOGS_PUBLIC_ID = "/api/blogs/public/:id";
const PATH_API_BLOGS_DASHBOARD = "/api/blogs/dashboard";
const PATH_API_BLOG_CATEGORIES = "/api/blogs/categories";
const PATH_API_BLOG_TAGS = "/api/blogs/tags";
const PATH_API_BLOGS_ADMIN_LOGIN = "/api/blogs/admin/login";
const PATH_API_BLOGS_ADMIN_LOGOUT = "/api/blogs/admin/logout";
const PATH_API_BLOGS_UPLOAD_IMAGE = "/api/blogs/upload-image";
const PATH_API_BUDGET_PROFILE = "/api/budget/profile";
const PATH_API_ANIME_SEARCH = "/api/slackanime/search";
const PATH_API_ANIME_TRACKED = "/api/slackanime/tracked";
const PATH_API_ANIME_TRACKED_ID = "/api/slackanime/tracked/:anilistId";
const PATH_API_ANIME_QUESTION = "/api/slackanime/question/today";
const PATH_API_ANIME_FEED = "/api/slackanime/feed.xml";
const PATH_API_ANIME_FEED_TRACKED = "/api/slackanime/feed/tracked.xml";
const PATH_API_ANIME_FEED_QUESTIONS = "/api/slackanime/feed/questions.xml";
const QUERY_REFRESH = "refresh";
const QUERY_DEBUG_MESSAGE_CAMEL = "debugMessage";
const QUERY_DEBUG_MESSAGE_SNAKE = "debug_message";
const HEADER_SET_COOKIE = "Set-Cookie";
const HEADER_RETRY_AFTER = "Retry-After";
const HEADER_X_FORWARDED_FOR = "x-forwarded-for";
const HEADER_X_REAL_IP = "x-real-ip";
const CODE_NOT_FOUND = "NOT_FOUND";
const CODE_RATE_LIMITED = "RATE_LIMITED";
const CODE_SHUTTING_DOWN = "SHUTTING_DOWN";
const ERR_BUDGET_PROFILE_NOT_FOUND = "Budget profile not found";
const ERR_BUDGET_PROFILE_PAYLOAD_REQUIRED = "Budget profile payload is required";
const ERR_ANIME_SEARCH_QUERY_REQUIRED = "Anime search query is required";
const ERR_ANIME_PAYLOAD_REQUIRED = "Anime payload is required";
const ERR_ANIME_ANILIST_ID_REQUIRED = "AniList id is required";
const CONTENT_TYPE_XML = "application/rss+xml; charset=utf-8";
const STATUS_BAD_REQUEST = 400;
const STATUS_UNAUTHORIZED = 401;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;
const STATUS_BAD_GATEWAY = 502;
const STATUS_SERVICE_UNAVAILABLE = 503;
const STATUS_TOO_MANY_REQUESTS = 429;
const PROMPTS_CACHE_TTL_MS = 15000;
const AI_CACHE_TTL_MS = 300000;
const BLOG_CACHE_TTL_MS = 15000;
const ANIME_SEARCH_CACHE_TTL_MS = 1_800_000;
const ANIME_SEARCH_STALE_TTL_MS = 86_400_000;
const MOTD_CACHE_HEADER = "public, max-age=3600, stale-while-revalidate=86400";
const ENV_API_PORT = "API_PORT";
const ENV_BLOG_ADMIN_PASSWORD = "BLOG_ADMIN_PASSWORD";
const ENV_BLOG_ADMIN_USER = "BLOG_ADMIN_USER";
const ENV_BLOG_ADMIN_JWT_SECRET = "BLOG_ADMIN_JWT_SECRET";
const ENV_NODE_ENV = "NODE_ENV";
const ENV_ANIME_RELEASE_CRON_ENABLED = "ANIME_RELEASE_CRON_ENABLED";
const ENV_ANIME_RELEASE_CRON_SCHEDULE = "ANIME_RELEASE_CRON_SCHEDULE";
const ENV_ANIME_RELEASE_CRON_TIMEZONE = "ANIME_RELEASE_CRON_TIMEZONE";
const DEFAULT_API_PORT = 8787;
const DEFAULT_ANIME_CRON_ENABLED = "true";
const DEFAULT_ANIME_CRON_SCHEDULE = "*/15 * * * *";
const DEFAULT_ANIME_CRON_TIMEZONE = "UTC";
const DEFAULT_BLOG_ADMIN_USER = "admin";
const HEADER_ADMIN_TOKEN = "x-admin-token";
const HEADER_COOKIE = "cookie";
const NODE_ENV_PRODUCTION = "production";
const COOKIE_ADMIN_TOKEN = "blog_admin_jwt";
const ADMIN_SESSION_TTL_MS_DEFAULT = 900000;
const ADMIN_SESSION_TTL_MS_DEV = 3600000;
const LOG_BOOT_TEXT = "API server running on";
const ERR_SERVER_SHUTTING_DOWN = "Server is restarting, please retry shortly";
const ERR_RATE_LIMITED = "Too many requests";
const ERR_ADMIN_PASSWORD_REQUIRED = "Admin password is required";
const ERR_ADMIN_PASSWORD_INVALID = "Invalid admin password";
const ERR_ADMIN_TOKEN_REQUIRED = "Admin token is required";
const ERR_ADMIN_TOKEN_INVALID = "Admin session expired or invalid";
const ERR_IMAGE_REQUIRED = "Image file is required";
const ERR_IMAGE_TYPE_INVALID = "Only png, jpg, jpeg, webp are allowed";
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const JWT_ALG = "HS256";
const JWT_SECRET_FALLBACK = "local-blog-admin-jwt-secret-change-me";
const ERR_ADMIN_JWT_SECRET_REQUIRED = "BLOG_ADMIN_JWT_SECRET is required in production";
const RATE_LIMIT_SCOPE_AI = "ai";
const RATE_LIMIT_SCOPE_REFRESH = "refresh";
const RATE_LIMIT_SCOPE_LOGIN = "login";
const RATE_LIMIT_KEY_UNKNOWN = "unknown";
const RATE_LIMIT_WINDOW_AI_MS = 60_000;
const RATE_LIMIT_WINDOW_REFRESH_MS = 60_000;
const RATE_LIMIT_WINDOW_LOGIN_MS = 15 * 60_000;
const RATE_LIMIT_MAX_AI = 15;
const RATE_LIMIT_MAX_REFRESH = 12;
const RATE_LIMIT_MAX_LOGIN = 10;
const RATE_LIMIT_STORE_MAX = 5000;
const SHUTDOWN_FORCE_EXIT_MS = 10_000;
const SIGNAL_SIGINT = "SIGINT";
const SIGNAL_SIGTERM = "SIGTERM";
const TIMER_UNREF_FN = "unref";

const app = new Hono();
let isAnimeCronRunning = false;
let animeCronTask = null;
let isServerShuttingDown = false;
let isShutdownInProgress = false;
const rateLimitStore = new Map();

app.use("*", secureHeaders());

app.use("*", async (c, next) => {
  if (isServerShuttingDown) {
    c.header(CACHE_CONTROL, CACHE_NO_STORE);
    return c.json({ message: ERR_SERVER_SHUTTING_DOWN, code: CODE_SHUTTING_DOWN }, STATUS_SERVICE_UNAVAILABLE);
  }
  const requestId = c.req.header(HEADER_REQUEST_ID) || randomUUID();
  const startedAt = Date.now();
  c.set("requestId", requestId);

  const startLogRes = logEvent(LEVEL_INFO, EVENT_REQUEST_START, {
    requestId,
    method: c.req.method,
    path: c.req.path
  });
  if (startLogRes.err) {
    console.error(startLogRes.err.message);
  }

  const nextRes = await fromPromise(next());
  if (nextRes.err) {
    const errorLogRes = logEvent(LEVEL_ERROR, EVENT_REQUEST_PIPELINE_ERROR, {
      requestId,
      method: c.req.method,
      path: c.req.path,
      error: nextRes.err.message
    });
    if (errorLogRes.err) {
      console.error(errorLogRes.err.message);
    }
    throw nextRes.err;
  }

  const endLogRes = logEvent(LEVEL_INFO, EVENT_REQUEST_COMPLETE, {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt
  });
  if (endLogRes.err) {
    console.error(endLogRes.err.message);
  }
});

app.get(PATH_API_HEALTH, (c) => {
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ ok: true });
});

app.get(PATH_API_PROMPTS, (c) => {
  const rowsRes = listPromptsCached(PROMPTS_CACHE_TTL_MS);
  if (rowsRes.err) {
    const publicErrRes = toPublicError(rowsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ rows: rowsRes.value });
});

app.post(PATH_API_AI, async (c) => {
  const rateRes = enforceRateLimit(c, RATE_LIMIT_SCOPE_AI, RATE_LIMIT_MAX_AI, RATE_LIMIT_WINDOW_AI_MS);
  if (rateRes.err) {
    const publicErrRes = toPublicError(rateRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  if (rateRes.value) {
    return rateRes.value;
  }
  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validatePromptBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const saveRes = savePromptOnly(payloadRes.value.prompt);
  if (saveRes.err) {
    const publicErrRes = toPublicError(saveRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  const modelPromptRes = buildModelPrompt(payloadRes.value.prompt);
  if (modelPromptRes.err) {
    const publicErrRes = toPublicError(modelPromptRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const replyRes = await generateReplyCached(modelPromptRes.value, AI_CACHE_TTL_MS);
  if (replyRes.err) {
    const publicErrRes = toPublicError(replyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_GATEWAY);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ reply: replyRes.value });
});

app.get(PATH_API_MOTD, async (c) => {
  const refreshRaw = String(c.req.query(QUERY_REFRESH) || "").trim().toLowerCase();
  const forceRefresh = refreshRaw === "1" || refreshRaw === "true" || refreshRaw === "yes";
  if (forceRefresh) {
    const rateRes = enforceRateLimit(c, RATE_LIMIT_SCOPE_REFRESH, RATE_LIMIT_MAX_REFRESH, RATE_LIMIT_WINDOW_REFRESH_MS);
    if (rateRes.err) {
      const publicErrRes = toPublicError(rateRes.err);
      return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
    }
    if (rateRes.value) {
      return rateRes.value;
    }
  }
  const motdRes = await getMessageOfDay(forceRefresh);
  if (motdRes.err) {
    const publicErrRes = toPublicError(motdRes.err);
    return c.json(publicErrRes.value, STATUS_SERVICE_UNAVAILABLE);
  }

  c.header(CACHE_CONTROL, forceRefresh ? CACHE_NO_STORE : MOTD_CACHE_HEADER);
  return c.json({ quote: motdRes.value });
});

app.get(PATH_API_HOME_CONTENT, async (c) => {
  const refreshRaw = String(c.req.query(QUERY_REFRESH) || "").trim().toLowerCase();
  const forceRefresh = refreshRaw === "1" || refreshRaw === "true" || refreshRaw === "yes";
  if (forceRefresh) {
    const rateRes = enforceRateLimit(c, RATE_LIMIT_SCOPE_REFRESH, RATE_LIMIT_MAX_REFRESH, RATE_LIMIT_WINDOW_REFRESH_MS);
    if (rateRes.err) {
      const publicErrRes = toPublicError(rateRes.err);
      return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
    }
    if (rateRes.value) {
      return rateRes.value;
    }
  }
  const contentRes = await getHomePageContent(forceRefresh);
  if (contentRes.err) {
    const publicErrRes = toPublicError(contentRes.err);
    return c.json(publicErrRes.value, STATUS_SERVICE_UNAVAILABLE);
  }
  c.header(CACHE_CONTROL, forceRefresh ? CACHE_NO_STORE : MOTD_CACHE_HEADER);
  return c.json({ content: contentRes.value });
});

app.get(PATH_API_BLOGS, (c) => {
  const blogsRes = listBlogsCached(BLOG_CACHE_TTL_MS);
  if (blogsRes.err) {
    const publicErrRes = toPublicError(blogsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ rows: blogsRes.value });
});

app.get(PATH_API_BLOG_CATEGORIES, (c) => {
  const rowsRes = listBlogCategories();
  if (rowsRes.err) {
    const publicErrRes = toPublicError(rowsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ rows: rowsRes.value });
});

app.get(PATH_API_BLOG_TAGS, (c) => {
  const rowsRes = listBlogTags();
  if (rowsRes.err) {
    const publicErrRes = toPublicError(rowsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ rows: rowsRes.value });
});

app.post(PATH_API_BLOGS_ADMIN_LOGIN, async (c) => {
  const rateRes = enforceRateLimit(c, RATE_LIMIT_SCOPE_LOGIN, RATE_LIMIT_MAX_LOGIN, RATE_LIMIT_WINDOW_LOGIN_MS);
  if (rateRes.err) {
    const publicErrRes = toPublicError(rateRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  if (rateRes.value) {
    return rateRes.value;
  }
  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const password = typeof bodyRes.value?.password === "string" ? bodyRes.value.password : "";
  if (!password.trim()) {
    return c.json({ message: ERR_ADMIN_PASSWORD_REQUIRED, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const expectedPassword = process.env[ENV_BLOG_ADMIN_PASSWORD];
  if (!expectedPassword || password !== expectedPassword) {
    return c.json({ message: ERR_ADMIN_PASSWORD_INVALID, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const ttlRes = getAdminSessionTtlMs();
  if (ttlRes.err) {
    const publicErrRes = toPublicError(ttlRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  const ttlMs = ttlRes.value;
  const tokenRes = createAdminJwt(process.env[ENV_BLOG_ADMIN_USER] || DEFAULT_BLOG_ADMIN_USER, ttlMs);
  if (tokenRes.err) {
    const publicErrRes = toPublicError(tokenRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  const expiresAt = Date.now() + ttlMs;
  const cookieRes = buildAdminCookie(tokenRes.value, ttlMs);
  if (cookieRes.err) {
    const publicErrRes = toPublicError(cookieRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(HEADER_SET_COOKIE, cookieRes.value);
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ expiresAt, user: process.env[ENV_BLOG_ADMIN_USER] || DEFAULT_BLOG_ADMIN_USER });
});

app.post(PATH_API_BLOGS_ADMIN_LOGOUT, (c) => {
  const clearCookieRes = buildClearAdminCookie();
  if (clearCookieRes.err) {
    const publicErrRes = toPublicError(clearCookieRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(HEADER_SET_COOKIE, clearCookieRes.value);
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ ok: true });
});

app.get(PATH_API_BUDGET_PROFILE, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const profileRes = getBudgetProfileJson();
  if (profileRes.err) {
    const publicErrRes = toPublicError(profileRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  if (!profileRes.value) {
    return c.json({ message: ERR_BUDGET_PROFILE_NOT_FOUND, code: CODE_NOT_FOUND }, STATUS_NOT_FOUND);
  }
  const parsedRes = await fromPromise(Promise.resolve().then(() => JSON.parse(profileRes.value.profileJson)));
  if (parsedRes.err) {
    const publicErrRes = toPublicError(parsedRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ profilePayload: parsedRes.value, savedAtIso: profileRes.value.savedAtIso });
});

app.put(PATH_API_BUDGET_PROFILE, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }
  const profilePayload = bodyRes.value?.profilePayload;
  const jsonRes = await fromPromise(Promise.resolve().then(() => JSON.stringify(profilePayload)));
  if (jsonRes.err || !jsonRes.value) {
    const publicErrRes = toPublicError(jsonRes.err || new Error(ERR_BUDGET_PROFILE_PAYLOAD_REQUIRED));
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }
  const saveRes = saveBudgetProfileJson(jsonRes.value);
  if (saveRes.err) {
    const publicErrRes = toPublicError(saveRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ saved: true, savedAtIso: saveRes.value.savedAtIso });
});

app.get(PATH_API_ANIME_SEARCH, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const queryText = String(c.req.query("q") || "").trim();
  if (!queryText) {
    return c.json({ message: ERR_ANIME_SEARCH_QUERY_REQUIRED, code: "BAD_REQUEST" }, STATUS_BAD_REQUEST);
  }
  const rowsRes = await searchAniListAiringCached(queryText, ANIME_SEARCH_CACHE_TTL_MS, ANIME_SEARCH_STALE_TTL_MS);
  if (rowsRes.err) {
    const publicErrRes = toPublicError(rowsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ rows: rowsRes.value });
});

app.get(PATH_API_ANIME_TRACKED, (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const rowsRes = listTrackedAnime();
  if (rowsRes.err) {
    const publicErrRes = toPublicError(rowsRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ rows: rowsRes.value });
});

app.post(PATH_API_ANIME_TRACKED, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }
  if (!bodyRes.value || typeof bodyRes.value !== "object") {
    return c.json({ message: ERR_ANIME_PAYLOAD_REQUIRED, code: "BAD_REQUEST" }, STATUS_BAD_REQUEST);
  }
  const saveRes = upsertTrackedAnime(bodyRes.value);
  if (saveRes.err) {
    const publicErrRes = toPublicError(saveRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ saved: true });
});

app.delete(PATH_API_ANIME_TRACKED_ID, (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const anilistId = Number(c.req.param("anilistId") || 0);
  if (!Number.isInteger(anilistId) || anilistId <= 0) {
    return c.json({ message: ERR_ANIME_ANILIST_ID_REQUIRED, code: "BAD_REQUEST" }, STATUS_BAD_REQUEST);
  }
  const removeRes = removeTrackedAnime(anilistId);
  if (removeRes.err) {
    const publicErrRes = toPublicError(removeRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ removed: true });
});

app.get(PATH_API_ANIME_QUESTION, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }
  const questionRes = await getDailyAnimeQuestionCached();
  if (questionRes.err) {
    const publicErrRes = toPublicError(questionRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ row: questionRes.value });
});

app.get(PATH_API_ANIME_FEED, (c) => {
  const origin = new URL(c.req.url).origin;
  const debugMessage = String(c.req.query(QUERY_DEBUG_MESSAGE_CAMEL) || c.req.query(QUERY_DEBUG_MESSAGE_SNAKE) || "");
  const xmlRes = buildSlackAnimeRssFeedXml(origin, debugMessage);
  if (xmlRes.err) {
    const publicErrRes = toPublicError(xmlRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  c.header("Content-Type", CONTENT_TYPE_XML);
  return c.body(xmlRes.value);
});

app.get(PATH_API_ANIME_FEED_TRACKED, (c) => {
  const origin = new URL(c.req.url).origin;
  const debugMessage = String(c.req.query(QUERY_DEBUG_MESSAGE_CAMEL) || c.req.query(QUERY_DEBUG_MESSAGE_SNAKE) || "");
  const xmlRes = buildSlackAnimeRssFeedXml(origin, debugMessage);
  if (xmlRes.err) {
    const publicErrRes = toPublicError(xmlRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  c.header("Content-Type", CONTENT_TYPE_XML);
  return c.body(xmlRes.value);
});

app.get(PATH_API_ANIME_FEED_QUESTIONS, async (c) => {
  const origin = new URL(c.req.url).origin;
  const debugMessage = String(c.req.query(QUERY_DEBUG_MESSAGE_CAMEL) || c.req.query(QUERY_DEBUG_MESSAGE_SNAKE) || "");
  const xmlRes = await buildSlackAnimeQuestionRssFeedXml(origin, debugMessage);
  if (xmlRes.err) {
    const publicErrRes = toPublicError(xmlRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  c.header("Content-Type", CONTENT_TYPE_XML);
  return c.body(xmlRes.value);
});

app.post(PATH_API_BLOG_CATEGORIES, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validateCategoryBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const createRes = createBlogCategory(payloadRes.value.name);
  if (createRes.err) {
    const publicErrRes = toPublicError(createRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ created: true, id: createRes.value.id });
});

app.post(PATH_API_BLOG_TAGS, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validateTagBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const createRes = createBlogTag(payloadRes.value.name);
  if (createRes.err) {
    const publicErrRes = toPublicError(createRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ created: true, id: createRes.value.id });
});

app.post(PATH_API_BLOGS_UPLOAD_IMAGE, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const bodyRes = await fromPromise(c.req.parseBody());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const file = bodyRes.value.image;
  if (!file || typeof file === "string") {
    return c.json({ message: ERR_IMAGE_REQUIRED, code: "BAD_REQUEST" }, STATUS_BAD_REQUEST);
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return c.json({ message: ERR_IMAGE_TYPE_INVALID, code: "BAD_REQUEST" }, STATUS_BAD_REQUEST);
  }

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const bytesRes = await fromPromise(file.arrayBuffer());
  if (bytesRes.err) {
    const publicErrRes = toPublicError(bytesRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const saveRes = saveUploadedImage(Buffer.from(bytesRes.value), ext);
  if (saveRes.err) {
    const publicErrRes = toPublicError(saveRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ uploaded: true, url: saveRes.value.url, fileName: saveRes.value.fileName });
});

app.get(PATH_API_BLOGS_DASHBOARD, (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const dashboardRes = getBlogDashboardCached(BLOG_CACHE_TTL_MS);
  if (dashboardRes.err) {
    const publicErrRes = toPublicError(dashboardRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ dashboard: dashboardRes.value });
});

app.get(PATH_API_BLOGS_ID, (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const idRes = validateBlogId(c.req.param("id"));
  if (idRes.err) {
    const publicErrRes = toPublicError(idRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const blogRes = getBlogByIdCached(idRes.value, BLOG_CACHE_TTL_MS);
  if (blogRes.err) {
    const publicErrRes = toPublicError(blogRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  if (!blogRes.value) {
    return c.json({ message: "Blog not found", code: "NOT_FOUND" }, STATUS_NOT_FOUND);
  }

  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ row: blogRes.value });
});

app.get(PATH_API_BLOGS_PUBLIC_ID, (c) => {
  const idRes = validateBlogId(c.req.param("id"));
  if (idRes.err) {
    const publicErrRes = toPublicError(idRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const blogRes = getBlogByIdCached(idRes.value, BLOG_CACHE_TTL_MS);
  if (blogRes.err) {
    const publicErrRes = toPublicError(blogRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  const isAdmin = !requireAdminSession(c).err;
  if (!blogRes.value || (!blogRes.value.published && !isAdmin)) {
    return c.json({ message: "Blog not found", code: "NOT_FOUND" }, STATUS_NOT_FOUND);
  }

  c.header(CACHE_CONTROL, CACHE_PUBLIC_PROMPTS);
  return c.json({ row: blogRes.value });
});

app.post(PATH_API_BLOGS, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validateBlogBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const createRes = createBlog(payloadRes.value);
  if (createRes.err) {
    const publicErrRes = toPublicError(createRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ created: true, id: createRes.value.id });
});

app.put(PATH_API_BLOGS_ID, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const idRes = validateBlogId(c.req.param("id"));
  if (idRes.err) {
    const publicErrRes = toPublicError(idRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validateBlogBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const updateRes = updateBlog(idRes.value, payloadRes.value);
  if (updateRes.err) {
    const publicErrRes = toPublicError(updateRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  if (!updateRes.value) {
    return c.json({ message: "Blog not found", code: "NOT_FOUND" }, STATUS_NOT_FOUND);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ updated: updateRes.value, id: idRes.value });
});

app.patch(PATH_API_BLOGS_PUBLISH, async (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const idRes = validateBlogId(c.req.param("id"));
  if (idRes.err) {
    const publicErrRes = toPublicError(idRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const bodyRes = await fromPromise(c.req.json());
  if (bodyRes.err) {
    const publicErrRes = toPublicError(bodyRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const payloadRes = validatePublishBody(bodyRes.value);
  if (payloadRes.err) {
    const publicErrRes = toPublicError(payloadRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const updateRes = setBlogPublished(idRes.value, payloadRes.value.published);
  if (updateRes.err) {
    const publicErrRes = toPublicError(updateRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  if (!updateRes.value) {
    return c.json({ message: "Blog not found", code: "NOT_FOUND" }, STATUS_NOT_FOUND);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ updated: updateRes.value, id: idRes.value, published: payloadRes.value.published });
});

app.delete(PATH_API_BLOGS_ID, (c) => {
  const authRes = requireAdminSession(c);
  if (authRes.err) {
    return c.json({ message: authRes.err.message, code: "UNAUTHORIZED" }, STATUS_UNAUTHORIZED);
  }

  const idRes = validateBlogId(c.req.param("id"));
  if (idRes.err) {
    const publicErrRes = toPublicError(idRes.err);
    return c.json(publicErrRes.value, STATUS_BAD_REQUEST);
  }

  const deleteRes = deleteBlog(idRes.value);
  if (deleteRes.err) {
    const publicErrRes = toPublicError(deleteRes.err);
    return c.json(publicErrRes.value, STATUS_SERVER_ERROR);
  }

  if (!deleteRes.value) {
    return c.json({ message: "Blog not found", code: "NOT_FOUND" }, STATUS_NOT_FOUND);
  }

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ deleted: deleteRes.value, id: idRes.value });
});

/**
 * @param {import("hono").Context} c
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function requireAdminSession(c) {
  const tokenRes = getAdminTokenFromRequest(c);
  if (tokenRes.err) {
    return { value: null, err: tokenRes.err };
  }
  if (!tokenRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_TOKEN_REQUIRED) };
  }

  const verifyRes = verifyAdminJwt(tokenRes.value);
  if (verifyRes.err) {
    return { value: null, err: new Error(ERR_ADMIN_TOKEN_INVALID) };
  }

  return { value: true, err: null };
}

/**
 * @param {import("hono").Context} c
 * @returns {{ value: string | null, err: Error | null }}
 */
function getAdminTokenFromRequest(c) {
  const cookieHeader = c.req.header(HEADER_COOKIE) || "";
  const cookieTokenRes = getCookieValue(cookieHeader, COOKIE_ADMIN_TOKEN);
  if (cookieTokenRes.err) {
    return { value: null, err: cookieTokenRes.err };
  }
  if (cookieTokenRes.value) {
    return { value: cookieTokenRes.value, err: null };
  }
  const headerToken = c.req.header(HEADER_ADMIN_TOKEN) || "";
  if (headerToken) {
    return { value: headerToken, err: null };
  }
  const authHeader = c.req.header("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return { value: authHeader.slice(7).trim(), err: null };
  }
  return { value: "", err: null };
}

/**
 * @param {string} cookieHeader
 * @param {string} key
 * @returns {{ value: string | null, err: Error | null }}
 */
function getCookieValue(cookieHeader, key) {
  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    if (!pair.startsWith(`${key}=`)) {
      continue;
    }
    return { value: decodeURIComponent(pair.slice(key.length + 1)), err: null };
  }
  return { value: "", err: null };
}

/**
 * @returns {{ value: number | null, err: Error | null }}
 */
function getAdminSessionTtlMs() {
  const isProdRes = isProductionEnv();
  if (isProdRes.err) {
    return { value: null, err: isProdRes.err };
  }
  return { value: isProdRes.value ? ADMIN_SESSION_TTL_MS_DEFAULT : ADMIN_SESSION_TTL_MS_DEV, err: null };
}

/**
 * @param {string} user
 * @param {number} ttlMs
 * @returns {{value: string | null, err: Error | null}}
 */
function createAdminJwt(user, ttlMs) {
  const secretRes = getJwtSecret();
  if (secretRes.err) {
    return { value: null, err: secretRes.err };
  }
  try {
    const token = jwt.sign(
      { sub: user, role: "admin" },
      secretRes.value,
      { algorithm: JWT_ALG, expiresIn: Math.max(1, Math.floor(ttlMs / 1000)) }
    );
    return { value: token, err: null };
  } catch (err) {
    return { value: null, err: err instanceof Error ? err : new Error(ERR_ADMIN_TOKEN_INVALID) };
  }
}

/**
 * @param {string} token
 * @returns {{value: boolean | null, err: Error | null}}
 */
function verifyAdminJwt(token) {
  const secretRes = getJwtSecret();
  if (secretRes.err) {
    return { value: null, err: secretRes.err };
  }
  try {
    jwt.verify(token, secretRes.value, { algorithms: [JWT_ALG] });
    return { value: true, err: null };
  } catch (err) {
    return { value: null, err: err instanceof Error ? err : new Error(ERR_ADMIN_TOKEN_INVALID) };
  }
}

/**
 * @returns {{value: string | null, err: Error | null}}
 */
function getJwtSecret() {
  const envSecret = process.env[ENV_BLOG_ADMIN_JWT_SECRET];
  if (envSecret && envSecret.trim()) {
    return { value: envSecret, err: null };
  }
  const isProdRes = isProductionEnv();
  if (isProdRes.err) {
    return { value: null, err: isProdRes.err };
  }
  if (isProdRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_JWT_SECRET_REQUIRED) };
  }
  return { value: JWT_SECRET_FALLBACK, err: null };
}

/**
 * @param {string} token
 * @param {number} ttlMs
 * @returns {{ value: string | null, err: Error | null }}
 */
function buildAdminCookie(token, ttlMs) {
  const maxAge = Math.max(1, Math.floor(ttlMs / 1000));
  const isProdRes = isProductionEnv();
  if (isProdRes.err) {
    return { value: null, err: isProdRes.err };
  }
  const secure = isProdRes.value ? "; Secure" : "";
  return { value: `${COOKIE_ADMIN_TOKEN}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`, err: null };
}

/**
 * @returns {{ value: string | null, err: Error | null }}
 */
function buildClearAdminCookie() {
  return { value: `${COOKIE_ADMIN_TOKEN}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, err: null };
}

/**
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function isProductionEnv() {
  return { value: (process.env[ENV_NODE_ENV] || "").trim().toLowerCase() === NODE_ENV_PRODUCTION, err: null };
}

const port = Number(process.env[ENV_API_PORT] || DEFAULT_API_PORT);
const serverHandle = serve({ fetch: app.fetch, port });
const bootLogRes = logEvent(LEVEL_INFO, EVENT_API_BOOT, { port });
if (bootLogRes.err) {
  console.error(bootLogRes.err.message);
}
console.log(`${LOG_BOOT_TEXT} ${port}`);
const cronBootRes = startAnimeReleaseCron();
if (cronBootRes.err) {
  console.error(cronBootRes.err.message);
}
const shutdownHandlersRes = registerShutdownHandlers(serverHandle);
if (shutdownHandlersRes.err) {
  console.error(shutdownHandlersRes.err.message);
}

/**
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function startAnimeReleaseCron() {
  const enabledRaw = String(process.env[ENV_ANIME_RELEASE_CRON_ENABLED] || DEFAULT_ANIME_CRON_ENABLED).trim().toLowerCase();
  const isEnabled = enabledRaw === "1" || enabledRaw === "true" || enabledRaw === "yes" || enabledRaw === "on";
  if (!isEnabled) {
    const logRes = logEvent(LEVEL_INFO, EVENT_ANIME_CRON_DISABLED, { enabled: enabledRaw });
    if (logRes.err) {
      console.error(logRes.err.message);
    }
    return { value: true, err: null };
  }

  const schedule = String(process.env[ENV_ANIME_RELEASE_CRON_SCHEDULE] || DEFAULT_ANIME_CRON_SCHEDULE).trim();
  const timezone = String(process.env[ENV_ANIME_RELEASE_CRON_TIMEZONE] || DEFAULT_ANIME_CRON_TIMEZONE).trim();
  if (!cron.validate(schedule)) {
    const logRes = logEvent(LEVEL_ERROR, EVENT_ANIME_CRON_TICK_ERROR, { message: "Invalid cron schedule", schedule, timezone });
    if (logRes.err) {
      console.error(logRes.err.message);
    }
    return { value: null, err: new Error("Invalid cron schedule") };
  }

  animeCronTask = cron.schedule(schedule, () => {
    void runAnimeReleaseCronTick();
  }, { timezone });
  const logRes = logEvent(LEVEL_INFO, EVENT_ANIME_CRON_BOOT, { schedule, timezone });
  if (logRes.err) {
    console.error(logRes.err.message);
  }
  return { value: true, err: null };
}

/**
 * Critical path: simple in-memory guardrail for AI/OpenAI-backed and auth endpoints.
 * @param {import("hono").Context} c
 * @param {string} scope
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {{ value: Response | null, err: Error | null }}
 */
function enforceRateLimit(c, scope, maxRequests, windowMs) {
  const ipRes = getClientIp(c);
  if (ipRes.err) {
    return { value: null, err: ipRes.err };
  }
  const now = Date.now();
  const cleanupRes = cleanupRateLimitStore(now);
  if (cleanupRes.err) {
    return { value: null, err: cleanupRes.err };
  }
  const key = `${scope}:${ipRes.value}`;
  const checkRes = consumeRateLimitToken(key, maxRequests, windowMs, now);
  if (checkRes.err) {
    return { value: null, err: checkRes.err };
  }
  c.header(HEADER_RETRY_AFTER, String(checkRes.value.retryAfterSec));
  if (checkRes.value.allowed) {
    return { value: null, err: null };
  }
  const logRes = logEvent(LEVEL_INFO, EVENT_RATE_LIMIT_EXCEEDED, {
    path: c.req.path,
    method: c.req.method,
    scope,
    ip: ipRes.value,
    limit: maxRequests,
    windowMs,
    retryAfterSec: checkRes.value.retryAfterSec
  });
  if (logRes.err) {
    console.error(logRes.err.message);
  }
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return {
    value: c.json(
      { message: ERR_RATE_LIMITED, code: CODE_RATE_LIMITED, retryAfterSec: checkRes.value.retryAfterSec },
      STATUS_TOO_MANY_REQUESTS
    ),
    err: null
  };
}

/**
 * @param {import("hono").Context} c
 * @returns {{ value: string | null, err: Error | null }}
 */
function getClientIp(c) {
  const forwarded = String(c.req.header(HEADER_X_FORWARDED_FOR) || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    return { value: first || RATE_LIMIT_KEY_UNKNOWN, err: null };
  }
  const realIp = String(c.req.header(HEADER_X_REAL_IP) || "").trim();
  if (realIp) {
    return { value: realIp, err: null };
  }
  return { value: RATE_LIMIT_KEY_UNKNOWN, err: null };
}

/**
 * @param {number} now
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function cleanupRateLimitStore(now) {
  if (rateLimitStore.size <= RATE_LIMIT_STORE_MAX) {
    return { value: true, err: null };
  }
  for (const [key, value] of rateLimitStore.entries()) {
    if (!value || value.resetAtMs <= now) {
      rateLimitStore.delete(key);
    }
  }
  return { value: true, err: null };
}

/**
 * @param {string} key
 * @param {number} maxRequests
 * @param {number} windowMs
 * @param {number} now
 * @returns {{ value: { allowed: boolean, retryAfterSec: number } | null, err: Error | null }}
 */
function consumeRateLimitToken(key, maxRequests, windowMs, now) {
  const current = rateLimitStore.get(key);
  if (!current || current.resetAtMs <= now) {
    rateLimitStore.set(key, { count: 1, resetAtMs: now + windowMs });
    return { value: { allowed: true, retryAfterSec: Math.max(1, Math.ceil(windowMs / 1000)) }, err: null };
  }
  current.count += 1;
  rateLimitStore.set(key, current);
  const retryAfterSec = Math.max(1, Math.ceil((current.resetAtMs - now) / 1000));
  if (current.count > maxRequests) {
    return { value: { allowed: false, retryAfterSec }, err: null };
  }
  return { value: { allowed: true, retryAfterSec }, err: null };
}

/**
 * @param {import("@hono/node-server").ServerType} server
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function registerShutdownHandlers(server) {
  process.on(SIGNAL_SIGINT, () => {
    void handleShutdownSignal(SIGNAL_SIGINT, server);
  });
  process.on(SIGNAL_SIGTERM, () => {
    void handleShutdownSignal(SIGNAL_SIGTERM, server);
  });
  return { value: true, err: null };
}

/**
 * Critical path: stop new traffic, stop cron scheduling, and close the Node server cleanly.
 * @param {string} signal
 * @param {import("@hono/node-server").ServerType} server
 * @returns {Promise<{ value: boolean | null, err: Error | null }>}
 */
async function handleShutdownSignal(signal, server) {
  if (isShutdownInProgress) {
    return { value: true, err: null };
  }
  isShutdownInProgress = true;
  isServerShuttingDown = true;

  const logRes = logEvent(LEVEL_INFO, EVENT_SHUTDOWN_SIGNAL, { signal });
  if (logRes.err) {
    console.error(logRes.err.message);
  }

  stopAnimeReleaseCronTask();
  const forceTimer = setTimeout(() => {
    process.exit(1);
  }, SHUTDOWN_FORCE_EXIT_MS);
  if (forceTimer && typeof forceTimer[TIMER_UNREF_FN] === "function") {
    forceTimer[TIMER_UNREF_FN]();
  }

  const closeRes = await closeNodeServer(server);
  clearTimeout(forceTimer);
  if (closeRes.err) {
    const errLogRes = logEvent(LEVEL_ERROR, EVENT_SHUTDOWN_ERROR, { signal, error: closeRes.err.message });
    if (errLogRes.err) {
      console.error(errLogRes.err.message);
    }
    process.exit(1);
    return { value: null, err: closeRes.err };
  }

  const doneLogRes = logEvent(LEVEL_INFO, EVENT_SHUTDOWN_COMPLETE, { signal });
  if (doneLogRes.err) {
    console.error(doneLogRes.err.message);
  }
  process.exit(0);
  return { value: true, err: null };
}

/**
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function stopAnimeReleaseCronTask() {
  if (!animeCronTask) {
    return { value: true, err: null };
  }
  if (typeof animeCronTask.stop === "function") {
    animeCronTask.stop();
  }
  if (typeof animeCronTask.destroy === "function") {
    animeCronTask.destroy();
  }
  animeCronTask = null;
  return { value: true, err: null };
}

/**
 * @param {import("@hono/node-server").ServerType} server
 * @returns {Promise<{ value: boolean | null, err: Error | null }>}
 */
async function closeNodeServer(server) {
  if (!server || typeof server.close !== "function") {
    return { value: true, err: null };
  }
  const closeRes = await fromPromise(new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  }));
  if (closeRes.err) {
    return { value: null, err: closeRes.err };
  }
  return { value: true, err: null };
}

/**
 * @returns {Promise<{ value: boolean | null, err: Error | null }>}
 */
async function runAnimeReleaseCronTick() {
  if (isAnimeCronRunning) {
    const logRes = logEvent(LEVEL_INFO, EVENT_ANIME_CRON_TICK_SKIPPED, { reason: "already_running" });
    if (logRes.err) {
      console.error(logRes.err.message);
    }
    return { value: true, err: null };
  }

  isAnimeCronRunning = true;
  const startedAt = Date.now();
  const startLogRes = logEvent(LEVEL_INFO, EVENT_ANIME_CRON_TICK_START, {});
  if (startLogRes.err) {
    console.error(startLogRes.err.message);
  }
  const runRes = await runAnimeReleaseCheckJob();
  isAnimeCronRunning = false;

  if (runRes.err) {
    const errorLogRes = logEvent(LEVEL_ERROR, EVENT_ANIME_CRON_TICK_ERROR, { message: runRes.err.message, durationMs: Date.now() - startedAt });
    if (errorLogRes.err) {
      console.error(errorLogRes.err.message);
    }
    return { value: null, err: runRes.err };
  }
  const doneLogRes = logEvent(LEVEL_INFO, EVENT_ANIME_CRON_TICK_COMPLETE, { durationMs: Date.now() - startedAt });
  if (doneLogRes.err) {
    console.error(doneLogRes.err.message);
  }
  return { value: true, err: null };
}
