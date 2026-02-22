/**
 * @template T
 * @typedef {{ value: T | null, err: Error | null }} Result
 */

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "IconHome" },
  { label: "Resume", href: "/resume", icon: "IconResume" },
  { label: "Projects", href: "/projects", icon: "IconProjects" },
  { label: "SlackAnime", href: "/slackanime", icon: "IconTerminal" },
  { label: "Budget", href: "/budget", icon: "IconDollar" },
  { label: "Blog", href: "/blog", icon: "IconBlog" },
  { label: "AI Workshop", href: "/aiworkshop", icon: "IconBot" },
  { label: "GitHub", href: "https://github.com/monstercameron", external: true, icon: "IconGitHub" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/earl-cameron/", external: true, icon: "IconLinkedIn" },
  { label: "YouTube", href: "https://www.youtube.com/@EarlCameron007", external: true, icon: "IconYouTube" },
  { label: "RSS", href: "http://reader.earlcameron.com/", external: true, icon: "IconRSS" }
];
const ERR_YEAR_NUMBER = "Year must be a number";
const ERR_EXPECTED_STRING = "Expected a string value";
const ERR_EXPECTED_NON_EMPTY = "Expected a non-empty string";
const ERR_DATE_KEY_REQUIRED = "Date key is required";
const COPYRIGHT_PREFIX = "(c)";
const COPYRIGHT_NAME = "Earl Cameron";
const HOME_WILDCARDS = [
  "systems-level clarity",
  "execution under constraints",
  "design-to-build realism",
  "high-signal collaboration",
  "cross-domain architecture",
  "pragmatic tradeoff discipline",
  "observability-first operations",
  "modular upgrade paths",
  "manufacturable outcomes",
  "latency-aware runtime design",
  "throughput-minded engineering",
  "reproducible delivery workflows",
  "interface-first planning",
  "failure-mode visibility",
  "tooling leverage",
  "constraint-first discovery",
  "operator-friendly systems",
  "clean deployment boundaries",
  "real-world maintainability",
  "iterative proof loops",
  "hardware/software integration",
  "cost-aware decision making",
  "clear ownership seams",
  "decision-ready communication"
];

const HERO_OPENERS = [
  "Systems thinker",
  "Execution-first builder",
  "Constraint-driven engineer",
  "Pragmatic architect",
  "Cross-domain problem solver",
  "Production-focused maker",
  "High-signal operator",
  "Design-to-build strategist",
  "Interface-first planner",
  "Reliability-minded engineer",
  "Runtime-focused builder",
  "Ops-aware software engineer",
  "Modular systems designer",
  "Tooling-centric developer",
  "Manufacturing-aware technologist",
  "Latency-aware implementer",
  "Observability-focused lead",
  "Outcome-oriented collaborator",
  "Architecture-minded executor",
  "Iterative systems builder"
];

const HERO_ENDINGS = [
  "that ships",
  "under pressure",
  "with clear tradeoffs",
  "for real production use",
  "with maintainable boundaries",
  "without hand-wavy assumptions",
  "with measurable outcomes",
  "and minimal waste",
  "with long-term upgrade paths",
  "for team-scale execution",
  "with serviceability in mind",
  "and explicit constraints",
  "with instrumentation baked in",
  "with practical deployment plans",
  "with stable operating models",
  "for high-leverage impact",
  "with testable interfaces",
  "with build-to-operate rigor",
  "without sacrificing velocity",
  "with strong ownership"
];

const HOME_INTERESTS = [
  "mechanical packaging and fitment",
  "electrification and power architecture",
  "GPU/runtime performance paths",
  "interactive tools with fast feedback loops",
  "worldbuilding with consistent internal rules",
  "travel planning with logistics depth",
  "fitness routines with measurable progression",
  "budget systems that reflect real constraints",
  "practical automation to reduce manual churn",
  "modular design for easy replacement and upgrades",
  "low-level performance and reliability tuning",
  "clean CI/build systems for reproducible delivery",
  "hardware-software integration prototypes",
  "operability-focused API boundaries",
  "maintainability-first architecture",
  "conflict-system design and game mechanics",
  "local AI inference and model deployment tradeoffs",
  "hands-on design and fabrication workflows",
  "field-tested fallback and recovery patterns",
  "high-leverage tooling for teams"
];

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

/**
 * @param {string} dateKey
 * @returns {Result<{
 * heroTitle: string,
 * heroBody: string,
 * heroCaption: string,
 * todayLens: string,
 * metrics: string[],
 * operatingHeading: string,
 * operatingItems: Array<{key: string, val: string}>,
 * beyondHeading: string,
 * beyondItems: Array<{key: string, val: string}>,
 * youtubeLead: string
 * }>}
 */
export function getDailyHomeContent(dateKey) {
  const dateKeyRes = requireNonEmptyString(dateKey);
  if (dateKeyRes.err) {
    return { value: null, err: new Error(ERR_DATE_KEY_REQUIRED) };
  }
  const key = dateKeyRes.value;

  const pick = (pool, slot) => {
    const hashRes = hashText(`${key}:${slot}`);
    if (hashRes.err) {
      return "";
    }
    return pool[Math.abs(hashRes.value) % pool.length];
  };
  const pickWildcard = (slot) => pick(HOME_WILDCARDS, `wild:${slot}`);
  const pickInterest = (slot) => pick(HOME_INTERESTS, `interest:${slot}`);
  const uniqueMetricsRes = uniquePick(HOME_WILDCARDS, key, "metric", 4);
  if (uniqueMetricsRes.err) {
    return { value: null, err: uniqueMetricsRes.err };
  }
  const uniqueMetrics = uniqueMetricsRes.value;

  const value = {
    heroTitle: `${pick(HERO_OPENERS, "hero:title:left")}. ${pick(HERO_OPENERS, "hero:title:right")}. ${pick(HERO_ENDINGS, "hero:title:end")}.`,
    heroBody: `I frame work as interacting subsystems and drive toward buildable outcomes through ${pickWildcard(1)}, ${pickWildcard(2)}, and ${pickWildcard(3)}.`,
    heroCaption: `Daily focus: ${pickInterest(1)}.`,
    todayLens: `Today's lens: ${pickWildcard(4)} + ${pickWildcard(5)}.`,
    metrics: uniqueMetrics.map((item) => {
      const metricRes = toMetricLabel(item);
      return metricRes.err ? item : metricRes.value;
    }),
    operatingHeading: `Operating Principles (${pickWildcard(6)})`,
    operatingItems: [
      { key: "Design-to-Build", val: `Push from concept to artifact with ${pickWildcard(7)} and explicit assembly/service assumptions.` },
      { key: "Tradeoff-Driven", val: `Balance performance and delivery using ${pickWildcard(8)} and ${pickWildcard(9)}.` },
      { key: "Constraint-First", val: `Start from limits, then converge with ${pickWildcard(10)} and iterative proof loops.` },
      { key: "Team Signal", val: `Keep decisions actionable through ${pickWildcard(11)} and clear ownership seams.` }
    ],
    beyondHeading: `Engineering & Exploration (${pickWildcard(12)})`,
    beyondItems: [
      { key: "Maker Systems", val: `Hands-on focus on ${pickInterest(2)} and ${pickInterest(3)}.` },
      { key: "Compute + AI", val: `Ongoing interest in ${pickInterest(4)} and ${pickInterest(5)}.` },
      { key: "Operations Mindset", val: `I care about ${pickInterest(6)} and ${pickInterest(7)} before scaling.` },
      { key: "Life Outside Work", val: `I recharge through ${pickInterest(8)} and ${pickInterest(9)}.` }
    ],
    youtubeLead: `Current clip theme: ${pickWildcard(13)} in practice.`
  };

  return { value, err: null };
}

/**
 * @param {string[]} pool
 * @param {string} dateKey
 * @param {string} slotKey
 * @param {number} count
 * @returns {string[]}
 */
function uniquePick(pool, dateKey, slotKey, count) {
  const used = new Set();
  const output = [];
  let cursor = 0;
  while (output.length < count && cursor < pool.length * 3) {
    const hashRes = hashText(`${dateKey}:${slotKey}:${cursor}`);
    if (hashRes.err) {
      return { value: null, err: hashRes.err };
    }
    const idx = Math.abs(hashRes.value) % pool.length;
    const item = pool[idx];
    if (!used.has(item)) {
      used.add(item);
      output.push(item);
    }
    cursor += 1;
  }
  return { value: output, err: null };
}

/**
 * @param {string} value
 * @returns {string}
 */
function toMetricLabel(value) {
  return { value: value
    .split(" ")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" "), err: null };
}

/**
 * @param {string} text
 * @returns {number}
 */
function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return { value: hash >>> 0, err: null };
}
