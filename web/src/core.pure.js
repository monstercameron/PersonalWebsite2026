/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Resume", href: "/resume" },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
  { label: "AI Workshop", href: "/aiworkshop" },
  { label: "GitHub", href: "https://github.com/monstercameron", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/earl-cameron/", external: true },
  { label: "YouTube", href: "https://www.youtube.com/@EarlCameron007", external: true },
  { label: "RSS", href: "http://reader.earlcameron.com/", external: true }
];
const ERR_YEAR_NUMBER = "Year must be a number";
const ERR_EXPECTED_STRING = "Expected a string value";
const ERR_EXPECTED_NON_EMPTY = "Expected a non-empty string";
const COPYRIGHT_PREFIX = "(c)";
const COPYRIGHT_NAME = "Earl Cameron";

/**
 * @returns {Result<Array<{label: string, href: string, external?: boolean}>>}
 */
export function buildNavItems() {
  return { value: NAV_ITEMS, err: null };
}

/**
 * @param {number} year
 * @returns {Result<string>}
 */
export function getYearLabel(year) {
  if (typeof year !== "number" || Number.isNaN(year)) {
    return { value: null, err: new Error(ERR_YEAR_NUMBER) };
  }

  return { value: `${COPYRIGHT_PREFIX} ${year} ${COPYRIGHT_NAME}`, err: null };
}

/**
 * @param {unknown} value
 * @returns {Result<string>}
 */
export function requireNonEmptyString(value) {
  if (typeof value !== "string") {
    return { value: null, err: new Error(ERR_EXPECTED_STRING) };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null, err: new Error(ERR_EXPECTED_NON_EMPTY) };
  }

  return { value: trimmed, err: null };
}
