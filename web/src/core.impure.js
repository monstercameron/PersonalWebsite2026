/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const apiCache = new Map();
const METHOD_GET = "GET";
const EMPTY_STRING = "";
const ERR_REQUEST_STATUS = "Request failed with status";
const DEFAULT_CACHE_TTL_MS = 30000;
const PDF_FORMAT = "a4";
const PDF_UNIT = "pt";
const PDF_PORTRAIT = "p";
const PDF_MARGIN = 20;
const PDF_FILENAME_DEFAULT = "EarlCameron-Resume.pdf";
const API_MESSAGE_OF_DAY_PATH = "/api/message-of-day";
const API_BLOGS_PATH = "/api/blogs";
const API_BLOGS_PUBLISH_SUFFIX = "/publish";
const API_BLOGS_PUBLIC_PATH = "/api/blogs/public";
const API_BLOGS_DASHBOARD_PATH = "/api/blogs/dashboard";
const API_BLOGS_ADMIN_LOGIN_PATH = "/api/blogs/admin/login";
const API_BLOGS_ADMIN_LOGOUT_PATH = "/api/blogs/admin/logout";
const API_BLOG_CATEGORIES_PATH = "/api/blogs/categories";
const API_BLOG_TAGS_PATH = "/api/blogs/tags";
const API_BLOG_UPLOAD_IMAGE_PATH = "/api/blogs/upload-image";
const API_SLACKANIME_SEARCH_PATH = "/api/slackanime/search";
const API_SLACKANIME_TRACKED_PATH = "/api/slackanime/tracked";
const API_SLACKANIME_QUESTION_PATH = "/api/slackanime/question/today";
const API_SLACKANIME_FEED_PATH = "/api/slackanime/feed.xml";
const API_SLACKANIME_FEED_TRACKED_PATH = "/api/slackanime/feed/tracked.xml";
const API_SLACKANIME_FEED_QUESTIONS_PATH = "/api/slackanime/feed/questions.xml";
const MESSAGE_CACHE_TTL_MS = 60_000;
const BLOG_CACHE_TTL_MS = 15_000;
const ANIME_CACHE_TTL_MS = 30_000;
const METHOD_POST = "POST";
const METHOD_PUT = "PUT";
const METHOD_PATCH = "PATCH";
const METHOD_DELETE = "DELETE";
const HEADER_CONTENT_TYPE = "Content-Type";
const CONTENT_TYPE_JSON = "application/json";
const STORAGE_BLOG_ADMIN_TOKEN = "blog_admin_token";
const STORAGE_BLOG_ADMIN_FLAG = "1";
const CACHE_PREFIX_BLOGS = "/api/blogs";
const ERR_INVALID_MOTD_RESPONSE = "Invalid message-of-day response";
const ERR_ADMIN_LOGIN_REQUIRED = "Admin login required";
const ERR_FAILED_LOAD_IMAGE = "Failed to load image";
const ERR_CANVAS_CONTEXT_MISSING = "Could not get canvas context";
const ERR_IMAGE_ENCODE_FAILED = "Failed to encode image";
const ERR_RESUME_ELEMENT_NOT_FOUND = "Resume element not found";
const MIME_IMAGE_JPEG = "image/jpeg";
const MIME_IMAGE_PNG = "image/png";

/**
 * @returns {Result<number>}
 */
export function getCurrentYear() {
  return { value: new Date().getFullYear(), err: null };
}

/**
 * @template T
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Result<T>>}
 */
export async function apiRequest(url, options) {
  const requestOptions = { credentials: "include", ...(options || {}) };
  const responseRes = await fromPromise(fetch(url, requestOptions));
  if (responseRes.err) {
    return { value: null, err: responseRes.err };
  }

  if (!responseRes.value.ok) {
    return { value: null, err: new Error(`${ERR_REQUEST_STATUS} ${responseRes.value.status}`) };
  }

  return fromPromise(responseRes.value.json());
}

/**
 * @template T
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [ttlMs]
 * @returns {Promise<Result<T>>}
 */
export async function apiRequestCached(url, options, ttlMs = DEFAULT_CACHE_TTL_MS) {
  const method = options?.method || METHOD_GET;
  const body = typeof options?.body === "string" ? options.body : EMPTY_STRING;
  const cacheKey = `${method}:${url}:${body}`;
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return { value: cached.value, err: null };
  }

  const resultRes = await apiRequest(url, options);
  if (resultRes.err) {
    return { value: null, err: resultRes.err };
  }

  apiCache.set(cacheKey, { value: resultRes.value, expiresAt: now + ttlMs });
  return { value: resultRes.value, err: null };
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<Result<string>>}
 */
export async function fetchMessageOfDay(forceRefresh = false) {
  const motdUrl = forceRefresh
    ? `${API_MESSAGE_OF_DAY_PATH}?refresh=1&t=${Date.now()}`
    : API_MESSAGE_OF_DAY_PATH;
  const motdRes = forceRefresh
    ? await apiRequest(motdUrl)
    : await apiRequestCached(motdUrl, undefined, MESSAGE_CACHE_TTL_MS);
  if (motdRes.err) {
    return { value: null, err: motdRes.err };
  }

  if (!motdRes.value || typeof motdRes.value.quote !== "string") {
    return { value: null, err: new Error(ERR_INVALID_MOTD_RESPONSE) };
  }

  return { value: motdRes.value.quote, err: null };
}

/**
 * @param {string} query
 * @returns {Promise<Result<Array<{anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>>}
 */
export async function searchSlackAnime(query) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const normalized = String(query || "").trim();
  if (!normalized) {
    return { value: [], err: null };
  }
  const encoded = encodeURIComponent(normalized);
  const res = await apiRequestCached(`${API_SLACKANIME_SEARCH_PATH}?q=${encoded}`, undefined, ANIME_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: Array.isArray(res.value?.rows) ? res.value.rows : [], err: null };
}

/**
 * @returns {Promise<Result<{dateKey: string, question: string, index: number} | null>>}
 */
export async function fetchSlackAnimeQuestionOfDay() {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequestCached(API_SLACKANIME_QUESTION_PATH, undefined, MESSAGE_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  const row = res.value?.row;
  if (!row || typeof row !== "object") {
    return { value: null, err: null };
  }
  return {
    value: {
      dateKey: String(row.dateKey || ""),
      question: String(row.question || ""),
      index: Number(row.index || 0)
    },
    err: null
  };
}

/**
 * @returns {Result<string>}
 */
export function getSlackAnimeFeedUrl() {
  return { value: API_SLACKANIME_FEED_TRACKED_PATH || API_SLACKANIME_FEED_PATH, err: null };
}

/**
 * @returns {Result<{tracked: string, questions: string}>}
 */
export function getSlackAnimeFeedUrls() {
  return {
    value: {
      tracked: API_SLACKANIME_FEED_TRACKED_PATH || API_SLACKANIME_FEED_PATH,
      questions: API_SLACKANIME_FEED_QUESTIONS_PATH
    },
    err: null
  };
}

/**
 * @returns {Promise<Result<Array<{id: number, anilistId: number, title: string, coverImage: string, status: string, episodes: number, format: string, seasonYear: number, siteUrl: string}>>>}
 */
export async function listTrackedSlackAnime() {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequest(API_SLACKANIME_TRACKED_PATH);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: Array.isArray(res.value?.rows) ? res.value.rows : [], err: null };
}

/**
 * @param {{anilistId: number, title: string, coverImage?: string, status?: string, episodes?: number, format?: string, seasonYear?: number, siteUrl?: string}} anime
 * @returns {Promise<Result<{saved: boolean}>>}
 */
export async function trackSlackAnime(anime) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequest(API_SLACKANIME_TRACKED_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify(anime)
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(API_SLACKANIME_TRACKED_PATH);
  return { value: { saved: true }, err: null };
}

/**
 * @param {number} anilistId
 * @returns {Promise<Result<{removed: boolean}>>}
 */
export async function untrackSlackAnime(anilistId) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequest(`${API_SLACKANIME_TRACKED_PATH}/${anilistId}`, { method: METHOD_DELETE });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(API_SLACKANIME_TRACKED_PATH);
  return { value: { removed: true }, err: null };
}

/**
 * @returns {Promise<Result<Array<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string}>>>}
 */
export async function listBlogs() {
  const res = await apiRequestCached(API_BLOGS_PATH, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: Array.isArray(res.value?.rows) ? res.value.rows : [], err: null };
}

/**
 * @param {number} id
 * @returns {Promise<Result<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string}>>}
 */
export async function getBlog(id) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequestCached(`${API_BLOGS_PATH}/${id}`, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value?.row || null, err: null };
}

/**
 * @param {number} id
 * @returns {Promise<Result<{id: number, title: string, slug: string, summary: string, content: string, variant: string, published: number, created_at: string, updated_at: string, category?: {id: number, name: string} | null, tags?: Array<{id: number, name: string}>}>>}
 */
export async function getPublicBlog(id) {
  const res = await apiRequestCached(`${API_BLOGS_PUBLIC_PATH}/${id}`, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value?.row || null, err: null };
}

/**
 * @param {{title: string, summary: string, content: string, variant: string, published: number}} payload
 * @returns {Promise<Result<{created: boolean, id: number}>>}
 */
export async function createBlog(payload) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const res = await apiRequest(API_BLOGS_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify(payload)
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @param {number} id
 * @param {{title: string, summary: string, content: string, variant: string, published: number}} payload
 * @returns {Promise<Result<{updated: boolean, id: number}>>}
 */
export async function updateBlog(id, payload) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}`, {
    method: METHOD_PUT,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify(payload)
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @param {number} id
 * @param {number} published
 * @returns {Promise<Result<{updated: boolean, id: number, published: number}>>}
 */
export async function setBlogPublished(id, published) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}${API_BLOGS_PUBLISH_SUFFIX}`, {
    method: METHOD_PATCH,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify({ published: published ? 1 : 0 })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @param {number} id
 * @returns {Promise<Result<{deleted: boolean, id: number}>>}
 */
export async function deleteBlog(id) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}`, {
    method: METHOD_DELETE
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @returns {Promise<Result<{total: number, published: number, drafts: number}>>}
 */
export async function getBlogsDashboard() {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const res = await apiRequestCached(API_BLOGS_DASHBOARD_PATH, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value?.dashboard || { total: 0, published: 0, drafts: 0 }, err: null };
}

/**
 * @returns {Promise<Result<Array<{id: number, name: string, created_at: string}>>>}
 */
export async function listBlogCategories() {
  const res = await apiRequestCached(API_BLOG_CATEGORIES_PATH, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: Array.isArray(res.value?.rows) ? res.value.rows : [], err: null };
}

/**
 * @returns {Promise<Result<Array<{id: number, name: string, created_at: string}>>>}
 */
export async function listBlogTags() {
  const res = await apiRequestCached(API_BLOG_TAGS_PATH, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: Array.isArray(res.value?.rows) ? res.value.rows : [], err: null };
}

/**
 * @param {string} name
 * @returns {Promise<Result<{created: boolean, id: number}>>}
 */
export async function createBlogCategory(name) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequest(API_BLOG_CATEGORIES_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify({ name })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @param {string} name
 * @returns {Promise<Result<{created: boolean, id: number}>>}
 */
export async function createBlogTag(name) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }
  const res = await apiRequest(API_BLOG_TAGS_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify({ name })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @param {string} password
 * @returns {Promise<Result<{expiresAt: number, user: string}>>}
 */
export async function loginBlogAdmin(password) {
  const res = await apiRequest(API_BLOGS_ADMIN_LOGIN_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON },
    body: JSON.stringify({ password })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }

  localStorage.setItem(STORAGE_BLOG_ADMIN_TOKEN, STORAGE_BLOG_ADMIN_FLAG);
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: res.value, err: null };
}

/**
 * @returns {Promise<Result<boolean>>}
 */
export async function logoutBlogAdmin() {
  const res = await apiRequest(API_BLOGS_ADMIN_LOGOUT_PATH, { method: METHOD_POST });
  if (res.err) {
    return { value: null, err: res.err };
  }
  localStorage.removeItem(STORAGE_BLOG_ADMIN_TOKEN);
  invalidateApiCache(CACHE_PREFIX_BLOGS);
  return { value: true, err: null };
}

/**
 * @returns {Result<string | null>}
 */
export function getBlogAdminToken() {
  return { value: localStorage.getItem(STORAGE_BLOG_ADMIN_TOKEN), err: null };
}

/**
 * @param {File} file
 * @param {number} [maxWidth]
 * @returns {Promise<Result<File>>}
 */
export async function resizeImageFile(file, maxWidth = 1600) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  const loadRes = await fromPromise(new Promise((resolve, reject) => {
    image.onload = () => resolve(true);
    image.onerror = () => reject(new Error(ERR_FAILED_LOAD_IMAGE));
    image.src = objectUrl;
  }));
  URL.revokeObjectURL(objectUrl);
  if (loadRes.err) {
    return { value: null, err: loadRes.err };
  }

  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { value: null, err: new Error(ERR_CANVAS_CONTEXT_MISSING) };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const blobRes = await fromPromise(new Promise((resolve) => {
    canvas.toBlob(resolve, MIME_IMAGE_JPEG, 0.9);
  }));
  if (blobRes.err || !blobRes.value) {
    return { value: null, err: blobRes.err || new Error(ERR_IMAGE_ENCODE_FAILED) };
  }
  const resized = new File([blobRes.value], `${file.name.replace(/\.[^.]+$/, "")}-resized.jpg`, { type: MIME_IMAGE_JPEG });
  return { value: resized, err: null };
}

/**
 * @param {File} file
 * @returns {Promise<Result<{uploaded: boolean, url: string, fileName: string}>>}
 */
export async function uploadBlogImage(file) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error(ERR_ADMIN_LOGIN_REQUIRED) };
  }

  const resizedRes = await resizeImageFile(file, 1800);
  if (resizedRes.err) {
    return { value: null, err: resizedRes.err };
  }

  const formData = new FormData();
  formData.append("image", resizedRes.value);
  const res = await apiRequest(API_BLOG_UPLOAD_IMAGE_PATH, {
    method: METHOD_POST,
    body: formData
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value, err: null };
}

/**
 * @param {string} [prefix]
 * @returns {Result<boolean>}
 */
export function invalidateApiCache(prefix = EMPTY_STRING) {
  if (!prefix) {
    apiCache.clear();
    return { value: true, err: null };
  }

  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }

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
 * Critical path: capture live styled resume HTML and download as PDF for the client.
 * @param {HTMLElement | null} element
 * @param {string} [fileName]
 * @returns {Promise<Result<boolean>>}
 */
export async function downloadResumePdf(element, fileName = PDF_FILENAME_DEFAULT) {
  if (!element) {
    return { value: null, err: new Error(ERR_RESUME_ELEMENT_NOT_FOUND) };
  }

  const modulesRes = await fromPromise(Promise.all([import("html2canvas"), import("jspdf")]));
  if (modulesRes.err) {
    return { value: null, err: modulesRes.err };
  }

  const html2canvas = modulesRes.value[0].default;
  const jsPDF = modulesRes.value[1].jsPDF;

  const canvasRes = await fromPromise(
    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
  );
  if (canvasRes.err) {
    return { value: null, err: canvasRes.err };
  }

  const canvas = canvasRes.value;
  const imageData = canvas.toDataURL(MIME_IMAGE_PNG);
  const pdf = new jsPDF(PDF_PORTRAIT, PDF_UNIT, PDF_FORMAT);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  const scaledHeight = (canvas.height * contentWidth) / canvas.width;

  let remainingHeight = scaledHeight;
  let offsetY = 0;

  pdf.addImage(imageData, "PNG", PDF_MARGIN, PDF_MARGIN, contentWidth, scaledHeight);
  remainingHeight -= pageHeight - PDF_MARGIN * 2;

  while (remainingHeight > 0) {
    offsetY += pageHeight - PDF_MARGIN * 2;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", PDF_MARGIN, PDF_MARGIN - offsetY, contentWidth, scaledHeight);
    remainingHeight -= pageHeight - PDF_MARGIN * 2;
  }

  pdf.save(fileName || PDF_FILENAME_DEFAULT);
  return { value: true, err: null };
}

