/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const apiCache = new Map();
const METHOD_GET = "GET";
const EMPTY_STRING = "";
const ERR_REQUEST_STATUS = "Request failed with status";
const DEFAULT_CACHE_TTL_MS = 30000;

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
