import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { getYearLabel, buildNavItems } from "./core.pure.js";
import { createBlog, createBlogCategory, deleteBlog, downloadResumePdf, fetchMessageOfDay, getBlog, getBlogAdminToken, getBlogsDashboard, getCurrentYear, getPublicBlog, listBlogCategories, listBlogs, listBlogTags, loginBlogAdmin, logoutBlogAdmin, setBlogPublished, updateBlog, uploadBlogImage } from "./core.impure.js";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
import "./ui.css";
import javascriptLang from "highlight.js/lib/languages/javascript";
import typescriptLang from "highlight.js/lib/languages/typescript";
import goLang from "highlight.js/lib/languages/go";
import javaLang from "highlight.js/lib/languages/java";
import csharpLang from "highlight.js/lib/languages/csharp";
import cssLang from "highlight.js/lib/languages/css";
import rustLang from "highlight.js/lib/languages/rust";

hljs.registerLanguage("javascript", javascriptLang);
hljs.registerLanguage("js", javascriptLang);
hljs.registerLanguage("typescript", typescriptLang);
hljs.registerLanguage("ts", typescriptLang);
hljs.registerLanguage("go", goLang);
hljs.registerLanguage("java", javaLang);
hljs.registerLanguage("csharp", csharpLang);
hljs.registerLanguage("cs", csharpLang);
hljs.registerLanguage("c#", csharpLang);
hljs.registerLanguage("css", cssLang);
hljs.registerLanguage("zig", rustLang);

const ARIA_PRIMARY = "Primary";
const TEXT_INIT_ERROR = "Application failed to initialize.";
const TEXT_NAME = "Earl Cameron";
const TEXT_ROLE = "Systems-Driven Software Engineer";
const TEXT_TAGLINE = "Designing buildable systems across software, hardware constraints, and real-world operations.";
const TEXT_EMAIL = "cam@earlcameron.com";
const LINK_LINKEDIN = "https://www.linkedin.com/in/earl-cameron/";
const LINK_GITHUB = "https://github.com/monstercameron";
const LINK_PROFILE_ANCHOR_IMAGE = "/images/profile-anchor.jpg";
const ALT_PROFILE_ANCHOR_IMAGE = "Earl Cameron in Tokyo at night";
const LINK_YOUTUBE_VIDEO = "https://www.youtube.com/watch?v=N1dBCwI6A7M";
const LINK_YOUTUBE_EMBED = "https://www.youtube.com/embed/N1dBCwI6A7M";
const TEXT_MOTD_LOADING = "Generating today's message...";
const TEXT_MOTD_FALLBACK = "Build with intention, ship with clarity, and keep improving one decision at a time.";

const PATH_HOME = "/";
const PATH_RESUME = "/resume";
const PATH_PROJECTS = "/projects";
const PATH_RCTS = "/rcts";
const PATH_BUDGET = "/budget";
const PATH_BLOG = "/blog";
const PATH_BLOG_PREFIX = "/blog/";
const PATH_BLOG_DASHBOARD = "/blog/dashboard";
const PATH_AI_WORKSHOP = "/aiworkshop";
const RESUME_PRINT_ROOT_ID = "resume-print-root";
const RESUME_PDF_FILENAME = "EarlCameron-Resume.pdf";
const RESUME_PDF_EXPORT_CLASS = "pdf-export";
const BLOG_PAGE_SIZE = 10;
const BLOG_ACTION_ANIMATION_MS = 100;
const BLOG_VARIANT_ALL = "all";
const BLOG_VARIANT_BLOG = "blog";
const BLOG_VARIANT_VLOG = "vlog";
const TEXT_CODE_COPY = "Copy";
const TEXT_CODE_COPIED = "Copied";
const TEXT_CODE_FALLBACK_LANG = "code";
const TEXT_VLOG_URL_LABEL = "YouTube Link";
const TEXT_VLOG_URL_PLACEHOLDER = "https://www.youtube.com/watch?v=...";
const TEXT_VLOG_URL_HELP = "Paste a full YouTube URL for this vlog entry.";
const TEXT_VLOG_URL_INVALID = "Enter a valid YouTube URL to preview the embed.";
const TEXT_BUDGET_LOADING = "Loading budget tool...";
const BudgetToolPageLazy = lazy(() => import("./budget/entry.jsx"));

/**
 * @param {string} text
 * @returns {Promise<[boolean|null, Error|null]>}
 */
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).then(() => [true, null]).catch((err) => [null, err]);
}

/**
 * @param {number} ms
 * @returns {Promise<[boolean|null, Error|null]>}
 */
function waitMs(ms) {
  return new Promise((resolve) => setTimeout(() => resolve([true, null]), ms));
}

/**
 * @returns {JSX.Element}
 */
export function App() {
  const navRes = buildNavItems();
  const yearRes = getCurrentYear();
  const yearLabelRes = yearRes.err ? { value: null, err: yearRes.err } : getYearLabel(yearRes.value);

  if (navRes.err || yearLabelRes.err) {
    return <main className="app-init-error">{TEXT_INIT_ERROR}</main>;
  }

  const pathname = window.location.pathname;
  const [motd, setMotd] = useState({ quote: TEXT_MOTD_LOADING, loading: true });

  useEffect(() => {
    let active = true;
    const loadMotd = async () => {
      const motdRes = await fetchMessageOfDay();
      if (!active) {
        return;
      }

      if (motdRes.err) {
        setMotd({ quote: TEXT_MOTD_FALLBACK, loading: false });
        return;
      }

      setMotd({ quote: motdRes.value, loading: false });
    };

    loadMotd();
    return () => {
      active = false;
    };
  }, []);

  const handleResumeDownload = async (event) => {
    event.preventDefault();
    const element = document.getElementById(RESUME_PRINT_ROOT_ID);
    if (element) {
      element.classList.add(RESUME_PDF_EXPORT_CLASS);
    }
    const pdfRes = await downloadResumePdf(element, RESUME_PDF_FILENAME);
    if (element) {
      element.classList.remove(RESUME_PDF_EXPORT_CLASS);
    }
    if (pdfRes.err) {
      console.error(pdfRes.err.message);
      window.alert("Could not generate PDF. Please try again.");
    }
  };

  return (
    <div className="site-shell">

      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand-mark" aria-hidden="true">EC</div>
          <div>
            <h1 className="brand-name">{TEXT_NAME}</h1>
            <p className="brand-role">{TEXT_ROLE}</p>
          </div>
        </div>
      </header>

      <nav aria-label={ARIA_PRIMARY} className="nav-wrap">
        <div className="container nav-shell">
          <div className="nav-row">
          {navRes.value.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "is-active" : ""}`}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer noopener" : undefined}
            >
              {item.label}
              {item.external ? <span className="nav-ext">↗</span> : null}
            </a>
          ))}
          </div>
        </div>
      </nav>

      <main className="container main-grid">{renderPage(pathname, handleResumeDownload, motd)}</main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <div className="footer-title">{TEXT_NAME}</div>
            <div className="footer-sub">{TEXT_TAGLINE}</div>
            <div className="footer-links">
              <a className="footer-link" href="https://github.com/monstercameron" target="_blank" rel="noreferrer noopener">GitHub</a>
              <a className="footer-link" href="https://www.linkedin.com/in/earl-cameron/" target="_blank" rel="noreferrer noopener">LinkedIn</a>
              <a className="footer-link" href="https://www.youtube.com/@EarlCameron007" target="_blank" rel="noreferrer noopener">YouTube</a>
            </div>
          </div>
          <div className="footer-year">{yearLabelRes.value}</div>
        </div>
      </footer>
    </div>
  );
}

/**
 * @param {string} pathname
 * @param {(event: React.MouseEvent<HTMLAnchorElement>) => Promise<void>} onResumeDownload
 * @param {{quote: string, loading: boolean}} motd
 * @returns {JSX.Element}
 */
function renderPage(pathname, onResumeDownload, motd) {
  if (pathname === PATH_HOME) return <HomePage motd={motd} />;
  if (pathname === PATH_RESUME) return <ResumePage onResumeDownload={onResumeDownload} />;
  if (pathname === PATH_BUDGET) return <BudgetToolRoutePage />;
  if (pathname === PATH_PROJECTS || pathname === PATH_RCTS) return <ProjectsPage />;
  if (pathname === PATH_BLOG || pathname.startsWith(PATH_BLOG_PREFIX)) return <BlogPage />;
  if (pathname === PATH_AI_WORKSHOP) return <AiWorkshopPage />;
  return <NotFoundPage />;
}

function BudgetToolRoutePage() {
  return (
    <div className="budget-route-shell">
      <Suspense fallback={<section className="panel"><p>{TEXT_BUDGET_LOADING}</p></section>}>
        <BudgetToolPageLazy />
      </Suspense>
    </div>
  );
}

function HomePage({ motd }) {
  return (
    <>
      <section className="panel hero hero-intro">
        <div className="hero-intro-grid">
          <div className="hero-copy">
            <p className="eyebrow">SENIOR SOFTWARE ENGINEER</p>
            <h2>Systems thinker. Builder. Pragmatist.</h2>
            <p>
              I frame problems as interacting subsystems—balancing software architecture, hardware constraints, and operational realities. I don't stop at concepts; I push toward manufacturable artifacts, clear tradeoffs, and high-leverage production outcomes.
            </p>
            <div className="hero-mini-metrics">
              <span className="metric-pill">Cross-Domain Architecture</span>
              <span className="metric-pill">HPC & AI Tooling</span>
              <span className="metric-pill">Hardware/Software Integration</span>
              <span className="metric-pill">High-Signal Execution</span>
            </div>
          </div>
          <div className="hero-anchor-wrap">
            <img className="home-anchor-image" src={LINK_PROFILE_ANCHOR_IMAGE} alt={ALT_PROFILE_ANCHOR_IMAGE} />
            <p className="hero-caption">Tokyo, after-hours systems thinking.</p>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <section className="panel motd-panel">
          <p className="eyebrow">MESSAGE OF THE DAY</p>
          <p className="motd-quote">{motd.quote}</p>
          {motd.loading ? <p className="motd-status">Thinking...</p> : null}
        </section>

        <section className="panel">
          <h3>Operating Principles</h3>
          <div className="kv-grid">
            <div>
              <p className="key">Design-to-Build</p>
              <p className="val">Pushing past theory into manufacturable artifacts: tolerances, packaging, BOMs, and maintenance paths.</p>
            </div>
            <div>
              <p className="key">Tradeoff-Driven</p>
              <p className="val">Balancing high-performance ideas against practical limits (power, cost, time) to ship reliable solutions.</p>
            </div>
            <div>
              <p className="key">Constraint-First</p>
              <p className="val">Starting with hard constraints and selecting architectures that satisfy them through iterative, concrete steps.</p>
            </div>
            <div>
              <p className="key">High Signal</p>
              <p className="val">Low tolerance for ambiguity. Prioritizing precise language, explicit assumptions, and decision-ready recommendations.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">BEYOND THE CODE</p>
          <h3>Engineering & Exploration</h3>
          <div className="kv-grid">
            <div>
              <p className="key">Hardware & Fabrication</p>
              <p className="val">Mechanical packaging, electrification, and building tangible systems with real-world constraints.</p>
            </div>
            <div>
              <p className="key">Worldbuilding</p>
              <p className="val">Designing coherent universes, factions, and systems of conflict with strict internal consistency.</p>
            </div>
            <div>
              <p className="key">Logistics & Optimization</p>
              <p className="val">High-leverage travel planning, budgeting dashboards, and building systems that reflect reality.</p>
            </div>
            <div>
              <p className="key">Active Pursuits</p>
              <p className="val">Tennis, distance walking, and beginner skiing progression.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">YOUTUBE</p>
          <h3>Latest Video</h3>
          <div className="video-wrap">
            <iframe
              className="video-frame"
              src={LINK_YOUTUBE_EMBED}
              title="Earl Cameron YouTube video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p>
            <a href={LINK_YOUTUBE_VIDEO} target="_blank" rel="noreferrer noopener">Watch on YouTube</a>
          </p>
        </section>
      </section>
    </>
  );
}

function ResumePage({ onResumeDownload }) {
  return (
    <section className="panel" id={RESUME_PRINT_ROOT_ID}>
      <p className="eyebrow">RESUME</p>
      <section className="resume-hero">
        <div>
          <h2 className="resume-title">Earl Cameron</h2>
          <p className="resume-subtitle">Senior Software Engineer</p>
          <p className="resume-contact">
            <a href={`mailto:${TEXT_EMAIL}`}>{TEXT_EMAIL}</a>
            <span className="dot-sep">•</span>
            <a href={LINK_LINKEDIN} target="_blank" rel="noreferrer noopener">LinkedIn</a>
            <span className="dot-sep">•</span>
            <a href={LINK_GITHUB} target="_blank" rel="noreferrer noopener">GitHub</a>
          </p>
          <p className="resume-summary">
            Senior software engineer who combines systems-level thinking with collaborative execution.
            I partner across engineering, support, and product teams to turn ambiguous requirements into
            clear plans and reliable implementations. I bring strong ownership, pragmatic decision-making,
            and a build-first mindset that helps teams ship faster, reduce risk, and maintain high quality
            in production. Led critical incident war-room response and mentored support engineers across
            4+ years in production engineering environments.
          </p>
        </div>
        <div className="resume-hero-cta">
          <a className="cta-link" href="/resume/EarlCameron.pdf" onClick={onResumeDownload}>Download Full Resume (PDF)</a>
        </div>
      </section>

      <div className="resume-grid">
        <section className="resume-block skills-block">
          <h3>Core Skills</h3>
          <div className="chip-row">
            <span className="chip chip-label">Languages</span><span className="chip">JavaScript / ES6+</span><span className="chip">Go</span><span className="chip">Python</span><span className="chip">C (Systems)</span><span className="chip">SQL</span>
            <span className="chip chip-label">Web / APIs</span><span className="chip">React</span><span className="chip">Vite</span><span className="chip">Node.js</span><span className="chip">REST APIs</span>
            <span className="chip chip-label">AI</span><span className="chip">OpenAI API</span><span className="chip">LLM Application Development</span>
            <span className="chip chip-label">Ops / Platforms</span><span className="chip">WebAssembly</span><span className="chip">Observability / Reliability</span><span className="chip">CI/CD and Build Tooling</span><span className="chip">Linux</span><span className="chip">Raspberry Pi</span>
          </div>
        </section>

        <section className="resume-block experience-block">
          <h3>Professional Experience</h3>
          <article className="xp-item">
            <div className="xp-head">
              <p className="xp-role">Senior Software Engineer - UKG</p>
              <p className="xp-time">2020 - Present</p>
            </div>
            <ul className="list">
              <li>Built an award-winning AI chatbot prototype recognized through internal innovation awards.</li>
              <li>Led critical war-room response for infrastructure and product-impacting incidents.</li>
              <li>Designed internal dashboards for development and infrastructure Jira case tracking.</li>
              <li>Mentored interns and trained support teams on engineering workflows.</li>
            </ul>
          </article>

          <article className="xp-item">
            <div className="xp-head">
              <p className="xp-role">Instructor/TA - 4Geeks Academy</p>
              <p className="xp-time">Jan 2020 - Aug 2021</p>
            </div>
            <ul className="list">
              <li>Guided students through full-stack web development foundations and project delivery.</li>
              <li>Delivered structured training on practical engineering best practices.</li>
            </ul>
          </article>

          <article className="xp-item">
            <div className="xp-head">
              <p className="xp-role">HTML/CSS and JavaScript Tutor - HeyTutor.com</p>
              <p className="xp-time">180+ Hours Tutored</p>
            </div>
            <ul className="list">
              <li>Maintained a perfect 5.0 rating across student evaluations.</li>
              <li>Provided personalized, outcome-focused instruction to 12 students.</li>
            </ul>
          </article>
        </section>

        <section className="resume-block">
          <h3>Notable Projects</h3>
          <ul className="list">
            <li><a href="https://github.com/monstercameron/GoWebComponents" target="_blank" rel="noreferrer noopener">GoWebComponents</a>: Go-powered component architecture focused on reusable frontend primitives.</li>
            <li><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener">LatentSpaceBrowser</a>: Interactive AI exploration experience built around latent-space navigation.</li>
            <li><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener">Zerver</a>: C-based server project emphasizing low-level performance and runtime fundamentals.</li>
            <li><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener" title="Repo: Budgetting_tool_vibecoded">Budgeting Tool</a>: Finance tracking app for expenses, debt, and goal progress workflows.</li>
            <li><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener">Pi Camera GUI</a>: Python + Pygame interface for Raspberry Pi HQ camera controls and capture workflows.</li>
          </ul>
        </section>

        <section className="resume-block">
          <h3>Community & Interests</h3>
          <ul className="list">
            <li>Building practical software tools with strong UX and measurable utility.</li>
            <li>Systems engineering focus: performance, observability, reliability, and reproducible delivery.</li>
            <li>Hardware/software integration work, especially Raspberry Pi and edge-device workflows.</li>
            <li>Tennis, long-distance walking, and beginner skiing progression.</li>
            <li>Hackathon participation (MDC Game Jam, Mango Hacks, Shell Hacks) and mentorship.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}

function ProjectsPage() {
  return (
    <section className="panel">
      <p className="eyebrow">PROJECTS & EXPERIMENTS</p>
      <h2>Systems, Tools, and Hardware</h2>
      <p className="projects-intro">
        A collection of tools built to solve specific problems, explore new architectures, or push hardware constraints. I focus on observability, performance, and practical utility over glossy features.
      </p>
      <div className="cards">
        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener">Zerver</a></h3>
            <span className="chip chip-zero">Zig</span>
          </div>
          <p><strong>The Build:</strong> A backend framework built around pure-step request pipelines, explicit side effects, and built-in tracing.</p>
          <p><strong>The Why:</strong> I wanted to make API behavior observable by default, so bottlenecks and failures are easier to diagnose and fix in production without relying on heavy external APM tools.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/SchemaFlow" target="_blank" rel="noreferrer noopener">SchemaFlow</a></h3>
            <span className="chip chip-zero">Go</span>
          </div>
          <p><strong>The Build:</strong> A library for type-safe LLM extraction and structured output validation.</p>
          <p><strong>The Why:</strong> Parsing JSON from LLMs is notoriously fragile. I built this to replace runtime guessing with compile-time safety, making LLM pipelines actually production-friendly.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener">Pi Camera Rig</a></h3>
            <span className="chip chip-zero">Python / Hardware</span>
          </div>
          <p><strong>The Build:</strong> A Pygame-based GUI that turns a bare Raspberry Pi HQ camera setup into a menu-driven, standalone camera experience.</p>
          <p><strong>The Why:</strong> Command-line camera control isn't practical in the field. I needed a reliable interface with deep settings, metadata support, and a desktop mock mode for rapid iteration.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener">Latent Space Browser</a></h3>
            <span className="chip chip-zero">React / LLMs</span>
          </div>
          <p><strong>The Build:</strong> A generative encyclopedia UI where every linked term recursively generates new, context-aware AI content.</p>
          <p><strong>The Why:</strong> Exploring a new interaction model for LLMs that moves beyond the standard chat interface, focusing on low-latency exploration and transparent token/cost metrics.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/GoScript" target="_blank" rel="noreferrer noopener">GoScript</a></h3>
            <span className="chip chip-zero">Go / WebAssembly</span>
          </div>
          <p><strong>The Build:</strong> A browser-based Go environment running the real Go compiler entirely client-side via WebAssembly.</p>
          <p><strong>The Why:</strong> To make Go runnable in documentation, tutorials, and playgrounds instantly, without requiring users to install a local toolchain or rely on a backend execution server.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/MetaHumanServer" target="_blank" rel="noreferrer noopener">MetaHuman Server</a></h3>
            <span className="chip chip-zero">Python / Audio</span>
          </div>
          <p><strong>The Build:</strong> A voice-interactive chatbot server that combines NLP and real-time audio processing pipelines.</p>
          <p><strong>The Why:</strong> Text chat is slow. I wanted to build a more human-like, low-latency voice interaction layer that could be integrated into games or online services.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/mdchem" target="_blank" rel="noreferrer noopener">MDChem Backend</a></h3>
            <span className="chip chip-zero">Node.js / REST</span>
          </div>
          <p><strong>The Build:</strong> Backend services for an educational chemistry game, handling data capture, reporting workflows, and educator access.</p>
          <p><strong>The Why:</strong> Gameplay is only half the product. I built the infrastructure to store telemetry, generate useful trends, and manage controlled access for teachers.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener">Personal Finance Dashboard</a></h3>
            <span className="chip chip-zero">React / Vite</span>
          </div>
          <p><strong>The Build:</strong> A fast, client-side budgeting app for tracking income, expenses, debt, and goal progress.</p>
          <p><strong>The Why:</strong> Off-the-shelf tools were too slow or lacked specific workflows. I built this to centralize my personal finance tracking with instant feedback and high-visibility metrics.</p>
        </article>
      </div>
    </section>
  );
}

function AiWorkshopPage() {
  return (
    <section className="panel">
      <p className="eyebrow">AI WORKSHOP</p>
      <h2>Applied AI, Operationally</h2>
      <p>
        Focused on model utility under real constraints: latency, cost ceilings, observability,
        and integration with existing systems.
      </p>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="panel">
      <p className="eyebrow">NOT FOUND</p>
      <h2>404 - Page Not Found</h2>
      <p>This route has not been mapped yet.</p>
    </section>
  );
}

/**
 * @returns {JSX.Element}
 */
function BlogPage() {
  const pathname = window.location.pathname;
  const search = window.location.search;
  const searchParams = new URLSearchParams(search);
  const activeCategory = String(searchParams.get("category") || "").trim().toLowerCase();
  const activeTag = String(searchParams.get("tag") || "").trim().toLowerCase();
  const activeVariantRaw = String(searchParams.get("variant") || BLOG_VARIANT_ALL).trim().toLowerCase();
  const activeVariant = activeVariantRaw === BLOG_VARIANT_BLOG || activeVariantRaw === BLOG_VARIANT_VLOG ? activeVariantRaw : BLOG_VARIANT_ALL;
  const segments = pathname.split("/").filter(Boolean);
  const routeSecond = segments[1] || "";
  const routeThird = segments[2] || "";
  const routeId = Number(routeSecond);
  const isDashboardRoute = routeSecond === "dashboard";
  const isEditRoute = Number.isInteger(routeId) && routeId > 0 && routeThird === "edit";
  const isNewRoute = Number.isInteger(routeId) && routeThird === "new";
  const isDetailView = Number.isInteger(routeId) && routeId > 0 && !routeThird;
  const detailId = routeId;
  const [rows, setRows] = useState([]);
  const [detailRow, setDetailRow] = useState(null);
  const [detailNav, setDetailNav] = useState({ prevId: null, nextId: null });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [dashboard, setDashboard] = useState({ total: 0, published: 0, drafts: 0 });
  const [status, setStatus] = useState({ text: "", error: false });
  const [view, setView] = useState(isDashboardRoute ? (Boolean(getBlogAdminToken().value) ? "dashboard" : "login") : (isEditRoute || isNewRoute ? "editor" : "list"));
  const [previousView, setPreviousView] = useState("list");
  const [isAdmin, setIsAdmin] = useState(Boolean(getBlogAdminToken().value));
  const [listPage, setListPage] = useState(1);
  const [dashboardPage, setDashboardPage] = useState(1);
  const [password, setPassword] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imageScalePct, setImageScalePct] = useState(60);
  const [form, setForm] = useState({ id: null, title: "", summary: "", content: "", variant: "blog", published: 0, categoryId: "", tagsText: "" });
  const imageInputRef = useRef(null);
  const goTo = (path) => window.location.assign(path);
  const goToAnimated = async (path, event) => {
    if (isModifiedNavEvent(event)) {
      return;
    }
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    applyActionPulse(event?.currentTarget);
    await waitMs(BLOG_ACTION_ANIMATION_MS);
    window.location.assign(path);
  };
  const goBack = (fallbackPath = PATH_BLOG) => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(fallbackPath);
  };
  const setVariantFilter = (variant) => {
    const nextVariant = variant === BLOG_VARIANT_BLOG || variant === BLOG_VARIANT_VLOG ? variant : BLOG_VARIANT_ALL;
    const nextSearch = new URLSearchParams(window.location.search);
    if (nextVariant === BLOG_VARIANT_ALL) {
      nextSearch.delete("variant");
    } else {
      nextSearch.set("variant", nextVariant);
    }
    const basePath = isDashboardRoute ? PATH_BLOG_DASHBOARD : PATH_BLOG;
    const query = nextSearch.toString();
    goTo(query ? `${basePath}?${query}` : basePath);
  };
  const listRows = rows.filter((row) => row.published && matchesBlogFilters(row, activeCategory, activeTag, activeVariant));
  const dashboardRows = rows.filter((row) => matchesBlogFilters(row, activeCategory, activeTag, activeVariant));
  const listPageData = paginateItems(listRows, listPage, BLOG_PAGE_SIZE);
  const dashboardPageData = paginateItems(dashboardRows, dashboardPage, BLOG_PAGE_SIZE);
  const derivedDashboard = {
    total: rows.length,
    published: rows.filter((row) => Boolean(row.published)).length,
    drafts: rows.filter((row) => !row.published).length
  };
  const dashboardMetrics = dashboard.total > 0 || dashboard.published > 0 || dashboard.drafts > 0 ? dashboard : derivedDashboard;

  const load = async () => {
    if (isDetailView) {
      const [rowRes, listRes] = await Promise.all([isAdmin ? getBlog(detailId) : getPublicBlog(detailId), listBlogs()]);
      if (rowRes.err || !rowRes.value) {
        setStatus({ text: rowRes.err ? rowRes.err.message : "Blog not found", error: true });
        return;
      }
      setDetailRow(rowRes.value);
      if (!listRes.err) {
        const navRows = isAdmin ? listRes.value : listRes.value.filter((row) => row.published);
        const sorted = [...navRows].sort((a, b) => Number(a.id) - Number(b.id));
        const currentIndex = sorted.findIndex((row) => Number(row.id) === detailId);
        const prevRow = currentIndex > 0 ? sorted[currentIndex - 1] : null;
        const nextRow = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
        setDetailNav({ prevId: prevRow ? prevRow.id : null, nextId: nextRow ? nextRow.id : null });
      }
      return;
    }

    const [blogsRes, categoriesRes, tagsRes, dashboardRes] = await Promise.all([
      listBlogs(),
      listBlogCategories(),
      listBlogTags(),
      isAdmin ? getBlogsDashboard() : Promise.resolve({ value: { total: 0, published: 0, drafts: 0 }, err: null })
    ]);
    if (!blogsRes.err) {
      setRows(blogsRes.value);
    }
    if (!categoriesRes.err) {
      setCategories(categoriesRes.value);
    }
    if (!tagsRes.err) {
      setTags(tagsRes.value);
    }
    if (!dashboardRes.err) {
      setDashboard(dashboardRes.value);
    }

    if (!blogsRes.err) {
      if (isDashboardRoute) {
        setView(isAdmin ? "dashboard" : "login");
      } else if (isEditRoute) {
        const target = blogsRes.value.find((row) => Number(row.id) === routeId);
        if (target) {
          setForm({
            id: target.id,
            title: target.title || "",
            summary: target.summary || "",
            content: target.content || "",
            variant: target.variant || "blog",
            published: target.published ? 1 : 0,
            categoryId: target.category?.id ? String(target.category.id) : "",
            tagsText: Array.isArray(target.tags) ? target.tags.map((tag) => tag.name).join(", ") : ""
          });
        }
        setView("editor");
      } else if (isNewRoute) {
        setForm({ id: null, title: "", summary: "", content: "", variant: "blog", published: 0, categoryId: "", tagsText: "" });
        setView("editor");
      } else {
        setView("list");
      }
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  useEffect(() => {
    if (listPage !== listPageData.page) {
      setListPage(listPageData.page);
    }
  }, [listPage, listPageData.page]);

  useEffect(() => {
    if (dashboardPage !== dashboardPageData.page) {
      setDashboardPage(dashboardPageData.page);
    }
  }, [dashboardPage, dashboardPageData.page]);

  const onField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const payload = () => ({ title: form.title, summary: form.summary, content: form.content, variant: form.variant || "blog", published: form.published, categoryId: form.categoryId ? Number(form.categoryId) : null, tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) });

  const onLogin = async (event) => {
    event.preventDefault();
    const res = await loginBlogAdmin(password);
    if (res.err) {
      setStatus({ text: res.err.message, error: true });
      return;
    }
    setPassword("");
    setIsAdmin(true);
    goTo(PATH_BLOG_DASHBOARD);
  };

  const onSave = async (event) => {
    event.preventDefault();
    const res = form.id ? await updateBlog(form.id, payload()) : await createBlog(payload());
    if (res.err) {
      setStatus({ text: res.err.message, error: true });
      return;
    }
    setStatus({ text: form.id ? "Blog updated." : "Blog created.", error: false });
    setForm({ id: null, title: "", summary: "", content: "", variant: "blog", published: 0, categoryId: "", tagsText: "" });
    goTo(PATH_BLOG_DASHBOARD);
    await load();
  };

  const onEdit = (row) => {
    setPreviousView(view);
    goTo(`/blog/${row.id}/edit`);
  };

  const onDelete = async (id, event) => {
    applyActionPulse(event?.currentTarget);
    const confirmed = window.confirm("Delete this blog post permanently?");
    if (!confirmed) {
      return;
    }
    await waitMs(BLOG_ACTION_ANIMATION_MS);
    const res = await deleteBlog(id);
    if (res.err) {
      setStatus({ text: res.err.message, error: true });
      return;
    }
    await load();
  };

  /**
   * @param {{id: number, title: string, summary: string, content: string, published: number, category?: {id: number}, tags?: Array<{name: string}>}} row
   * @returns {Promise<void>}
   */
  const onTogglePublish = async (row) => {
    const res = await setBlogPublished(row.id, row.published ? 0 : 1);
    if (res.err) {
      setStatus({ text: res.err.message, error: true });
      return;
    }
    setStatus({ text: row.published ? "Post unpublished." : "Post published.", error: false });
    await load();
  };

  const applyEditorWrap = (prefix, suffix = prefix) => {
    const editor = document.getElementById("blog-content-editor");
    if (!editor) {
      return;
    }
    const start = editor.selectionStart || 0;
    const end = editor.selectionEnd || 0;
    const selected = editor.value.slice(start, end);
    onField("content", `${editor.value.slice(0, start)}${prefix}${selected}${suffix}${editor.value.slice(end)}`);
  };

  const onImagePick = async (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    if (!file) {
      return;
    }
    const uploadRes = await uploadBlogImage(file);
    if (uploadRes.err) {
      setStatus({ text: uploadRes.err.message, error: true });
      return;
    }
    const token = `![img](${uploadRes.value.url}|${imageScalePct})`;
    onField("content", `${form.content}\n${token}`);
  };

  const createCategory = async () => {
    const res = await createBlogCategory(newCategoryName);
    if (res.err) {
      setStatus({ text: res.err.message, error: true });
      return;
    }
    setNewCategoryName("");
    await load();
  };

  if (isDetailView && detailRow) {
    return <BlogDetailView detailRow={detailRow} detailNav={detailNav} goToAnimated={goToAnimated} activeVariant={activeVariant} />;
  }

  return (
    <section className="panel blog-shell">
      <header className="blog-header">
        <div>
          <p className="eyebrow">SYSTEM LOGS</p>
          <h2>{isAdmin ? "Command Console" : "Build Logs & Notes"}</h2>
          <p className="blog-subhead">Engineering notes, architectural decisions, and operational experiments.</p>
          <div className="blog-variant-filter-row">
            <span className="blog-filter-label">Type:</span>
            <button className={`tab-btn blog-variant-btn ${activeVariant === BLOG_VARIANT_ALL ? "is-active" : ""}`} type="button" onClick={() => setVariantFilter(BLOG_VARIANT_ALL)}>All</button>
            <button className={`tab-btn blog-variant-btn ${activeVariant === BLOG_VARIANT_BLOG ? "is-active" : ""}`} type="button" onClick={() => setVariantFilter(BLOG_VARIANT_BLOG)}>Blogs</button>
            <button className={`tab-btn blog-variant-btn ${activeVariant === BLOG_VARIANT_VLOG ? "is-active" : ""}`} type="button" onClick={() => setVariantFilter(BLOG_VARIANT_VLOG)}>Vlogs</button>
          </div>
          {(activeCategory || activeTag) ? (
            <p className="blog-subhead blog-filter-row">
              <span className="blog-filter-label">Active Filter:</span>
              {activeCategory ? <span className="meta-pill blog-filter-pill">{activeCategory}</span> : null}
              {activeTag ? <span className="meta-pill blog-filter-pill">{activeTag}</span> : null}
              <a className="blog-filter-clear" href={PATH_BLOG}>Clear</a>
            </p>
          ) : null}
        </div>
        <div className="blog-header-actions">
          <button className={`tab-btn ${view === "list" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG)}>Public Logs</button>
          {!isAdmin ? <button className={`tab-btn ${view === "login" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}>Authenticate</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "dashboard" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}>Dashboard</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "editor" ? "is-active" : ""}`} type="button" onClick={() => { setPreviousView(view); goTo("/blog/0/new"); }}>New Entry</button> : null}
          {isAdmin ? <button className="tab-btn danger" type="button" onClick={async () => { await logoutBlogAdmin(); setIsAdmin(false); goTo(PATH_BLOG); }}>Disconnect</button> : null}
        </div>
      </header>

      {status.text ? <p className={status.error ? "blog-error" : "blog-success"}>{status.text}</p> : null}

      {view === "login" && !isAdmin ? <BlogLoginView password={password} setPassword={setPassword} onLogin={onLogin} /> : null}
      {view === "dashboard" && isAdmin ? <BlogDashboardView dashboard={dashboardMetrics} dashboardPageData={dashboardPageData} dashboardPage={dashboardPage} setDashboardPage={setDashboardPage} onDelete={onDelete} onTogglePublish={onTogglePublish} onNavigate={goToAnimated} activeVariant={activeVariant} /> : null}
      {view === "list" ? <BlogListView listPageData={listPageData} listPage={listPage} setListPage={setListPage} isAdmin={isAdmin} onDelete={onDelete} onNavigate={goToAnimated} activeVariant={activeVariant} /> : null}
      {view === "editor" && isAdmin ? <BlogEditorView form={form} onField={onField} onSave={onSave} goBack={goBack} previousView={previousView} applyEditorWrap={applyEditorWrap} imageInputRef={imageInputRef} imageScalePct={imageScalePct} setImageScalePct={setImageScalePct} onImagePick={onImagePick} categories={categories} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} createCategory={createCategory} tags={tags} /> : null}
    </section>
  );
}

function BlogDetailView({ detailRow, detailNav, goToAnimated, activeVariant = BLOG_VARIANT_ALL }) {
  const vlogId = detailRow.variant === "vlog" ? parseYouTubeVideoId(detailRow.content) : "";
  const vlogEmbedUrl = vlogId ? buildYouTubeEmbedUrl(vlogId) : "";
  return (
    <article className="blog-post-detail">
      <div className="blog-post-topbar">
        <button className="cta-link cta-button" type="button" onClick={(event) => goToAnimated(PATH_BLOG, event)}>← Back to System Logs</button>
      </div>
      <div className="blog-detail-inner">
        <div className="blog-detail-stage">
        <p className="eyebrow">SYSTEM LOG</p>
        <h2>{detailRow.title}</h2>
        {detailRow.summary ? <p className="blog-post-summary">{detailRow.summary}</p> : null}
        <div className="blog-post-meta">
          <span className="meta-pill">{detailRow.variant === "vlog" ? "VLOG" : "BLOG"}</span>
          {detailRow.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: detailRow.category.name, variant: activeVariant })}>{detailRow.category.name}</a> : null}
          {Array.isArray(detailRow.tags) ? detailRow.tags.map((tag) => <a className="meta-pill meta-link" key={tag.id} href={buildBlogFilterHref({ tag: tag.name, variant: activeVariant })}>{tag.name}</a>) : null}
        </div>
        {detailRow.variant === "vlog" ? (
          <div className="blog-content blog-detail-content">
            {vlogEmbedUrl ? (
              <div className="video-wrap">
                <iframe
                  className="video-frame"
                  src={vlogEmbedUrl}
                  title={detailRow.title || "YouTube vlog"}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : null}
            <p><a href={detailRow.content} target="_blank" rel="noreferrer noopener">Watch on YouTube</a></p>
          </div>
        ) : (
          <div className="blog-content blog-detail-content">{renderRichContent(detailRow.content)}</div>
        )}
        </div>
        <div className="blog-row-actions blog-detail-nav">
          {detailNav.prevId ? <a className="cta-link" href={`/blog/${detailNav.prevId}`} onClick={(event) => goToAnimated(`/blog/${detailNav.prevId}`, event)}>← Previous Log</a> : <span />}
          {detailNav.nextId ? <a className="cta-link" href={`/blog/${detailNav.nextId}`} onClick={(event) => goToAnimated(`/blog/${detailNav.nextId}`, event)}>Next Log →</a> : <span />}
        </div>
      </div>
    </article>
  );
}

function BlogLoginView({ password, setPassword, onLogin }) {
  return (
    <form className="blog-login-card" onSubmit={onLogin}>
      <div className="login-head">
        <h3 className="login-title">System Authentication</h3>
        <p className="login-subtitle">Enter credentials to access the command console.</p>
      </div>
      <label>
        <span className="field-label">Access Key</span>
        <input className="login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="????????" />
      </label>
      <button className="cta-link cta-button login-submit" type="submit">Authenticate</button>
    </form>
  );
}

function BlogDashboardView({ dashboard, dashboardPageData, dashboardPage, setDashboardPage, onDelete, onTogglePublish, onNavigate, activeVariant }) {
  return (
    <section className="blog-dash">
      <div className="dash-stats">
        <article className="dash-card">
          <div className="dash-stat-head">
            <p className="dash-stat-label">Total Logs</p>
            <span className="dash-stat-icon">∑</span>
          </div>
          <h3 className="dash-stat-value">{dashboard.total}</h3>
        </article>
        <article className="dash-card">
          <div className="dash-stat-head">
            <p className="dash-stat-label">Published</p>
            <span className="dash-stat-icon dash-stat-icon-accent">●</span>
          </div>
          <h3 className="dash-stat-value">{dashboard.published}</h3>
        </article>
        <article className="dash-card">
          <div className="dash-stat-head">
            <p className="dash-stat-label">Drafts</p>
            <span className="dash-stat-icon">○</span>
          </div>
          <h3 className="dash-stat-value">{dashboard.drafts}</h3>
        </article>
      </div>
      <div className="dash-list">
        <div className="dash-list-head">
          <h3 className="dash-list-title">System Entries</h3>
          <span className="meta-pill dash-page-pill">Page {dashboardPageData.page}</span>
        </div>
        <div className="dash-rows">
          {dashboardPageData.items.length === 0 ? (
            <p className="dash-empty">No entries found in the system.</p>
          ) : null}
          {dashboardPageData.items.map((row) => {
            const isVlog = row.variant === "vlog";
            const vlogId = isVlog ? parseYouTubeVideoId(row.content) : "";
            const vlogEmbedUrl = vlogId ? buildYouTubeEmbedUrl(vlogId) : "";
            return (
              <div className={`dash-row ${isVlog ? "dash-row-vlog" : ""}`} key={row.id}>
                <div className="dash-row-main">
                  <a className="dash-entry-link" href={`/blog/${row.id}`} onClick={(event) => onNavigate(`/blog/${row.id}`, event)}>{row.title || "Untitled Entry"}</a>
                  <div className="dash-row-meta dash-row-meta-tight">
                    <span className="meta-pill">{isVlog ? "VLOG" : "BLOG"}</span>
                    <span className={`meta-pill status-pill ${row.published ? "is-published" : "is-draft"}`}>
                      {row.published ? "Published" : "Draft"}
                    </span>
                    {row.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: row.category.name, variant: activeVariant })}>{row.category.name}</a> : <span className="meta-pill">Uncategorized</span>}
                    {Array.isArray(row.tags) && row.tags.length > 0
                      ? row.tags.map((tag) => <a className="meta-pill meta-link" key={`${row.id}-${tag.id}`} href={buildBlogFilterHref({ tag: tag.name, variant: activeVariant })}>{tag.name}</a>)
                      : null}
                  </div>
                  {row.summary ? <p className="dash-row-summary">{row.summary}</p> : null}
                </div>
                {isVlog ? (
                  <div className="dash-vlog-preview">
                    {vlogEmbedUrl ? (
                      <div className="video-wrap dash-vlog-video">
                        <iframe
                          className="video-frame"
                          src={vlogEmbedUrl}
                          title={row.title || "Vlog preview"}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <p className="dash-vlog-missing">Add a valid YouTube URL in edit mode to preview this vlog.</p>
                    )}
                  </div>
                ) : null}
                <div className="dash-actions">
                  <a className="cta-link" href={`/blog/${row.id}/edit`} onClick={(event) => onNavigate(`/blog/${row.id}/edit`, event)}>Edit</a>
                  <button className="cta-link cta-button" type="button" onClick={() => onTogglePublish(row)}>{row.published ? "Unpublish" : "Publish"}</button>
                  <button className="cta-link cta-button cta-danger" type="button" onClick={(event) => onDelete(row.id, event)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
        {dashboardPageData.totalPages > 1 ? (
          <div className="dash-pagination-wrap">
            <PaginationControls
              page={dashboardPageData.page}
              totalPages={dashboardPageData.totalPages}
              onPrevious={() => setDashboardPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setDashboardPage((prev) => Math.min(dashboardPageData.totalPages, prev + 1))}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BlogListView({ listPageData, listPage, setListPage, isAdmin, onDelete, onNavigate, activeVariant }) {
  return (
    <section className="blog-grid">
      {listPageData.items.length === 0 ? (
        <div className="blog-empty-wrap">
          <p className="blog-empty-text">No entries found matching the current filters.</p>
        </div>
      ) : null}
      {listPageData.items.map((row) => (
        <article className={`blog-card blog-card-spawn ${row.variant === "vlog" ? "blog-card-vlog" : ""}`} key={row.id}>
          <div className="blog-card-head">
            <h3 className="blog-card-title"><a href={`/blog/${row.id}`} onClick={(event) => onNavigate(`/blog/${row.id}`, event)}>{row.title}</a></h3>
            {!row.published && isAdmin ? <span className="meta-pill draft-pill">Draft</span> : null}
          </div>
          {row.variant === "vlog" ? (
            <div className="blog-card-vlog-preview">
              {parseYouTubeVideoId(row.content) ? (
                <div className="video-wrap blog-card-vlog-video">
                  <iframe
                    className="video-frame"
                    src={buildYouTubeEmbedUrl(parseYouTubeVideoId(row.content))}
                    title={row.title || "Vlog preview"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="blog-card-vlog-missing">Invalid YouTube URL in this vlog entry.</p>
              )}
            </div>
          ) : null}
          {row.variant !== "vlog" ? <p className="blog-card-summary">{row.summary || "No summary provided for this entry."}</p> : null}
          {row.variant !== "vlog" || row.category || (Array.isArray(row.tags) && row.tags.length > 0) ? (
            <div className={`blog-card-meta ${row.variant === "vlog" ? "blog-card-meta-vlog" : ""}`}>
              {row.variant !== "vlog" ? <span className="meta-pill">BLOG</span> : null}
              {row.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: row.category.name, variant: activeVariant })}>{row.category.name}</a> : null}
              {Array.isArray(row.tags) ? row.tags.slice(0, 3).map((tag) => <a className="meta-pill meta-link" key={tag.id} href={buildBlogFilterHref({ tag: tag.name, variant: activeVariant })}>{tag.name}</a>) : null}
            </div>
          ) : null}
          {isAdmin ? (
            <div className="blog-row-actions admin-card-actions">
              <a className="cta-link" href={`/blog/${row.id}/edit`} onClick={(event) => onNavigate(`/blog/${row.id}/edit`, event)}>Edit</a>
              <button className="cta-link cta-button cta-danger" type="button" onClick={(event) => onDelete(row.id, event)}>Delete</button>
            </div>
          ) : null}
        </article>
      ))}
      {listPageData.totalPages > 1 ? (
        <div className="blog-pagination-wrap">
          <PaginationControls
            page={listPageData.page}
            totalPages={listPageData.totalPages}
            onPrevious={() => setListPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setListPage((prev) => Math.min(listPageData.totalPages, prev + 1))}
          />
        </div>
      ) : null}
    </section>
  );
}

function BlogEditorView({ form, onField, onSave, goBack, previousView, applyEditorWrap, imageInputRef, imageScalePct, setImageScalePct, onImagePick, categories, newCategoryName, setNewCategoryName, createCategory, tags }) {
  const isVlog = form.variant === "vlog";
  const vlogId = isVlog ? parseYouTubeVideoId(form.content) : "";
  const vlogEmbedUrl = vlogId ? buildYouTubeEmbedUrl(vlogId) : "";
  return (
    <section className="editor-shell">
      <form className="blog-form editor-main" onSubmit={onSave}>
        <div className="blog-row-actions editor-back-row">
          <button className="cta-link cta-button" type="button" onClick={() => goBack(previousView === "dashboard" ? PATH_BLOG_DASHBOARD : PATH_BLOG)}>← Back to Console</button>
        </div>
        <label>
          <span className="field-label">Entry Title</span>
          <input value={form.title} onChange={(e) => onField("title", e.target.value)} placeholder="e.g., Migrating to a new infrastructure..." />
        </label>
        <label>
          <span className="field-label">Summary</span>
          <input value={form.summary} onChange={(e) => onField("summary", e.target.value)} placeholder="Brief overview of this log entry..." />
        </label>
        <label>
          <span className="field-label">Variant</span>
          <select value={form.variant || "blog"} onChange={(e) => onField("variant", e.target.value)}>
            <option value="blog">Blog</option>
            <option value="vlog">Vlog</option>
          </select>
        </label>
        <label>
          <span className="field-label">{isVlog ? TEXT_VLOG_URL_LABEL : "Log Content"}</span>
          {isVlog ? (
            <>
              <input id="blog-content-editor" type="url" value={form.content} onChange={(e) => onField("content", e.target.value)} placeholder={TEXT_VLOG_URL_PLACEHOLDER} />
              <p className="editor-help editor-help-sm">{TEXT_VLOG_URL_HELP}</p>
              <div className="editor-preview">
                <p className="editor-help editor-preview-title">Video Preview</p>
                {vlogEmbedUrl ? (
                  <div className="video-wrap">
                    <iframe
                      className="video-frame"
                      src={vlogEmbedUrl}
                      title="Vlog preview"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="editor-help editor-help-sm">{TEXT_VLOG_URL_INVALID}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="blog-editor-toolbar">
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("**")}>Bold</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("__")}>Underline</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("[tc]", "[/tc]")}>TC</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("```\n", "\n```")}>Code</button>
                <button className="cta-link cta-button" type="button" onClick={() => imageInputRef.current && imageInputRef.current.click()}>Image</button>
                <label className="scale-label">
                  <span className="scale-label-text">Scale %</span>
                  <input className="scale-input" type="number" min="10" max="100" value={imageScalePct} onChange={(e) => setImageScalePct(Number(e.target.value || 60))} />
                </label>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={onImagePick} className="input-hidden" />
              </div>
              <textarea id="blog-content-editor" rows={14} value={form.content} onChange={(e) => onField("content", e.target.value)} placeholder="Write your log entry here. Markdown is supported." />
              <div className="editor-preview">
                <p className="editor-help editor-preview-title">Live Preview</p>
                <div className="blog-content">{renderRichContent(form.content)}</div>
              </div>
            </>
          )}
        </label>
        <label className="blog-check publish-check">
          <input type="checkbox" checked={Boolean(form.published)} onChange={(e) => onField("published", e.target.checked ? 1 : 0)} />
          <span className="publish-check-text">Publish this entry immediately</span>
        </label>
        <button className="cta-link cta-button editor-submit" type="submit">
          {form.id ? "Commit Changes" : "Create Log Entry"}
        </button>
      </form>

      <aside className="editor-side">
        <div className="editor-side-card">
          <h3 className="editor-side-title">Classification</h3>
          <select className="editor-select" value={form.categoryId} onChange={(e) => onField("categoryId", e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((cat) => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
          </select>
          <div className="blog-inline-form editor-inline-form">
            <input className="editor-inline-input" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category..." />
            <button className="cta-link cta-button" type="button" onClick={createCategory}>Add</button>
          </div>
        </div>
        <div className="editor-side-card">
          <h3 className="editor-side-title">Metadata Tags</h3>
          <input className="editor-tags-input" value={form.tagsText} onChange={(e) => onField("tagsText", e.target.value)} list="blog-tags-list" placeholder="infra, ai, systems" />
          <datalist id="blog-tags-list">{tags.map((tag) => <option key={tag.id} value={tag.name} />)}</datalist>
          <p className="editor-help editor-help-sm">Comma-separated tags for indexing.</p>
        </div>
      </aside>
    </section>
  );
}

/**
 * @param {{page: number, totalPages: number, onPrevious: () => void, onNext: () => void}} props
 * @returns {JSX.Element}
 */
function PaginationControls(props) {
  return (
    <div className="pagination-row">
      <button className="tab-btn pagination-btn" type="button" onClick={props.onPrevious} disabled={props.page <= 1}>← Previous</button>
      <span className="pagination-meta">Page {props.page} of {props.totalPages}</span>
      <button className="tab-btn pagination-btn" type="button" onClick={props.onNext} disabled={props.page >= props.totalPages}>Next →</button>
    </div>
  );
}

/**
 * @param {MouseEvent | undefined} event
 * @returns {boolean}
 */
function isModifiedNavEvent(event) {
  if (!event) {
    return false;
  }
  return Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0);
}

/**
 * @param {EventTarget | null | undefined} target
 * @returns {[boolean|null, Error|null]}
 */
function applyActionPulse(target) {
  if (!target || !target.classList) {
    return [null, null];
  }
  target.classList.add("is-action-pulse");
  setTimeout(() => {
    target.classList.remove("is-action-pulse");
  }, BLOG_ACTION_ANIMATION_MS);
  return [true, null];
}

/**
 * @param {Array<any>} items
 * @param {number} page
 * @param {number} pageSize
 * @returns {{items: Array<any>, page: number, totalPages: number}}
 */
function paginateItems(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, totalPages };
}

/**
 * @param {{category?: string, tag?: string}} params
 * @returns {string}
 */
function buildBlogFilterHref(params) {
  const search = new URLSearchParams();
  if (params.category) {
    search.set("category", String(params.category).trim().toLowerCase());
  }
  if (params.tag) {
    search.set("tag", String(params.tag).trim().toLowerCase());
  }
  if (params.variant && params.variant !== BLOG_VARIANT_ALL) {
    search.set("variant", String(params.variant).trim().toLowerCase());
  }
  return `${PATH_BLOG}?${search.toString()}`;
}

/**
 * @param {{category?: {name?: string} | null, tags?: Array<{name?: string}>}} row
 * @param {string} activeCategory
 * @param {string} activeTag
 * @param {string} activeVariant
 * @returns {boolean}
 */
function matchesBlogFilters(row, activeCategory, activeTag, activeVariant) {
  const categoryName = String(row?.category?.name || "").toLowerCase();
  const tagNames = Array.isArray(row?.tags) ? row.tags.map((tag) => String(tag?.name || "").toLowerCase()) : [];
  const rowVariant = String(row?.variant || BLOG_VARIANT_BLOG).toLowerCase();
  const categoryMatch = !activeCategory || categoryName === activeCategory;
  const tagMatch = !activeTag || tagNames.includes(activeTag);
  const variantMatch = !activeVariant || activeVariant === BLOG_VARIANT_ALL || rowVariant === activeVariant;
  return categoryMatch && tagMatch && variantMatch;
}

/**
 * @param {string} url
 * @returns {string}
 */
function parseYouTubeVideoId(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }
  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }
  const embedMatch = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }
  return "";
}

/**
 * @param {string} id
 * @returns {string}
 */
function buildYouTubeEmbedUrl(id) {
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
}

/**
 * @param {string} content
 * @returns {Array<JSX.Element>}
 */
function renderRichContent(content) {
  const source = String(content || "");
  const blocks = source.split("```");
  return blocks.map((block, index) => {
    if (index % 2 === 1) {
      const firstLineBreak = block.indexOf("\n");
      const header = firstLineBreak >= 0 ? block.slice(0, firstLineBreak).trim().toLowerCase() : "";
      const body = firstLineBreak >= 0 ? block.slice(firstLineBreak + 1) : block;
      const lang = header === "c#" ? "csharp" : header === "cs" ? "csharp" : header;
      return <CodeBlock key={`code-${index}`} code={body} language={lang} />;
    }
    const withImages = block.split(/(!\[img\]\([^)]*\))/g).filter(Boolean);
    return (
      <div key={`text-${index}`}>
        {withImages.map((part, partIndex) => {
          const imageMatch = part.match(/^!\[img\]\(([^|)]+)\|?(\d{1,3})?\)$/);
          if (imageMatch) {
            const widthPct = Number(imageMatch[2] || 60);
            return <img key={`img-${partIndex}`} src={imageMatch[1]} className="rich-image" style={{ width: `${Math.max(10, Math.min(100, widthPct))}%` }} alt="System Log Artifact" />;
          }
          const tokens = part.split(/(\*\*[^*]+\*\*|__[^_]+__|\[tc\][\s\S]*?\[\/tc\])/g).filter(Boolean);
          return <p key={`line-${partIndex}`} className="rich-p">{tokens.map((token, tokenIndex) => token.startsWith("**") && token.endsWith("**") ? <strong key={tokenIndex} className="rich-strong">{token.slice(2, -2)}</strong> : token.startsWith("__") && token.endsWith("__") ? <u key={tokenIndex} className="rich-u">{token.slice(2, -2)}</u> : token.startsWith("[tc]") && token.endsWith("[/tc]") ? <span key={tokenIndex} className="text-center-block rich-tc">{token.slice(4, -5)}</span> : <span key={tokenIndex}>{token}</span>)}</p>;
        })}
      </div>
    );
  });
}

/**
 * @param {{code: string, language: string}} props
 * @returns {JSX.Element}
 */
function CodeBlock(props) {
  const [copied, setCopied] = useState(false);
  const normalizedCode = String(props.code || "").replace(/\r\n/g, "\n");
  const lines = normalizedCode.split("\n");
  const lang = props.language && hljs.getLanguage(props.language) ? props.language : "";

  const onCopy = async () => {
    const [, err] = await copyToClipboard(normalizedCode);
    if (err) {
      setCopied(false);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="code-shell">
      <div className="code-head">
        <span className="code-lang">{lang || TEXT_CODE_FALLBACK_LANG}</span>
        <button className={`code-copy-btn ${copied ? "is-copied" : ""}`} type="button" onClick={onCopy}>{copied ? TEXT_CODE_COPIED : TEXT_CODE_COPY}</button>
      </div>
      <div className="code-body">
        {lines.map((line, index) => {
          const rawLine = line || " ";
          const highlighted = lang ? hljs.highlight(rawLine, { language: lang }).value : hljs.highlightAuto(rawLine).value;
          return (
            <div className="code-line" key={`line-${index}`}>
              <span className="line-no">{index + 1}</span>
              <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
