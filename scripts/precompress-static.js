const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { pipeline } = require("node:stream/promises");

const ARG_DIST_DIR = process.argv[2] || "web/dist";
const TEXT_UTF8 = "utf8";
const FILE_EXTENSIONS = new Set([".js", ".css", ".html", ".svg", ".json", ".xml", ".txt", ".map"]);
const FILE_SUFFIX_GZIP = ".gz";
const FILE_SUFFIX_BROTLI = ".br";
const LOG_PREFIX = "[precompress-static]";
const ERR_DIST_NOT_FOUND = "Dist directory not found";
const ERR_STAT_FAILED = "Failed to stat path";
const ERR_READDIR_FAILED = "Failed to read directory";
const ERR_COMPRESS_FAILED = "Failed to compress file";
const BROTLI_PARAMS = {
  [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
  [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0
};

/**
 * @template T
 * @typedef {{ value: T|null, err: Error|null }} Result
 */

/**
 * @param {Promise<any>} promise
 * @returns {Promise<Result<any>>}
 */
function fromPromise(promise) {
  return promise.then(
    (value) => ({ value, err: null }),
    (err) => ({ value: null, err: err instanceof Error ? err : new Error(String(err)) })
  );
}

/**
 * @param {string} targetPath
 * @returns {Promise<Result<fs.Stats>>}
 */
async function statPath(targetPath) {
  const res = await fromPromise(fs.promises.stat(targetPath));
  if (res.err) {
    return { value: null, err: new Error(`${ERR_STAT_FAILED}: ${targetPath}`) };
  }
  return { value: res.value, err: null };
}

/**
 * @param {string} dirPath
 * @returns {Promise<Result<string[]>>}
 */
async function readDir(dirPath) {
  const res = await fromPromise(fs.promises.readdir(dirPath));
  if (res.err) {
    return { value: null, err: new Error(`${ERR_READDIR_FAILED}: ${dirPath}`) };
  }
  return { value: res.value, err: null };
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function shouldCompressFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSIONS.has(ext);
}

/**
 * @param {string} filePath
 * @returns {Promise<Result<string[]>>}
 */
async function compressFile(filePath) {
  const gzipPath = `${filePath}${FILE_SUFFIX_GZIP}`;
  const brPath = `${filePath}${FILE_SUFFIX_BROTLI}`;
  const gzip = zlib.createGzip({ level: 9 });
  const brotli = zlib.createBrotliCompress({ params: BROTLI_PARAMS });

  const gzipRes = await fromPromise(pipeline(fs.createReadStream(filePath), gzip, fs.createWriteStream(gzipPath)));
  if (gzipRes.err) {
    return { value: null, err: new Error(`${ERR_COMPRESS_FAILED}: ${filePath}${FILE_SUFFIX_GZIP}`) };
  }
  const brRes = await fromPromise(pipeline(fs.createReadStream(filePath), brotli, fs.createWriteStream(brPath)));
  if (brRes.err) {
    return { value: null, err: new Error(`${ERR_COMPRESS_FAILED}: ${filePath}${FILE_SUFFIX_BROTLI}`) };
  }
  return { value: [gzipPath, brPath], err: null };
}

/**
 * @param {string} dirPath
 * @returns {Promise<Result<string[]>>}
 */
async function walkFiles(dirPath) {
  const entriesRes = await readDir(dirPath);
  if (entriesRes.err) {
    return { value: null, err: entriesRes.err };
  }

  const files = [];
  for (const entry of entriesRes.value) {
    const fullPath = path.join(dirPath, entry);
    const statRes = await statPath(fullPath);
    if (statRes.err) {
      return { value: null, err: statRes.err };
    }
    if (statRes.value.isDirectory()) {
      const nestedRes = await walkFiles(fullPath);
      if (nestedRes.err) {
        return { value: null, err: nestedRes.err };
      }
      files.push(...nestedRes.value);
      continue;
    }
    files.push(fullPath);
  }

  return { value: files, err: null };
}

/**
 * @param {string} distDir
 * @returns {Promise<Result<{compressedCount: number, outputFiles: number}>>}
 */
async function precompressDir(distDir) {
  const statRes = await statPath(distDir);
  if (statRes.err || !statRes.value?.isDirectory()) {
    return { value: null, err: new Error(`${ERR_DIST_NOT_FOUND}: ${distDir}`) };
  }

  const filesRes = await walkFiles(distDir);
  if (filesRes.err) {
    return { value: null, err: filesRes.err };
  }

  let compressedCount = 0;
  let outputFiles = 0;
  for (const filePath of filesRes.value) {
    if (!shouldCompressFile(filePath)) {
      continue;
    }
    const outRes = await compressFile(filePath);
    if (outRes.err) {
      return { value: null, err: outRes.err };
    }
    compressedCount += 1;
    outputFiles += outRes.value.length;
  }

  return { value: { compressedCount, outputFiles }, err: null };
}

/**
 * @returns {Promise<Result<boolean>>}
 */
async function main() {
  const runRes = await precompressDir(ARG_DIST_DIR);
  if (runRes.err) {
    console.error(`${LOG_PREFIX} error`, runRes.err.message);
    return { value: null, err: runRes.err };
  }
  console.log(
    `${LOG_PREFIX} ok`,
    JSON.stringify({
      distDir: ARG_DIST_DIR,
      compressedFiles: runRes.value.compressedCount,
      generatedArtifacts: runRes.value.outputFiles
    })
  );
  return { value: true, err: null };
}

main().then((res) => {
  if (res.err) {
    process.exitCode = 1;
  }
});
