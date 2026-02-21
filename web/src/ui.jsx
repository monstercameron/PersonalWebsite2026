import React, { useEffect, useState } from "react";
import { getYearLabel, buildNavItems } from "./core.pure.js";
import { downloadResumePdf, fetchMessageOfDay, getCurrentYear } from "./core.impure.js";

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
const PATH_AI_WORKSHOP = "/aiworkshop";
const RESUME_PRINT_ROOT_ID = "resume-print-root";
const RESUME_PDF_FILENAME = "EarlCameron-Resume.pdf";
const RESUME_PDF_EXPORT_CLASS = "pdf-export";

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
              <p className="eyebrow">SYSTEMS-DRIVEN ENGINEERING</p>
              <h2>Buildable ideas. Production outcomes.</h2>
              <p>
                I design and ship systems with clear constraints, measurable tradeoffs, and maintainable execution.
                From architecture to delivery, the focus is reliability, speed, and practical impact.
              </p>
              <div className="hero-mini-metrics">
                <span className="metric-pill">4+ Years Production Engineering</span>
                <span className="metric-pill">AI + Systems + Product Delivery</span>
                <span className="metric-pill">Cross-Functional Execution</span>
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
                <p className="key">Design To Build</p>
                <p className="val">Interfaces, fitment, dependencies, and maintenance paths are planned up front.</p>
              </div>
              <div>
                <p className="key">Tradeoff Discipline</p>
                <p className="val">Performance, cost, and timeline are balanced against real operational constraints.</p>
              </div>
              <div>
                <p className="key">High Signal</p>
                <p className="val">Clear communication, explicit assumptions, and decision-ready recommendations.</p>
              </div>
              <div>
                <p className="key">Iterative Delivery</p>
                <p className="val">Incremental milestones that reduce risk and keep teams shipping.</p>
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
        <p className="eyebrow">PROJECTS</p>
        <h2>Featured Repositories</h2>
        <div className="cards">
          <article className="card">
            <h3><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener">pi-camera-gui</a></h3>
            <p><strong>What:</strong> A Pygame-based GUI that turns Raspberry Pi HQ camera setups into a menu-driven camera experience.</p>
            <p><strong>Goal:</strong> Make camera control practical and reliable with deep settings, metadata support, and desktop mock mode.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener">LatentSpaceBrowser</a></h3>
            <p><strong>What:</strong> A generative encyclopedia UI where each linked term recursively generates new AI content.</p>
            <p><strong>Goal:</strong> Explore a new browsing model for LLMs with low-latency interaction and transparent token/cost metrics.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/MetaHumanServer" target="_blank" rel="noreferrer noopener">MetaHumanServer</a></h3>
            <p><strong>What:</strong> A Python voice-interactive chatbot server that combines NLP and audio processing.</p>
            <p><strong>Goal:</strong> Build more human-like voice interaction for games and online services.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/mdchem" target="_blank" rel="noreferrer noopener">mdchem</a></h3>
            <p><strong>What:</strong> Backend services for an educational chemistry game with REST data capture and reporting workflows.</p>
            <p><strong>Goal:</strong> Store gameplay data, generate useful trends, and manage controlled access for educators.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener">Budgetting_tool_vibecoded</a></h3>
            <p><strong>What:</strong> A React + Vite budgeting app for income, expenses, debt, goals, and dashboard metrics.</p>
            <p><strong>Goal:</strong> Centralize personal finance tracking with fast feedback and practical planning visibility.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/SchemaFlow" target="_blank" rel="noreferrer noopener">SchemaFlow</a></h3>
            <p><strong>What:</strong> A Go library for type-safe LLM extraction and structured output validation.</p>
            <p><strong>Goal:</strong> Replace fragile JSON parsing with compile-time safety and production-friendly LLM pipelines.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener">Zerver</a></h3>
            <p><strong>What:</strong> A Zig backend framework built around pure-step request pipelines, explicit side effects, and built-in tracing.</p>
            <p><strong>Goal:</strong> Make API behavior observable by default so bottlenecks and failures are easier to diagnose and fix in production.</p>
          </article>
          <article className="card">
            <h3><a href="https://github.com/monstercameron/GoScript" target="_blank" rel="noreferrer noopener">GoScript</a></h3>
            <p><strong>What:</strong> A browser-based Go environment running the real Go compiler via WebAssembly.</p>
            <p><strong>Goal:</strong> Make Go runnable in docs, tutorials, and playgrounds without local installation.</p>
          </article>
        </div>
      </section>
    );
  }

  if (pathname === PATH_BLOG) {
    return (
      <section className="panel">
        <p className="eyebrow">BLOG</p>
        <h2>Technical Notes</h2>
        <div className="cards">
          <article className="card">
            <h3>Constraint-First Architecture</h3>
            <p>How requirements and operating limits shape system topology.</p>
          </article>
          <article className="card">
            <h3>Buildability Over Hype</h3>
            <p>Turning prototypes into maintainable production artifacts.</p>
          </article>
        </div>
      </section>
    );
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

const GLOBAL_CSS = `
:root {
  --bg: #0c1116;
  --bg-soft: #121923;
  --panel: #161f2b;
  --ink: #e7edf5;
  --muted: #96a3b6;
  --line: #2a3749;
  --accent: #f4b942;
  --accent-soft: #ffdc8a;
}
* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(circle at 15% 15%, #1b2637 0, var(--bg) 48%), var(--bg); color: var(--ink); }
.site-shell { min-height: 100vh; display: flex; flex-direction: column; }
.container { width: min(1120px, 92vw); margin: 0 auto; }
.topbar { border-bottom: 1px solid var(--line); background: rgba(10, 16, 22, 0.75); backdrop-filter: blur(6px); }
.topbar-inner { display: flex; align-items: center; gap: 14px; padding: 18px 0; }
.brand-mark { width: 42px; height: 42px; border: 1px solid var(--accent); color: var(--accent); display: grid; place-items: center; font-weight: 700; letter-spacing: 0.08em; }
.brand-name { margin: 0; font-size: 1.2rem; letter-spacing: 0.04em; text-transform: uppercase; }
.brand-role { margin: 2px 0 0; color: var(--muted); font-size: 0.92rem; }
.nav-wrap { border-bottom: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)); }
.nav-shell { padding: 12px 0; }
.nav-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 6px; border: 1px solid var(--line); background: rgba(255,255,255,0.01); border-radius: 12px; }
.nav-link { color: var(--ink); text-decoration: none; border: 1px solid transparent; padding: 7px 12px; font-size: 0.84rem; letter-spacing: 0.07em; text-transform: uppercase; border-radius: 9px; transition: all 140ms ease; }
.nav-link:hover { border-color: var(--accent); color: var(--accent-soft); background: rgba(244,185,66,0.08); }
.nav-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.nav-link.is-active { border-color: var(--accent); background: rgba(244,185,66,0.14); color: var(--accent-soft); }
.nav-ext { margin-left: 6px; font-size: 0.78rem; opacity: 0.85; }
.main-grid { display: grid; gap: 16px; padding: 24px 0 28px; flex: 1; width: min(1120px, 92vw); }
.panel { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border: 1px solid var(--line); padding: 20px; }
.motd-panel { border-color: var(--accent); box-shadow: inset 0 0 0 1px rgba(244,185,66,0.2); }
.motd-quote { margin: 8px 0 0; color: var(--ink) !important; font-size: clamp(1.05rem, 1.6vw, 1.3rem); line-height: 1.5; font-weight: 600; }
.motd-status { margin-top: 8px; font-size: 0.85rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.hero h2, .panel h2 { margin-top: 8px; margin-bottom: 10px; font-size: clamp(1.4rem, 2vw, 2rem); }
.hero-intro { padding: 24px; }
.hero-intro-grid { display: grid; grid-template-columns: 1.2fr 360px; gap: 18px; align-items: start; }
.hero-layout { display: grid; gap: 12px; }
.hero-copy { max-width: 72ch; }
.hero-mini-metrics { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.metric-pill { font-size: 0.78rem; letter-spacing: 0.03em; text-transform: uppercase; border: 1px solid var(--line); padding: 4px 8px; color: var(--accent-soft); }
.hero-anchor-wrap { width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.home-anchor-image { width: min(360px, 100%); aspect-ratio: 3 / 4; object-fit: cover; border: 1px solid var(--line); border-radius: 10px; }
.hero-caption { margin: 0; font-size: 0.9rem; color: var(--muted); }
.home-grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
.home-grid .panel:first-child { grid-column: span 2; }
.panel h3 { margin-top: 0; }
.eyebrow { color: var(--accent); letter-spacing: 0.12em; font-size: 0.78rem; margin: 0; text-transform: uppercase; }
.panel p { color: var(--muted); line-height: 1.65; }
.panel a { color: var(--accent-soft); text-decoration: none; border-bottom: 1px solid transparent; }
.panel a:hover { color: var(--accent); border-bottom-color: var(--accent); }
.kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 12px; }
.key { margin: 0; color: var(--ink); font-weight: 600; }
.val { margin: 6px 0 0; }
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card { border: 1px solid var(--line); padding: 14px; background: var(--bg-soft); }
.card h3 { margin: 0 0 8px; }
.video-wrap { width: 100%; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #000; }
.video-frame { width: 100%; aspect-ratio: 16 / 9; border: 0; display: block; }
.list { margin: 8px 0 0; padding-left: 18px; color: var(--muted); display: grid; gap: 8px; line-height: 1.6; }
.resume-title { margin: 8px 0 2px; }
.resume-subtitle { margin: 0 0 12px; color: var(--ink); opacity: 0.9; }
.resume-contact { margin: 0 0 10px; font-size: 0.95rem; }
.resume-contact a { color: var(--accent-soft); text-decoration: none; }
.resume-contact a:hover { text-decoration: underline; }
.dot-sep { margin: 0 8px; color: var(--muted); }
.resume-summary { max-width: none; }
.resume-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
.resume-hero-cta { min-width: 240px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.resume-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.resume-block { border: 1px solid var(--line); background: var(--bg-soft); padding: 14px; }
.skills-block { grid-column: span 2; }
.experience-block { grid-column: span 2; }
.resume-block h3 { margin: 0 0 10px; font-size: 1.02rem; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid var(--line); padding: 4px 8px; font-size: 0.85rem; color: var(--ink); background: rgba(255,255,255,0.02); }
.chip-label { border-color: var(--accent); color: var(--accent-soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.xp-item + .xp-item { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line); }
.xp-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.xp-role { margin: 0; color: var(--ink); font-weight: 600; }
.xp-time { margin: 0; color: var(--muted); font-size: 0.9rem; }
.cta-link { display: inline-block; border: 1px solid var(--accent); color: var(--accent-soft); text-decoration: none; padding: 8px 12px; font-weight: 600; }
.cta-link:hover { background: rgba(244,185,66,0.12); }
.pdf-export, .pdf-export * { color: #111111 !important; }
.pdf-export { background: #ffffff !important; border-color: #d1d5db !important; }
.pdf-export .resume-block { background: #ffffff !important; border-color: #d1d5db !important; }
.pdf-export .chip { background: #ffffff !important; border-color: #d1d5db !important; color: #111111 !important; }
.pdf-export .chip-label { border-color: #111111 !important; }
.pdf-export .cta-link { border-color: #111111 !important; color: #111111 !important; background: #ffffff !important; }
.footer { border-top: 1px solid var(--line); background: #0b1017; }
.footer-inner { padding: 20px 0; display: flex; justify-content: space-between; gap: 12px; align-items: end; }
.footer-title { font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.footer-sub { color: var(--muted); margin-top: 6px; max-width: 680px; }
.footer-year { color: var(--muted); font-size: 0.92rem; }
@media (max-width: 760px) {
  .kv-grid, .cards { grid-template-columns: 1fr; }
  .hero-intro-grid, .home-grid { grid-template-columns: 1fr; }
  .home-grid .panel:first-child { grid-column: span 1; }
  .home-anchor-image { width: min(320px, 100%); }
  .resume-grid { grid-template-columns: 1fr; }
  .resume-hero { flex-direction: column; }
  .resume-hero-cta { min-width: 0; align-items: flex-start; }
  .footer-inner { flex-direction: column; align-items: flex-start; }
}
`;
