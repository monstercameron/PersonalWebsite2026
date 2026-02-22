import Database from "better-sqlite3";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = "data";
const DB_FILE = "app.db";
const ANILIST_API_URL = "https://graphql.anilist.co";
const CONTENT_TYPE_JSON = "application/json";
const LOG_EVENT_START = "anime_release_check_start";
const LOG_EVENT_COMPLETE = "anime_release_check_complete";
const LOG_EVENT_ERROR = "anime_release_check_error";
const LOG_EVENT_UPDATE = "anime_release_check_update";
const LOG_LEVEL_INFO = "info";
const LOG_LEVEL_ERROR = "error";
const SQL_LIST_TRACKED = "SELECT id, anilist_id, title, episodes, anime_status FROM tracked_anime ORDER BY id ASC";
const SQL_UPDATE_TRACKED = "UPDATE tracked_anime SET episodes = ?, anime_status = ?, updated_at = ? WHERE anilist_id = ?";
const GRAPHQL_IDS_QUERY = "query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id status episodes title { romaji english native } nextAiringEpisode { episode airingAt timeUntilAiring } } } }";
const CHUNK_SIZE = 40;

/**
 * @param {"info" | "error"} level
 * @param {string} event
 * @param {Record<string, unknown>} [meta]
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function logLine(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, meta });
  console.log(line);
  return { value: true, err: null };
}

/**
 * @param {Array<number>} ids
 * @returns {Array<Array<number>>}
 */
function chunkIds(ids) {
  const chunks = [];
  let index = 0;
  while (index < ids.length) {
    chunks.push(ids.slice(index, index + CHUNK_SIZE));
    index += CHUNK_SIZE;
  }
  return chunks;
}

/**
 * @param {Array<number>} ids
 * @returns {Promise<{ value: Map<number, {status: string, episodes: number}> | null, err: Error | null }>}
 */
async function fetchAnimeByIds(ids) {
  const resultMap = new Map();
  const chunks = chunkIds(ids);
  for (const chunk of chunks) {
    const responseRes = await fromPromise(fetch(ANILIST_API_URL, {
      method: "POST",
      headers: { "Content-Type": CONTENT_TYPE_JSON },
      body: JSON.stringify({
        query: GRAPHQL_IDS_QUERY,
        variables: { ids: chunk }
      })
    }));
    if (responseRes.err) {
      return { value: null, err: responseRes.err };
    }
    if (!responseRes.value.ok) {
      return { value: null, err: new Error(`AniList request failed with status ${responseRes.value.status}`) };
    }
    const jsonRes = await fromPromise(responseRes.value.json());
    if (jsonRes.err) {
      return { value: null, err: jsonRes.err };
    }
    const json = jsonRes.value;
    const mediaRows = Array.isArray(json?.data?.Page?.media) ? json.data.Page.media : [];
    for (const row of mediaRows) {
      const id = Number(row?.id || 0);
      if (id <= 0) {
        continue;
      }
      resultMap.set(id, {
        status: String(row?.status || "").trim(),
        episodes: Number(row?.episodes || 0)
      });
    }
  }
  return { value: resultMap, err: null };
}

/**
 * @returns {Promise<{ value: boolean | null, err: Error | null }>}
 */
export async function runAnimeReleaseCheckJob() {
  const dbFile = resolve(process.cwd(), DATA_DIR, DB_FILE);
  const db = new Database(dbFile);
  const startLogRes = logLine(LOG_LEVEL_INFO, LOG_EVENT_START, { dbFile });
  if (startLogRes.err) {
    return { value: null, err: startLogRes.err };
  }

  const tracked = db.prepare(SQL_LIST_TRACKED).all();
  if (!Array.isArray(tracked) || tracked.length < 1) {
    const completeLogRes = logLine(LOG_LEVEL_INFO, LOG_EVENT_COMPLETE, { checked: 0, updated: 0 });
    if (completeLogRes.err) {
      return { value: null, err: completeLogRes.err };
    }
    return { value: true, err: null };
  }

  const ids = tracked.map((row) => Number(row.anilist_id || 0)).filter((id) => id > 0);
  const remoteRes = await fetchAnimeByIds(ids);
  if (remoteRes.err) {
    return { value: null, err: remoteRes.err };
  }

  let updatedCount = 0;
  const nowIso = new Date().toISOString();
  const updateStmt = db.prepare(SQL_UPDATE_TRACKED);
  for (const row of tracked) {
    const anilistId = Number(row.anilist_id || 0);
    const remote = remoteRes.value.get(anilistId);
    if (!remote) {
      continue;
    }
    const oldEpisodes = Number(row.episodes || 0);
    const oldStatus = String(row.anime_status || "").trim();
    const newEpisodes = Number(remote.episodes || 0);
    const newStatus = String(remote.status || "").trim();
    if (oldEpisodes === newEpisodes && oldStatus === newStatus) {
      continue;
    }
    updateStmt.run(newEpisodes, newStatus, nowIso, anilistId);
    updatedCount += 1;
    const updateLogRes = logLine(LOG_LEVEL_INFO, LOG_EVENT_UPDATE, {
      anilistId,
      title: String(row.title || ""),
      from: { episodes: oldEpisodes, status: oldStatus },
      to: { episodes: newEpisodes, status: newStatus }
    });
    if (updateLogRes.err) {
      return { value: null, err: updateLogRes.err };
    }
  }

  const completeLogRes = logLine(LOG_LEVEL_INFO, LOG_EVENT_COMPLETE, { checked: tracked.length, updated: updatedCount });
  if (completeLogRes.err) {
    return { value: null, err: completeLogRes.err };
  }
  return { value: true, err: null };
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<{ value: T | null, err: Error | null }>}
 */
function fromPromise(promise) {
  return promise.then(
    (value) => ({ value, err: null }),
    (err) => ({ value: null, err: err instanceof Error ? err : new Error(String(err)) })
  );
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryFile && resolve(currentFile) === entryFile) {
  const mainPromise = runAnimeReleaseCheckJob();
  mainPromise.then((res) => {
    if (res.err) {
      logLine(LOG_LEVEL_ERROR, LOG_EVENT_ERROR, { message: res.err.message });
      process.exitCode = 1;
      return;
    }
    process.exitCode = 0;
  });
}
