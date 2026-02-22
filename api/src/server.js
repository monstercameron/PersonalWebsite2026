import { randomUUID } from "node:crypto";
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
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
  createBlog,
  deleteBlog,
  fromPromise,
  getBlogByIdCached,
  getBlogDashboardCached,
  getMessageOfDay,
  generateReplyCached,
  listBlogsCached,
  listBlogCategories,
  listBlogTags,
  listPromptsCached,
  logEvent,
  saveUploadedImage,
  savePromptOnly,
  setBlogPublished,
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
const LEVEL_INFO = "info";
const LEVEL_ERROR = "error";
const PATH_API_HEALTH = "/api/health";
const PATH_API_PROMPTS = "/api/prompts";
const PATH_API_AI = "/api/ai";
const PATH_API_MOTD = "/api/message-of-day";
const PATH_API_BLOGS = "/api/blogs";
const PATH_API_BLOGS_ID = "/api/blogs/:id";
const PATH_API_BLOGS_PUBLISH = "/api/blogs/:id/publish";
const PATH_API_BLOGS_PUBLIC_ID = "/api/blogs/public/:id";
const PATH_API_BLOGS_DASHBOARD = "/api/blogs/dashboard";
const PATH_API_BLOG_CATEGORIES = "/api/blogs/categories";
const PATH_API_BLOG_TAGS = "/api/blogs/tags";
const PATH_API_BLOGS_ADMIN_LOGIN = "/api/blogs/admin/login";
const PATH_API_BLOGS_UPLOAD_IMAGE = "/api/blogs/upload-image";
const STATUS_BAD_REQUEST = 400;
const STATUS_UNAUTHORIZED = 401;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;
const STATUS_BAD_GATEWAY = 502;
const STATUS_SERVICE_UNAVAILABLE = 503;
const PROMPTS_CACHE_TTL_MS = 15000;
const AI_CACHE_TTL_MS = 300000;
const BLOG_CACHE_TTL_MS = 15000;
const MOTD_CACHE_HEADER = "public, max-age=3600, stale-while-revalidate=86400";
const ENV_API_PORT = "API_PORT";
const ENV_BLOG_ADMIN_PASSWORD = "BLOG_ADMIN_PASSWORD";
const ENV_BLOG_ADMIN_USER = "BLOG_ADMIN_USER";
const DEFAULT_API_PORT = 8787;
const DEFAULT_BLOG_ADMIN_USER = "admin";
const HEADER_ADMIN_TOKEN = "x-admin-token";
const ADMIN_SESSION_TTL_MS = 86400000;
const LOG_BOOT_TEXT = "API server running on";
const ERR_ADMIN_PASSWORD_REQUIRED = "Admin password is required";
const ERR_ADMIN_PASSWORD_INVALID = "Invalid admin password";
const ERR_ADMIN_TOKEN_REQUIRED = "Admin token is required";
const ERR_ADMIN_TOKEN_INVALID = "Admin session expired or invalid";
const ERR_IMAGE_REQUIRED = "Image file is required";
const ERR_IMAGE_TYPE_INVALID = "Only png, jpg, jpeg, webp are allowed";
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

const app = new Hono();
const adminSessions = new Map();

app.use("*", async (c, next) => {
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
  const motdRes = await getMessageOfDay();
  if (motdRes.err) {
    const publicErrRes = toPublicError(motdRes.err);
    return c.json(publicErrRes.value, STATUS_SERVICE_UNAVAILABLE);
  }

  c.header(CACHE_CONTROL, MOTD_CACHE_HEADER);
  return c.json({ quote: motdRes.value });
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

  const token = randomUUID();
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  adminSessions.set(token, expiresAt);
  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ token, expiresAt, user: process.env[ENV_BLOG_ADMIN_USER] || DEFAULT_BLOG_ADMIN_USER });
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
  if (!blogRes.value || !blogRes.value.published) {
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

  c.header(CACHE_CONTROL, CACHE_NO_STORE);
  return c.json({ deleted: deleteRes.value, id: idRes.value });
});

/**
 * @param {import("hono").Context} c
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function requireAdminSession(c) {
  const token = c.req.header(HEADER_ADMIN_TOKEN) || "";
  if (!token) {
    return { value: null, err: new Error(ERR_ADMIN_TOKEN_REQUIRED) };
  }

  const expiresAt = adminSessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return { value: null, err: new Error(ERR_ADMIN_TOKEN_INVALID) };
  }

  return { value: true, err: null };
}

const port = Number(process.env[ENV_API_PORT] || DEFAULT_API_PORT);
serve({ fetch: app.fetch, port });
const bootLogRes = logEvent(LEVEL_INFO, EVENT_API_BOOT, { port });
if (bootLogRes.err) {
  console.error(bootLogRes.err.message);
}
console.log(`${LOG_BOOT_TEXT} ${port}`);
