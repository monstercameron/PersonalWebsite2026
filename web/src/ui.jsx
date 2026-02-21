import React from "react";
import { getYearLabel, buildNavItems } from "./core.pure.js";
import { getCurrentYear } from "./core.impure.js";

const STYLE_PAGE = { fontFamily: "system-ui", minHeight: "100vh", background: "#f3f4f6", color: "#111827" };
const STYLE_NAV_WRAP = { background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const STYLE_NAV_INNER = { maxWidth: 1100, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 14, flexWrap: "wrap" };
const STYLE_MAIN = { maxWidth: 1100, margin: "0 auto", padding: 24 };
const STYLE_CARD = { background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20 };
const STYLE_FOOTER = { marginTop: 24, background: "#27272a", color: "#e5e7eb" };
const STYLE_FOOTER_INNER = { maxWidth: 1100, margin: "0 auto", padding: 20 };
const STYLE_TITLE = { fontSize: 48, margin: 0 };
const STYLE_SUB = { fontSize: 24, marginTop: 4, marginBottom: 24 };
const STYLE_QUOTE = { fontStyle: "italic", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 };
const STYLE_GRID = { display: "grid", gap: 16 };
const STYLE_LIST = { margin: "8px 0 0 20px" };
const STYLE_TAGS = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 };
const STYLE_TAG = { background: "#dbeafe", color: "#1e3a8a", padding: "2px 8px", borderRadius: 999 };
const ARIA_PRIMARY = "Primary";
const TEXT_INIT_ERROR = "Application failed to initialize.";
const TEXT_NAME = "Earl Cameron";
const TEXT_ROLE = "Full-stack Developer & AI Innovator";
const TEXT_QUOTE = "\"Quality is never an accident; it is always the result of intelligent effort.\" - John Ruskin";

const PATH_HOME = "/";
const PATH_RESUME = "/resume";
const PATH_PROJECTS = "/projects";
const PATH_BLOG = "/blog";
const PATH_AI_WORKSHOP = "/aiworkshop";

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

  return (
    <div style={STYLE_PAGE}>
      <nav aria-label={ARIA_PRIMARY} style={STYLE_NAV_WRAP}>
        <div style={STYLE_NAV_INNER}>
          {navRes.value.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer noopener" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main style={STYLE_MAIN}>{renderPage(pathname)}</main>

      <footer style={STYLE_FOOTER}>
        <div style={STYLE_FOOTER_INNER}>
          <div>{TEXT_NAME}</div>
          <div style={{ opacity: 0.8 }}>{TEXT_ROLE}</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}>{yearLabelRes.value}</div>
        </div>
      </footer>
    </div>
  );
}

/**
 * @param {string} pathname
 * @returns {JSX.Element}
 */
function renderPage(pathname) {
  if (pathname === PATH_HOME) {
    return (
      <section style={STYLE_CARD}>
        <h1 style={STYLE_TITLE}>Earl Cameron</h1>
        <p style={STYLE_SUB}>Software Engineer</p>
        <div style={STYLE_QUOTE}>{TEXT_QUOTE}</div>
      </section>
    );
  }

  if (pathname === PATH_RESUME) {
    return (
      <section style={STYLE_CARD}>
        <h1>Resume</h1>
        <div style={STYLE_GRID}>
          <div>
            <h2>Professional Summary</h2>
            <p>Full-stack Developer with 4+ years of experience across frontend, backend, support escalation, and AI chatbot development.</p>
          </div>
          <div>
            <h2>Key Skills</h2>
            <p>JavaScript, Python, .NET, Node.js, React, SQL, OpenAI API, HTMX, Go, Linux, Windows.</p>
          </div>
          <div>
            <h2>Professional Experience</h2>
            <ul style={STYLE_LIST}>
              <li>Software Engineer - UKG (2020 to Present)</li>
              <li>Instructor/TA - 4Geeks Academy</li>
              <li>HTML/CSS/JavaScript Tutor - HeyTutor</li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  if (pathname === PATH_PROJECTS) {
    return (
      <section style={STYLE_CARD}>
        <h1>Projects</h1>
        <ul style={STYLE_LIST}>
          <li>UKG Internal Dashboards</li>
          <li>Personal Website (Go + Templ + HTMX)</li>
          <li>MetaHuman Server</li>
          <li>MDChem</li>
          <li>People Budget</li>
        </ul>
      </section>
    );
  }

  if (pathname === PATH_BLOG) {
    return (
      <section style={STYLE_CARD}>
        <h1>My Blog</h1>
        <p>Welcome to my blog, where I share insights on software development, AI, and full-stack engineering.</p>
        <div style={STYLE_GRID}>
          <article>
            <h2>Major Website Overhaul: Enhanced Interactivity and Prism.js Integration</h2>
            <div>July 13, 2024</div>
            <div style={STYLE_TAGS}>
              <span style={STYLE_TAG}>Web Development</span>
              <span style={STYLE_TAG}>JavaScript</span>
              <span style={STYLE_TAG}>Prism.js</span>
            </div>
          </article>
          <article>
            <h2>Major Updates to My Personal Website</h2>
            <div>July 11, 2024</div>
            <div style={STYLE_TAGS}>
              <span style={STYLE_TAG}>SEO</span>
              <span style={STYLE_TAG}>Performance</span>
              <span style={STYLE_TAG}>Accessibility</span>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (pathname === PATH_AI_WORKSHOP) {
    return (
      <section style={STYLE_CARD}>
        <h1>AI Workshop</h1>
        <p>Workshop page scaffold matched to legacy route and layout. We can now replace this with final workshop content.</p>
      </section>
    );
  }

  return (
    <section style={STYLE_CARD}>
      <h1>404 - Page Not Found</h1>
      <p>The route does not exist yet.</p>
    </section>
  );
}
