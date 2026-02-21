/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const ERR_BODY_OBJECT = "Body must be an object";
const ERR_PROMPT_REQUIRED = "Prompt is required";
const ERR_USER_PROMPT_REQUIRED = "User prompt is required";
const PUBLIC_ERR_FALLBACK = "Unexpected error";
const PUBLIC_ERR_CODE = "APP_ERROR";
const PROMPT_PREFIX = "You are a concise assistant. User request:";

/**
 * @param {unknown} body
 * @returns {Result<{prompt: string}>}
 */
export function validatePromptBody(body) {
  if (!body || typeof body !== "object") {
    return { value: null, err: new Error(ERR_BODY_OBJECT) };
  }

  const prompt = body.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return { value: null, err: new Error(ERR_PROMPT_REQUIRED) };
  }

  return { value: { prompt: prompt.trim() }, err: null };
}

/**
 * @param {string} userPrompt
 * @returns {Result<string>}
 */
export function buildModelPrompt(userPrompt) {
  if (!userPrompt) {
    return { value: null, err: new Error(ERR_USER_PROMPT_REQUIRED) };
  }

  return { value: `${PROMPT_PREFIX} ${userPrompt}`, err: null };
}

/**
 * @param {unknown} err
 * @returns {Result<{message: string, code: string}>}
 */
export function toPublicError(err) {
  const message = err instanceof Error ? err.message : PUBLIC_ERR_FALLBACK;
  return { value: { message, code: PUBLIC_ERR_CODE }, err: null };
}
