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
const MESSAGE_CACHE_TTL_MS = 60_000;

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
