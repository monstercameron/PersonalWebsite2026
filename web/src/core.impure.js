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
const API_BLOG_CATEGORIES_PATH = "/api/blogs/categories";
const API_BLOG_TAGS_PATH = "/api/blogs/tags";
const API_BLOG_UPLOAD_IMAGE_PATH = "/api/blogs/upload-image";
const MESSAGE_CACHE_TTL_MS = 60_000;
const BLOG_CACHE_TTL_MS = 15_000;
const METHOD_POST = "POST";
const METHOD_PUT = "PUT";
const METHOD_PATCH = "PATCH";
const METHOD_DELETE = "DELETE";
const HEADER_CONTENT_TYPE = "Content-Type";
const HEADER_ADMIN_TOKEN = "x-admin-token";
const CONTENT_TYPE_JSON = "application/json";
const STORAGE_BLOG_ADMIN_TOKEN = "blog_admin_token";

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
  const responseRes = await fromPromise(fetch(url, options));
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
 * @returns {Promise<Result<string>>}
 */
export async function fetchMessageOfDay() {
  const motdRes = await apiRequestCached(API_MESSAGE_OF_DAY_PATH, undefined, MESSAGE_CACHE_TTL_MS);
  if (motdRes.err) {
    return { value: null, err: motdRes.err };
  }

  if (!motdRes.value || typeof motdRes.value.quote !== "string") {
    return { value: null, err: new Error("Invalid message-of-day response") };
  }

  return { value: motdRes.value.quote, err: null };
}

/**
 * @returns {Promise<Result<Array<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string}>>>}
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
 * @returns {Promise<Result<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string}>>}
 */
export async function getBlog(id) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error("Admin login required") };
  }
  const res = await apiRequestCached(`${API_BLOGS_PATH}/${id}`, {
    headers: { [HEADER_ADMIN_TOKEN]: authRes.value }
  }, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value?.row || null, err: null };
}

/**
 * @param {number} id
 * @returns {Promise<Result<{id: number, title: string, slug: string, summary: string, content: string, published: number, created_at: string, updated_at: string, category?: {id: number, name: string} | null, tags?: Array<{id: number, name: string}>}>>}
 */
export async function getPublicBlog(id) {
  const res = await apiRequestCached(`${API_BLOGS_PUBLIC_PATH}/${id}`, undefined, BLOG_CACHE_TTL_MS);
  if (res.err) {
    return { value: null, err: res.err };
  }
  return { value: res.value?.row || null, err: null };
}

/**
 * @param {{title: string, summary: string, content: string, published: number}} payload
 * @returns {Promise<Result<{created: boolean, id: number}>>}
 */
export async function createBlog(payload) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error("Admin login required") };
  }

  const res = await apiRequest(API_BLOGS_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON, [HEADER_ADMIN_TOKEN]: authRes.value },
    body: JSON.stringify(payload)
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
  return { value: res.value, err: null };
}

/**
 * @param {number} id
 * @param {{title: string, summary: string, content: string, published: number}} payload
 * @returns {Promise<Result<{updated: boolean, id: number}>>}
 */
export async function updateBlog(id, payload) {
  const authRes = getBlogAdminToken();
  if (authRes.err) {
    return { value: null, err: authRes.err };
  }
  if (!authRes.value) {
    return { value: null, err: new Error("Admin login required") };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}`, {
    method: METHOD_PUT,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON, [HEADER_ADMIN_TOKEN]: authRes.value },
    body: JSON.stringify(payload)
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
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
    return { value: null, err: new Error("Admin login required") };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}${API_BLOGS_PUBLISH_SUFFIX}`, {
    method: METHOD_PATCH,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON, [HEADER_ADMIN_TOKEN]: authRes.value },
    body: JSON.stringify({ published: published ? 1 : 0 })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
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
    return { value: null, err: new Error("Admin login required") };
  }

  const res = await apiRequest(`${API_BLOGS_PATH}/${id}`, {
    method: METHOD_DELETE,
    headers: { [HEADER_ADMIN_TOKEN]: authRes.value }
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
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
    return { value: null, err: new Error("Admin login required") };
  }

  const res = await apiRequestCached(API_BLOGS_DASHBOARD_PATH, {
    headers: { [HEADER_ADMIN_TOKEN]: authRes.value }
  }, BLOG_CACHE_TTL_MS);
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
    return { value: null, err: new Error("Admin login required") };
  }
  const res = await apiRequest(API_BLOG_CATEGORIES_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON, [HEADER_ADMIN_TOKEN]: authRes.value },
    body: JSON.stringify({ name })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
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
    return { value: null, err: new Error("Admin login required") };
  }
  const res = await apiRequest(API_BLOG_TAGS_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_CONTENT_TYPE]: CONTENT_TYPE_JSON, [HEADER_ADMIN_TOKEN]: authRes.value },
    body: JSON.stringify({ name })
  });
  if (res.err) {
    return { value: null, err: res.err };
  }
  invalidateApiCache("/api/blogs");
  return { value: res.value, err: null };
}

/**
 * @param {string} password
 * @returns {Promise<Result<{token: string, expiresAt: number, user: string}>>}
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

  const token = typeof res.value?.token === "string" ? res.value.token : "";
  if (!token) {
    return { value: null, err: new Error("Login response missing token") };
  }

  localStorage.setItem(STORAGE_BLOG_ADMIN_TOKEN, token);
  invalidateApiCache("/api/blogs");
  return { value: res.value, err: null };
}

/**
 * @returns {Result<boolean>}
 */
export function logoutBlogAdmin() {
  localStorage.removeItem(STORAGE_BLOG_ADMIN_TOKEN);
  invalidateApiCache("/api/blogs");
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
    image.onerror = () => reject(new Error("Failed to load image"));
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
    return { value: null, err: new Error("Could not get canvas context") };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const blobRes = await fromPromise(new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  }));
  if (blobRes.err || !blobRes.value) {
    return { value: null, err: blobRes.err || new Error("Failed to encode image") };
  }
  const resized = new File([blobRes.value], `${file.name.replace(/\.[^.]+$/, "")}-resized.jpg`, { type: "image/jpeg" });
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
    return { value: null, err: new Error("Admin login required") };
  }

  const resizedRes = await resizeImageFile(file, 1800);
  if (resizedRes.err) {
    return { value: null, err: resizedRes.err };
  }

  const formData = new FormData();
  formData.append("image", resizedRes.value);
  const res = await apiRequest(API_BLOG_UPLOAD_IMAGE_PATH, {
    method: METHOD_POST,
    headers: { [HEADER_ADMIN_TOKEN]: authRes.value },
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
    return { value: null, err: new Error("Resume element not found") };
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
  const imageData = canvas.toDataURL("image/png");
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
