import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { buildModelPrompt, toPublicError, validatePromptBody } from "./app.pure.js";
import {
  fromPromise,
  generateReplyCached,
  listPromptsCached,
  logEvent,
  savePromptOnly
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
const STATUS_BAD_REQUEST = 400;
const STATUS_SERVER_ERROR = 500;
const STATUS_BAD_GATEWAY = 502;
const PROMPTS_CACHE_TTL_MS = 15000;
const AI_CACHE_TTL_MS = 300000;
const ENV_API_PORT = "API_PORT";
const DEFAULT_API_PORT = 8787;
const LOG_BOOT_TEXT = "API server running on";

const app = new Hono();

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

const port = Number(process.env[ENV_API_PORT] || DEFAULT_API_PORT);
serve({ fetch: app.fetch, port });
const bootLogRes = logEvent(LEVEL_INFO, EVENT_API_BOOT, { port });
if (bootLogRes.err) {
  console.error(bootLogRes.err.message);
}
console.log(`${LOG_BOOT_TEXT} ${port}`);
