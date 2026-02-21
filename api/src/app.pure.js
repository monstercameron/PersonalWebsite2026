/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const ERR_BODY_OBJECT = "Body must be an object";
const ERR_PROMPT_REQUIRED = "Prompt is required";
const ERR_USER_PROMPT_REQUIRED = "User prompt is required";
const ERR_BLOG_TITLE_REQUIRED = "Blog title is required";
const ERR_BLOG_CONTENT_REQUIRED = "Blog content is required";
const ERR_BLOG_ID_REQUIRED = "Blog id is required";
const ERR_BLOG_ID_INVALID = "Blog id must be a positive integer";
const ERR_CATEGORY_NAME_REQUIRED = "Category name is required";
const ERR_TAG_NAME_REQUIRED = "Tag name is required";
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

/**
 * @param {unknown} rawId
 * @returns {Result<number>}
 */
export function validateBlogId(rawId) {
  if (rawId === null || rawId === undefined || rawId === "") {
    return { value: null, err: new Error(ERR_BLOG_ID_REQUIRED) };
  }

  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return { value: null, err: new Error(ERR_BLOG_ID_INVALID) };
  }

  return { value: id, err: null };
}

/**
 * @param {unknown} body
 * @returns {Result<{title: string, summary: string, content: string, published: number}>}
 */
export function validateBlogBody(body) {
  if (!body || typeof body !== "object") {
    return { value: null, err: new Error(ERR_BODY_OBJECT) };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const published = body.published ? 1 : 0;
  const categoryId = body.categoryId === null || body.categoryId === undefined || body.categoryId === "" ? null : Number(body.categoryId);
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean) : [];

  if (!title) {
    return { value: null, err: new Error(ERR_BLOG_TITLE_REQUIRED) };
  }

  if (!content) {
    return { value: null, err: new Error(ERR_BLOG_CONTENT_REQUIRED) };
  }

  return {
    value: { title, summary, content, published, categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null, tags },
    err: null
  };
}

/**
 * @param {unknown} body
 * @returns {Result<{name: string}>}
 */
export function validateCategoryBody(body) {
  if (!body || typeof body !== "object") {
    return { value: null, err: new Error(ERR_BODY_OBJECT) };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return { value: null, err: new Error(ERR_CATEGORY_NAME_REQUIRED) };
  }

  return { value: { name }, err: null };
}

/**
 * @param {unknown} body
 * @returns {Result<{name: string}>}
 */
export function validateTagBody(body) {
  if (!body || typeof body !== "object") {
    return { value: null, err: new Error(ERR_BODY_OBJECT) };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return { value: null, err: new Error(ERR_TAG_NAME_REQUIRED) };
  }

  return { value: { name }, err: null };
}
