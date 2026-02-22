import React, { useEffect, useRef, useState } from "react";
import { getYearLabel, buildNavItems } from "./core.pure.js";
import { createBlog, createBlogCategory, deleteBlog, downloadResumePdf, fetchMessageOfDay, getBlogAdminToken, getBlogsDashboard, getCurrentYear, getPublicBlog, listBlogCategories, listBlogs, listBlogTags, loginBlogAdmin, logoutBlogAdmin, setBlogPublished, updateBlog, uploadBlogImage } from "./core.impure.js";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
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
const PATH_BLOG = "/blog";
const PATH_BLOG_PREFIX = "/blog/";
const PATH_BLOG_DASHBOARD = "/blog/dashboard";
const PATH_AI_WORKSHOP = "/aiworkshop";
const RESUME_PRINT_ROOT_ID = "resume-print-root";
const RESUME_PDF_FILENAME = "EarlCameron-Resume.pdf";
const RESUME_PDF_EXPORT_CLASS = "pdf-export";
const BLOG_PAGE_SIZE = 10;
const TEXT_CODE_COPY = "Copy";
const TEXT_CODE_COPIED = "Copied";
const TEXT_CODE_FALLBACK_LANG = "code";

/**
 * @param {string} text
 * @returns {Promise<[boolean|null, Error|null]>}
 */
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).then(() => [true, null]).catch((err) => [null, err]);
}

/**
 * @returns {JSX.Element}
 */
export function App() {
  const navRes = buildNavItems();
  const yearRes = getCurrentYear();
  const yearLabelRes = yearRes.err ? { value: null, err: yearRes.err } : getYearLabel(yearRes.value);

  if (navRes.err || yearLabelRes.err) {
    return <main style={{ padding: 24 }}>{TEXT_INIT_ERROR}</main>;
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
      <style>{GLOBAL_CSS}</style>

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
            <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
              <a href="https://github.com/monstercameron" target="_blank" rel="noreferrer noopener" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>GitHub</a>
              <a href="https://www.linkedin.com/in/earl-cameron/" target="_blank" rel="noreferrer noopener" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>LinkedIn</a>
              <a href="https://www.youtube.com/@EarlCameron007" target="_blank" rel="noreferrer noopener" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>YouTube</a>
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
  if (pathname === PATH_HOME) {
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

  if (pathname === PATH_RESUME) {
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

  if (pathname === PATH_PROJECTS || pathname === PATH_RCTS) {
    return (
      <section className="panel">
        <p className="eyebrow">PROJECTS & EXPERIMENTS</p>
        <h2>Systems, Tools, and Hardware</h2>
        <p style={{ marginBottom: "32px", maxWidth: "70ch" }}>
          A collection of tools built to solve specific problems, explore new architectures, or push hardware constraints. I focus on observability, performance, and practical utility over glossy features.
        </p>
        <div className="cards">
          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener">Zerver</a></h3>
              <span className="chip" style={{ margin: 0 }}>Zig</span>
            </div>
            <p><strong>The Build:</strong> A backend framework built around pure-step request pipelines, explicit side effects, and built-in tracing.</p>
            <p><strong>The Why:</strong> I wanted to make API behavior observable by default, so bottlenecks and failures are easier to diagnose and fix in production without relying on heavy external APM tools.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/SchemaFlow" target="_blank" rel="noreferrer noopener">SchemaFlow</a></h3>
              <span className="chip" style={{ margin: 0 }}>Go</span>
            </div>
            <p><strong>The Build:</strong> A library for type-safe LLM extraction and structured output validation.</p>
            <p><strong>The Why:</strong> Parsing JSON from LLMs is notoriously fragile. I built this to replace runtime guessing with compile-time safety, making LLM pipelines actually production-friendly.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener">Pi Camera Rig</a></h3>
              <span className="chip" style={{ margin: 0 }}>Python / Hardware</span>
            </div>
            <p><strong>The Build:</strong> A Pygame-based GUI that turns a bare Raspberry Pi HQ camera setup into a menu-driven, standalone camera experience.</p>
            <p><strong>The Why:</strong> Command-line camera control isn't practical in the field. I needed a reliable interface with deep settings, metadata support, and a desktop mock mode for rapid iteration.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener">Latent Space Browser</a></h3>
              <span className="chip" style={{ margin: 0 }}>React / LLMs</span>
            </div>
            <p><strong>The Build:</strong> A generative encyclopedia UI where every linked term recursively generates new, context-aware AI content.</p>
            <p><strong>The Why:</strong> Exploring a new interaction model for LLMs that moves beyond the standard chat interface, focusing on low-latency exploration and transparent token/cost metrics.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/GoScript" target="_blank" rel="noreferrer noopener">GoScript</a></h3>
              <span className="chip" style={{ margin: 0 }}>Go / WebAssembly</span>
            </div>
            <p><strong>The Build:</strong> A browser-based Go environment running the real Go compiler entirely client-side via WebAssembly.</p>
            <p><strong>The Why:</strong> To make Go runnable in documentation, tutorials, and playgrounds instantly, without requiring users to install a local toolchain or rely on a backend execution server.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/MetaHumanServer" target="_blank" rel="noreferrer noopener">MetaHuman Server</a></h3>
              <span className="chip" style={{ margin: 0 }}>Python / Audio</span>
            </div>
            <p><strong>The Build:</strong> A voice-interactive chatbot server that combines NLP and real-time audio processing pipelines.</p>
            <p><strong>The Why:</strong> Text chat is slow. I wanted to build a more human-like, low-latency voice interaction layer that could be integrated into games or online services.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/mdchem" target="_blank" rel="noreferrer noopener">MDChem Backend</a></h3>
              <span className="chip" style={{ margin: 0 }}>Node.js / REST</span>
            </div>
            <p><strong>The Build:</strong> Backend services for an educational chemistry game, handling data capture, reporting workflows, and educator access.</p>
            <p><strong>The Why:</strong> Gameplay is only half the product. I built the infrastructure to store telemetry, generate useful trends, and manage controlled access for teachers.</p>
          </article>

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <h3><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener">Personal Finance Dashboard</a></h3>
              <span className="chip" style={{ margin: 0 }}>React / Vite</span>
            </div>
            <p><strong>The Build:</strong> A fast, client-side budgeting app for tracking income, expenses, debt, and goal progress.</p>
            <p><strong>The Why:</strong> Off-the-shelf tools were too slow or lacked specific workflows. I built this to centralize my personal finance tracking with instant feedback and high-visibility metrics.</p>
          </article>
        </div>
      </section>
    );
  }

  if (pathname === PATH_BLOG || pathname.startsWith(PATH_BLOG_PREFIX)) {
    return <BlogPage />;
  }

  if (pathname === PATH_AI_WORKSHOP) {
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
  const [form, setForm] = useState({ id: null, title: "", summary: "", content: "", published: 0, categoryId: "", tagsText: "" });
  const imageInputRef = useRef(null);
  const goTo = (path) => window.location.assign(path);
  const goBack = (fallbackPath = PATH_BLOG) => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(fallbackPath);
  };
  const listRows = rows.filter((row) => (isAdmin || row.published) && matchesBlogFilters(row, activeCategory, activeTag));
  const dashboardRows = rows.filter((row) => matchesBlogFilters(row, activeCategory, activeTag));
  const listPageData = paginateItems(listRows, listPage, BLOG_PAGE_SIZE);
  const dashboardPageData = paginateItems(dashboardRows, dashboardPage, BLOG_PAGE_SIZE);

  const load = async () => {
    if (isDetailView) {
      const [rowRes, listRes] = await Promise.all([getPublicBlog(detailId), listBlogs()]);
      if (rowRes.err || !rowRes.value) {
        setStatus({ text: rowRes.err ? rowRes.err.message : "Blog not found", error: true });
        return;
      }
      setDetailRow(rowRes.value);
      if (!listRes.err) {
        const published = listRes.value.filter((row) => row.published);
        const sorted = [...published].sort((a, b) => Number(a.id) - Number(b.id));
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
            published: target.published ? 1 : 0,
            categoryId: target.category?.id ? String(target.category.id) : "",
            tagsText: Array.isArray(target.tags) ? target.tags.map((tag) => tag.name).join(", ") : ""
          });
        }
        setView("editor");
      } else if (isNewRoute) {
        setForm({ id: null, title: "", summary: "", content: "", published: 0, categoryId: "", tagsText: "" });
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
  const payload = () => ({ title: form.title, summary: form.summary, content: form.content, published: form.published, categoryId: form.categoryId ? Number(form.categoryId) : null, tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) });

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
    setForm({ id: null, title: "", summary: "", content: "", published: 0, categoryId: "", tagsText: "" });
    goTo(PATH_BLOG_DASHBOARD);
    await load();
  };

  const onEdit = (row) => {
    setPreviousView(view);
    goTo(`/blog/${row.id}/edit`);
  };

  const onDelete = async (id) => {
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
    return (
      <article className="panel blog-post-detail">
        <div className="blog-post-topbar">
          <button className="cta-link cta-button" type="button" onClick={() => goTo(PATH_BLOG)}>Back to Blog List</button>
        </div>
        <p className="eyebrow">BLOG POST</p>
        <h2>{detailRow.title}</h2>
        {detailRow.summary ? <p className="blog-post-summary">{detailRow.summary}</p> : null}
        <div className="blog-post-meta">
          {detailRow.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: detailRow.category.name })}>{detailRow.category.name}</a> : null}
          {Array.isArray(detailRow.tags) ? detailRow.tags.map((tag) => <a className="meta-pill meta-link" key={tag.id} href={buildBlogFilterHref({ tag: tag.name })}>{tag.name}</a>) : null}
        </div>
        <div className="blog-content blog-detail-content">{renderRichContent(detailRow.content)}</div>
        <div className="blog-row-actions blog-detail-nav">
          {detailNav.prevId ? <a className="cta-link" href={`/blog/${detailNav.prevId}`}>Previous</a> : <span />}
          {detailNav.nextId ? <a className="cta-link" href={`/blog/${detailNav.nextId}`}>Next</a> : <span />}
        </div>
      </article>
    );
  }

  return (
    <section className="panel blog-shell">
      <header className="blog-header">
        <div>
          <p className="eyebrow">BLOG</p>
          <h2>{isAdmin ? "Publishing Console" : "Journal & Notes"}</h2>
          <p className="blog-subhead">Engineering notes, experiments, and build logs.</p>
          {(activeCategory || activeTag) ? (
            <p className="blog-subhead">
              Filter:
              {activeCategory ? ` category=${activeCategory}` : ""}
              {activeCategory && activeTag ? " |" : ""}
              {activeTag ? ` tag=${activeTag}` : ""}
              {" "}
              <a href={PATH_BLOG}>Clear</a>
            </p>
          ) : null}
        </div>
        <div className="blog-header-actions">
          <button className={`tab-btn ${view === "list" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG)}>Posts</button>
          {!isAdmin ? <button className={`tab-btn ${view === "login" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}>Admin</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "dashboard" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}>Dashboard</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "editor" ? "is-active" : ""}`} type="button" onClick={() => { setPreviousView(view); goTo("/blog/0/new"); }}>New Post</button> : null}
          {isAdmin ? <button className="tab-btn danger" type="button" onClick={() => { logoutBlogAdmin(); setIsAdmin(false); goTo(PATH_BLOG); }}>Logout</button> : null}
        </div>
      </header>

      {status.text ? <p className={status.error ? "blog-error" : "blog-success"}>{status.text}</p> : null}

      {view === "login" && !isAdmin ? (
        <form className="blog-login-card" onSubmit={onLogin}>
          <label>
            <span>Admin Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="cta-link cta-button" type="submit">Login</button>
        </form>
      ) : null}

      {view === "dashboard" && isAdmin ? (
        <section className="blog-dash">
          <div className="dash-stats">
            <article className="dash-card"><p>Total Posts</p><h3>{dashboard.total}</h3></article>
            <article className="dash-card"><p>Published</p><h3>{dashboard.published}</h3></article>
            <article className="dash-card"><p>Drafts</p><h3>{dashboard.drafts}</h3></article>
          </div>
          <div className="dash-list">
            <h3>All Posts</h3>
            <div className="dash-rows">
              {dashboardPageData.items.map((row) => (
                <div className="dash-row" key={row.id}>
                  <div className="dash-row-main">
                    <a href={`/blog/${row.id}`}>{row.title}</a>
                    <div className="dash-row-meta">
                      <span className="meta-pill">{row.published ? "Published" : "Draft"}</span>
                      {row.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: row.category.name })}>{row.category.name}</a> : <span className="meta-pill">No category</span>}
                      {Array.isArray(row.tags) && row.tags.length > 0
                        ? row.tags.map((tag) => <a className="meta-pill meta-link" key={`${row.id}-${tag.id}`} href={buildBlogFilterHref({ tag: tag.name })}>{tag.name}</a>)
                        : <span className="meta-pill">Tags: none</span>}
                    </div>
                  </div>
                  <div className="dash-actions">
                    <button className="cta-link cta-button" type="button" onClick={() => onEdit(row)}>Edit</button>
                    <button className="cta-link cta-button cta-danger" type="button" onClick={() => onDelete(row.id)}>Delete</button>
                    <button className="cta-link cta-button" type="button" onClick={() => onTogglePublish(row)}>{row.published ? "Unpublish" : "Publish"}</button>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={dashboardPageData.page}
              totalPages={dashboardPageData.totalPages}
              onPrevious={() => setDashboardPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setDashboardPage((prev) => Math.min(dashboardPageData.totalPages, prev + 1))}
            />
          </div>
        </section>
      ) : null}

      {view === "list" ? (
        <section className="blog-grid">
          {listPageData.items.map((row) => (
            <article className="blog-card" key={row.id}>
              <h3><a href={`/blog/${row.id}`}>{row.title}</a></h3>
              <p className="blog-card-summary">{row.summary || "No summary yet."}</p>
              <div className="blog-card-meta">
                {row.category ? <a className="meta-pill meta-link" href={buildBlogFilterHref({ category: row.category.name })}>{row.category.name}</a> : null}
                {Array.isArray(row.tags) ? row.tags.slice(0, 3).map((tag) => <a className="meta-pill meta-link" key={tag.id} href={buildBlogFilterHref({ tag: tag.name })}>{tag.name}</a>) : null}
              </div>
              {isAdmin ? (
                <div className="blog-row-actions">
                  <button className="cta-link cta-button" type="button" onClick={() => onEdit(row)}>Edit</button>
                  <button className="cta-link cta-button cta-danger" type="button" onClick={() => onDelete(row.id)}>Delete</button>
                </div>
              ) : null}
            </article>
          ))}
          <div className="blog-pagination-wrap">
            <PaginationControls
              page={listPageData.page}
              totalPages={listPageData.totalPages}
              onPrevious={() => setListPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setListPage((prev) => Math.min(listPageData.totalPages, prev + 1))}
            />
          </div>
        </section>
      ) : null}

      {view === "editor" && isAdmin ? (
        <section className="editor-shell">
          <form className="blog-form editor-main" onSubmit={onSave}>
            <div className="blog-row-actions">
              <button className="cta-link cta-button" type="button" onClick={() => goBack(previousView === "dashboard" ? PATH_BLOG_DASHBOARD : PATH_BLOG)}>Back</button>
            </div>
            <label><span>Title</span><input value={form.title} onChange={(e) => onField("title", e.target.value)} /></label>
            <label><span>Summary</span><input value={form.summary} onChange={(e) => onField("summary", e.target.value)} /></label>
            <label>
              <span>Content</span>
              <div className="blog-editor-toolbar">
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("**")}>Bold</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("__")}>Underline</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("[tc]", "[/tc]")}>TC</button>
                <button className="cta-link cta-button" type="button" onClick={() => applyEditorWrap("```\n", "\n```")}>Code</button>
                <button className="cta-link cta-button" type="button" onClick={() => imageInputRef.current && imageInputRef.current.click()}>Image</button>
                <label>Scale %<input type="number" min="10" max="100" value={imageScalePct} onChange={(e) => setImageScalePct(Number(e.target.value || 60))} /></label>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={onImagePick} style={{ display: "none" }} />
              </div>
              <textarea id="blog-content-editor" rows={14} value={form.content} onChange={(e) => onField("content", e.target.value)} />
              <div className="editor-preview">
                <p className="editor-help">Live Preview</p>
                <div className="blog-content">{renderRichContent(form.content)}</div>
              </div>
            </label>
            <label className="blog-check"><input type="checkbox" checked={Boolean(form.published)} onChange={(e) => onField("published", e.target.checked ? 1 : 0)} /><span>Published</span></label>
            <button className="cta-link cta-button" type="submit">{form.id ? "Save Changes" : "Create Blog"}</button>
          </form>

          <aside className="editor-side">
            <div className="editor-side-card">
              <h3>Category</h3>
              <select value={form.categoryId} onChange={(e) => onField("categoryId", e.target.value)}>
                <option value="">No category</option>
                {categories.map((cat) => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
              </select>
              <div className="blog-inline-form">
                <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" />
                <button className="cta-link cta-button" type="button" onClick={createCategory}>Add</button>
              </div>
            </div>
            <div className="editor-side-card">
              <h3>Tags</h3>
              <input value={form.tagsText} onChange={(e) => onField("tagsText", e.target.value)} list="blog-tags-list" placeholder="infra, ai, systems" />
              <datalist id="blog-tags-list">{tags.map((tag) => <option key={tag.id} value={tag.name} />)}</datalist>
              <p className="editor-help">Comma-separated tags only.</p>
            </div>
          </aside>
        </section>
      ) : null}
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
      <button className="tab-btn pagination-btn" type="button" onClick={props.onPrevious} disabled={props.page <= 1}>Previous</button>
      <span className="pagination-meta">Page {props.page} of {props.totalPages}</span>
      <button className="tab-btn pagination-btn" type="button" onClick={props.onNext} disabled={props.page >= props.totalPages}>Next</button>
    </div>
  );
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
  return `${PATH_BLOG}?${search.toString()}`;
}

/**
 * @param {{category?: {name?: string} | null, tags?: Array<{name?: string}>}} row
 * @param {string} activeCategory
 * @param {string} activeTag
 * @returns {boolean}
 */
function matchesBlogFilters(row, activeCategory, activeTag) {
  const categoryName = String(row?.category?.name || "").toLowerCase();
  const tagNames = Array.isArray(row?.tags) ? row.tags.map((tag) => String(tag?.name || "").toLowerCase()) : [];
  const categoryMatch = !activeCategory || categoryName === activeCategory;
  const tagMatch = !activeTag || tagNames.includes(activeTag);
  return categoryMatch && tagMatch;
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
            return <img key={`img-${partIndex}`} src={imageMatch[1]} style={{ width: `${Math.max(10, Math.min(100, widthPct))}%`, height: "auto" }} alt="Blog content" />;
          }
          const tokens = part.split(/(\*\*[^*]+\*\*|__[^_]+__|\[tc\][\s\S]*?\[\/tc\])/g).filter(Boolean);
          return <p key={`line-${partIndex}`}>{tokens.map((token, tokenIndex) => token.startsWith("**") && token.endsWith("**") ? <strong key={tokenIndex}>{token.slice(2, -2)}</strong> : token.startsWith("__") && token.endsWith("__") ? <u key={tokenIndex}>{token.slice(2, -2)}</u> : token.startsWith("[tc]") && token.endsWith("[/tc]") ? <span key={tokenIndex} className="text-center-block">{token.slice(4, -5)}</span> : <span key={tokenIndex}>{token}</span>)}</p>;
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
        <button className="code-copy-btn" type="button" onClick={onCopy}>{copied ? TEXT_CODE_COPIED : TEXT_CODE_COPY}</button>
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

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg: #050505;
  --bg-soft: #0a0a0a;
  --panel: rgba(20, 20, 20, 0.6);
  --ink: #ededed;
  --muted: #a1a1aa;
  --line: rgba(255, 255, 255, 0.08);
  --accent: #eab308;
  --accent-soft: #fef08a;
  --glow: rgba(234, 179, 8, 0.15);
}
* { box-sizing: border-box; }
body { 
  margin: 0; 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: radial-gradient(circle at 50% 0%, #1f1f1f 0%, var(--bg) 60%), var(--bg); 
  color: var(--ink); 
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.site-shell { min-height: 100vh; display: flex; flex-direction: column; }
.container { width: min(1080px, 90vw); margin: 0 auto; }

/* Topbar */
.topbar { border-bottom: 1px solid var(--line); background: rgba(5, 5, 5, 0.6); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
.topbar-inner { display: flex; align-items: center; gap: 16px; padding: 16px 0; }
.brand-mark { width: 40px; height: 40px; border: 1px solid var(--line); background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent); border-radius: 10px; color: var(--ink); display: grid; place-items: center; font-weight: 600; letter-spacing: 0.05em; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.brand-name { margin: 0; font-size: 1.1rem; font-weight: 600; letter-spacing: -0.01em; }
.brand-role { margin: 2px 0 0; color: var(--muted); font-size: 0.85rem; }

/* Nav */
.nav-wrap { border-bottom: 1px solid var(--line); background: rgba(5, 5, 5, 0.4); backdrop-filter: blur(12px); }
.nav-shell { padding: 12px 0; }
.nav-row { display: flex; flex-wrap: wrap; gap: 6px; }
.nav-link { color: var(--muted); text-decoration: none; padding: 6px 12px; font-size: 0.85rem; font-weight: 500; border-radius: 8px; transition: all 0.2s ease; }
.nav-link:hover { color: var(--ink); background: rgba(255,255,255,0.05); }
.nav-link.is-active { color: var(--ink); background: rgba(255,255,255,0.1); }
.nav-ext { margin-left: 4px; font-size: 0.75rem; opacity: 0.7; }

/* Main */
.main-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; padding: 40px 0 60px; flex: 1; align-content: start; }

/* Panels */
.panel { background: var(--panel); backdrop-filter: blur(16px); border: 1px solid var(--line); padding: 32px; border-radius: 16px; box-shadow: 0 8px 32px -12px rgba(0,0,0,0.5); transition: transform 0.2s ease, border-color 0.2s ease; }
.motd-panel { border-color: rgba(234, 179, 8, 0.3); background: linear-gradient(180deg, rgba(234, 179, 8, 0.05), transparent); }
.motd-quote { margin: 12px 0 0; color: var(--ink); font-size: clamp(1.1rem, 1.5vw, 1.25rem); line-height: 1.6; font-weight: 500; font-style: italic; }
.motd-status { margin-top: 12px; font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

/* Typography */
h1, h2, h3, h4 { margin-top: 0; color: var(--ink); font-weight: 600; letter-spacing: -0.02em; }
.hero h2, .panel h2 { margin-bottom: 16px; font-size: clamp(1.75rem, 3vw, 2.5rem); }
.eyebrow { color: var(--accent); letter-spacing: 0.15em; font-size: 0.75rem; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; }
.panel p { color: var(--muted); line-height: 1.7; margin-top: 0; }
.panel a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--line); transition: border-color 0.2s ease; }
.panel a:hover { border-bottom-color: var(--accent); }

/* Hero */
.hero-intro { background: transparent; border: none; box-shadow: none; padding: 20px 0 40px; }
.hero-intro-grid { display: grid; grid-template-columns: 1.2fr 340px; gap: 40px; align-items: center; }
.hero-copy { max-width: 64ch; }
.hero-copy h2 { background: linear-gradient(to right, #fff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.15; }
.hero-copy p { font-size: 1.1rem; }
.hero-mini-metrics { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
.metric-pill { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid var(--line); padding: 6px 12px; border-radius: 20px; color: var(--muted); background: rgba(255,255,255,0.02); }
.hero-anchor-wrap { width: 100%; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.home-anchor-image { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border: 1px solid var(--line); border-radius: 20px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6); }
.hero-caption { margin: 0; font-size: 0.85rem; color: var(--muted); text-align: center; }

/* Grids */
.home-grid { display: grid; gap: 24px; grid-template-columns: 1fr 1fr; align-items: start; }
.home-grid .panel:first-child { grid-column: span 2; }
.kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 20px; }
.key { margin: 0; color: var(--ink); font-weight: 600; font-size: 0.95rem; }
.val { margin: 6px 0 0; font-size: 0.95rem; }

/* Cards */
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.card { border: 1px solid var(--line); padding: 24px; background: rgba(255,255,255,0.02); border-radius: 12px; transition: all 0.2s ease; }
.card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); box-shadow: 0 8px 24px -8px rgba(0,0,0,0.3); }
.card h3 { margin: 0 0 12px; font-size: 1.1rem; }
.card p { font-size: 0.95rem; margin-bottom: 8px; }
.card p:last-child { margin-bottom: 0; }

/* Video */
.video-wrap { width: 100%; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #000; margin-bottom: 16px; box-shadow: 0 8px 24px -8px rgba(0,0,0,0.5); }
.video-frame { width: 100%; aspect-ratio: 16 / 9; border: 0; display: block; }

/* Resume */
.list { margin: 12px 0 0; padding-left: 20px; color: var(--muted); display: grid; gap: 10px; line-height: 1.6; font-size: 0.95rem; }
.resume-title { margin: 0 0 4px; font-size: 2rem; }
.resume-subtitle { margin: 0 0 16px; color: var(--muted); font-size: 1.1rem; font-weight: 500; }
.resume-contact { margin: 0 0 16px; font-size: 0.95rem; display: flex; align-items: center; flex-wrap: wrap; }
.resume-contact a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--line); }
.resume-contact a:hover { border-bottom-color: var(--accent); }
.dot-sep { margin: 0 12px; color: var(--line); }
.resume-summary { max-width: 80ch; font-size: 1.05rem; }
.resume-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
.resume-hero-cta { min-width: 240px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.resume-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 24px; }
.resume-block { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 24px; border-radius: 12px; }
.skills-block { grid-column: span 2; }
.experience-block { grid-column: span 2; }
.resume-block h3 { margin: 0 0 16px; font-size: 1.1rem; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.chip { border: 1px solid var(--line); padding: 4px 10px; font-size: 0.8rem; color: var(--muted); background: rgba(255,255,255,0.03); border-radius: 6px; }
.chip-label { border: none; background: transparent; color: var(--ink); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-left: 0; margin-right: 4px; margin-left: 8px; }
.chip-label:first-child { margin-left: 0; }
.xp-item + .xp-item { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); }
.xp-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; flex-wrap: wrap; margin-bottom: 8px; }
.xp-role { margin: 0; color: var(--ink); font-weight: 600; font-size: 1.05rem; }
.xp-time { margin: 0; color: var(--muted); font-size: 0.9rem; font-variant-numeric: tabular-nums; }

/* Buttons */
.cta-link { display: inline-block; border: 1px solid var(--line); background: rgba(255,255,255,0.03); color: var(--ink); text-decoration: none; padding: 8px 16px; font-weight: 500; border-radius: 8px; transition: all 0.2s ease; font-size: 0.9rem; }
.panel a.cta-link { border-bottom: 1px solid var(--line); }
.cta-link:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
.cta-button { cursor: pointer; font: inherit; }
.cta-danger { border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; }
.cta-danger:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.5); }

/* Blog */
.blog-toolbar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.blog-shell { width: 100%; max-width: 960px; margin: 0 auto; }
.blog-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid var(--line); padding-bottom: 24px; }
.blog-subhead { margin: 8px 0 0; color: var(--muted) !important; font-size: 1.05rem; }
.blog-header-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.tab-btn { border: 1px solid var(--line); background: rgba(255,255,255,0.03); color: var(--muted); padding: 8px 16px; cursor: pointer; font: inherit; border-radius: 8px; font-size: 0.9rem; font-weight: 500; transition: all 0.2s ease; }
.tab-btn:hover { background: rgba(255,255,255,0.08); color: var(--ink); }
.tab-btn.is-active { border-color: var(--line); color: var(--ink); background: rgba(255,255,255,0.1); }
.tab-btn.danger { border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; }
.blog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.blog-card { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 24px; display: grid; gap: 12px; border-radius: 12px; transition: all 0.2s ease; }
.blog-card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); transform: translateY(-2px); }
.blog-card h3 { margin: 0; font-size: 1.2rem; }
.blog-card h3 a { border: none; }
.blog-card-summary { margin: 0; color: var(--muted) !important; font-size: 0.95rem; }
.blog-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.meta-pill { border: 1px solid var(--line); padding: 4px 10px; font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; border-radius: 20px; background: rgba(255,255,255,0.02); }
.meta-link { text-decoration: none; cursor: pointer; transition: all 0.2s ease; }
.meta-link:hover { border-color: var(--muted); color: var(--ink); background: rgba(255,255,255,0.08); }

/* Dashboard */
.blog-dash { display: grid; gap: 20px; }
.dash-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.dash-card { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; }
.dash-card p { margin: 0; font-size: 0.8rem; color: var(--muted) !important; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.dash-card h3 { margin: 12px 0 0; font-size: 2rem; color: var(--ink); }
.dash-list { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 24px; border-radius: 12px; }
.dash-list h3 { margin: 0 0 16px; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.dash-rows { display: grid; gap: 12px; }
.dash-row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); align-items: center; }
.dash-row:last-child { border-bottom: 0; padding-bottom: 0; }
.dash-row-main { min-width: 0; display: grid; gap: 8px; }
.dash-row-main a { font-weight: 500; font-size: 1.05rem; border: none; }
.dash-row-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.dash-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

/* Pagination */
.pagination-row { margin-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line); padding-top: 20px; }
.pagination-btn[disabled] { opacity: 0.3; cursor: not-allowed; }
.pagination-meta { color: var(--muted); font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 500; }
.blog-pagination-wrap { grid-column: 1 / -1; }

/* Editor */
.editor-shell { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
.editor-main { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 24px; display: grid; gap: 16px; border-radius: 12px; }
.editor-side { display: grid; gap: 16px; align-content: start; }
.editor-side-card { border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 20px; display: grid; gap: 12px; border-radius: 12px; }
.editor-side-card h3 { margin: 0; font-size: 1.05rem; }
.editor-help { margin: 0; color: var(--muted) !important; font-size: 0.85rem; }
.editor-preview { border: 1px solid var(--line); background: rgba(0,0,0,0.2); padding: 20px; margin-top: 8px; border-radius: 8px; }
.blog-login-card { width: min(400px, 100%); border: 1px solid var(--line); background: rgba(255,255,255,0.02); padding: 24px; display: grid; gap: 16px; border-radius: 12px; margin: 40px auto; }
.blog-form { display: grid; gap: 16px; }
.blog-form label { display: grid; gap: 8px; color: var(--ink); font-weight: 500; font-size: 0.95rem; }
.blog-form input, .blog-form textarea, .blog-form select { background: rgba(0,0,0,0.2); border: 1px solid var(--line); color: var(--ink); padding: 10px 12px; font: inherit; border-radius: 8px; transition: border-color 0.2s ease; }
.blog-form input:focus, .blog-form textarea:focus, .blog-form select:focus { outline: none; border-color: var(--muted); }
.blog-check { display: flex !important; align-items: center; gap: 10px; flex-direction: row !important; }
.blog-row-actions { display: flex; gap: 10px; }
.blog-editor-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 8px; border: 1px solid var(--line); }

/* Blog Detail */
.blog-post-detail { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px 48px; background: var(--panel); border-radius: 16px; display: flex; flex-direction: column; min-height: 70vh; }
.blog-post-topbar { display: flex; justify-content: space-between; margin-bottom: 24px; }
.blog-post-detail h2 { font-size: clamp(2rem, 4vw, 3rem); line-height: 1.15; margin: 8px 0 16px; color: var(--ink); letter-spacing: -0.03em; }
.blog-post-summary { font-size: 1.15rem; line-height: 1.6; margin: 0 0 24px; color: var(--muted) !important; max-width: 65ch; }
.blog-post-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
.blog-detail-content { border-top: 1px solid var(--line); padding-top: 32px; font-size: 1.05rem; line-height: 1.8; }
.blog-detail-content p { margin: 0 0 20px; color: #d4d4d8; }
.blog-detail-nav { justify-content: space-between; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--line); }

/* Code Blocks */
.code-shell { margin: 24px 0; border: 1px solid var(--line); background: #0a0a0a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
.code-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--line); background: rgba(255,255,255,0.03); }
.code-lang { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.code-copy-btn { border: 1px solid var(--line); background: rgba(255,255,255,0.05); color: var(--ink); font: inherit; font-size: 0.75rem; font-weight: 500; padding: 4px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
.code-copy-btn:hover { background: rgba(255,255,255,0.1); }
.code-body { overflow-x: auto; padding: 12px 0; }
.code-line { display: grid; grid-template-columns: 48px 1fr; gap: 16px; align-items: baseline; padding: 0 16px; min-height: 1.5rem; }
.line-no { color: #52525b; text-align: right; user-select: none; font: 400 0.8rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
.code-line code { display: block; white-space: pre; color: #e4e4e7; font: 400 0.9rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }

/* Misc */
.blog-content img { display: block; margin: 24px 0; border: 1px solid var(--line); border-radius: 12px; }
.text-center-block { display: block; text-align: center; }
.blog-inline-form { display: flex; gap: 8px; }
.blog-inline-form input { flex: 1; }
.blog-error { color: #fca5a5 !important; background: rgba(239, 68, 68, 0.1); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); }
.blog-success { color: #86efac !important; background: rgba(34, 197, 94, 0.1); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2); }

/* PDF Export */
.pdf-export, .pdf-export * { color: #000 !important; }
.pdf-export { background: #fff !important; border-color: #e5e7eb !important; }
.pdf-export .resume-block { background: #fff !important; border-color: #e5e7eb !important; box-shadow: none !important; }
.pdf-export .chip { background: #f3f4f6 !important; border-color: #e5e7eb !important; color: #000 !important; }
.pdf-export .chip-label { border-color: #000 !important; }
.pdf-export .cta-link { border-color: #000 !important; color: #000 !important; background: #fff !important; }

/* Footer */
.footer { border-top: 1px solid var(--line); background: rgba(5, 5, 5, 0.8); margin-top: auto; }
.footer-inner { padding: 32px 0; display: flex; justify-content: space-between; gap: 24px; align-items: end; }
.footer-title { font-weight: 600; letter-spacing: 0.02em; font-size: 1.05rem; }
.footer-sub { color: var(--muted); margin-top: 8px; max-width: 500px; font-size: 0.9rem; line-height: 1.6; }
.footer-year { color: var(--muted); font-size: 0.85rem; font-weight: 500; }

/* Responsive */
@media (max-width: 768px) {
  .kv-grid, .cards { grid-template-columns: 1fr; }
  .blog-grid, .dash-stats, .editor-shell { grid-template-columns: 1fr; }
  .blog-header { flex-direction: column; gap: 16px; }
  .blog-header-actions { justify-content: flex-start; width: 100%; }
  .blog-post-detail { padding: 24px 20px; }
  .hero-intro-grid, .home-grid { grid-template-columns: 1fr; gap: 32px; }
  .home-grid .panel:first-child { grid-column: span 1; }
  .home-anchor-image { width: min(280px, 100%); }
  .resume-grid { grid-template-columns: 1fr; }
  .resume-hero { flex-direction: column; gap: 16px; }
  .resume-hero-cta { min-width: 0; align-items: flex-start; }
  .footer-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
  .panel { padding: 24px; }
}
`;
