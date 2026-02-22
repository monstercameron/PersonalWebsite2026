import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logEvent, runAnimeReleaseCheckJob } from "./app.impure.js";

const LOG_EVENT_START = "anime_release_check_start";
const LOG_EVENT_ERROR = "anime_release_check_error";
const LOG_LEVEL_ERROR = "error";

/**
 * @param {"info" | "error"} level
 * @param {string} event
 * @param {Record<string, unknown>} [meta]
 * @returns {{ value: boolean | null, err: Error | null }}
 */
function logLine(level, event, meta = {}) {
  return logEvent(level, event, meta);
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
