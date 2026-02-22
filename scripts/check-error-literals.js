const fs = require("fs");
const path = require("path");

const ROOTS = ["api", "web", "scripts"];
const FILE_EXTENSIONS = new Set([".js", ".jsx"]);
const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".tmp_budget_tool",
  ".tmp_slack_anime_tracker",
  "data",
  "logs"
]);
const LITERAL_ERROR_REGEX = /\b(?:new\s+)?Error\s*\(\s*(["'])(?:\\.|(?!\1).)*\1\s*\)/g;

/**
 * @param {string} root
 * @returns {string[]}
 */
function collectFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  /** @type {string[]} */
  const output = [];
  /** @type {string[]} */
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.has(ext)) {
        output.push(fullPath);
      }
    }
  }
  return output;
}

/**
 * @param {string} filePath
 * @returns {Array<{file: string, line: number, snippet: string}>}
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  /** @type {Array<{file: string, line: number, snippet: string}>} */
  const findings = [];
  let match = LITERAL_ERROR_REGEX.exec(content);
  while (match) {
    const index = match.index;
    const line = content.slice(0, index).split(/\r?\n/).length;
    findings.push({ file: filePath, line, snippet: match[0] });
    match = LITERAL_ERROR_REGEX.exec(content);
  }
  return findings;
}

/**
 * Critical path: fail CI/dev checks when string literals are used directly in Error constructors.
 */
function main() {
  const files = ROOTS.flatMap((root) => collectFiles(root));
  const findings = files.flatMap((filePath) => scanFile(filePath));
  if (findings.length < 1) {
    process.stdout.write("OK: no literal-string Error(...) calls found in .js/.jsx files.\n");
    process.exit(0);
    return;
  }

  process.stdout.write("FAIL: found literal-string Error(...) calls. Extract to constants.\n");
  for (const finding of findings) {
    process.stdout.write(`${finding.file}:${finding.line}: ${finding.snippet}\n`);
  }
  process.exit(1);
}

main();
