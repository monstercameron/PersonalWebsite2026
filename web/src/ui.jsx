import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { getYearLabel, buildNavItems, getDailyHomeContent } from "./core.pure.js";
import { createBlog, createBlogCategory, deleteBlog, downloadResumePdf, fetchHomeContent, fetchMessageOfDay, fetchSlackAnimeQuestionOfDay, fromPromise, getBlog, getBlogAdminToken, getBlogsDashboard, getCurrentYear, getPublicBlog, getSlackAnimeFeedUrls, listBlogCategories, listBlogs, listBlogTags, listTrackedSlackAnime, loginBlogAdmin, logoutBlogAdmin, searchSlackAnime, setBlogPublished, trackSlackAnime, untrackSlackAnime, updateBlog, uploadBlogImage } from "./core.impure.js";
import "./ui.css";

const ARIA_PRIMARY = "Primary";
const TEXT_INIT_ERROR = "Application failed to initialize.";
const TEXT_NAME = "Earl Cameron";
const TEXT_ROLE = "Systems-Driven Software Engineer";
const TEXT_TAGLINE = "Designing buildable systems across software, hardware constraints, and real-world operations.";
const TEXT_EMAIL = "cam@earlcameron.com";
const LINK_LINKEDIN = "https://www.linkedin.com/in/earl-cameron/";
const LINK_GITHUB = "https://github.com/monstercameron";
const LINK_PROFILE_ANCHOR_IMAGE = "/images/profile-anchor-720.jpg";
const LINK_PROFILE_ANCHOR_IMAGE_WEBP = "/images/profile-anchor-720.webp";
const LINK_PROFILE_ANCHOR_IMAGE_FULL = "/images/profile-anchor.jpg";
const ALT_PROFILE_ANCHOR_IMAGE = "Earl Cameron in Tokyo at night";
const LINK_YOUTUBE_VIDEO = "https://www.youtube.com/watch?v=N1dBCwI6A7M";
const LINK_YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/N1dBCwI6A7M";
const LINK_YOUTUBE_EMBED_NOCOOKIE_PREFIX = "https://www.youtube-nocookie.com/embed/";
const LINK_YOUTUBE_THUMB_PREFIX = "https://i.ytimg.com/vi/";
const TEXT_MOTD_LOADING = "Generating today's message...";
const TEXT_MOTD_FALLBACK = "Build with intention, ship with clarity, and keep improving one decision at a time.";
const TEXT_VIDEO_LITE_TITLE = "Play latest YouTube video";
const TEXT_VIDEO_LITE_CTA = "Load Video";
const TEXT_CODE_LOADING = "Loading syntax highlighting...";
const HLJS_STYLE_IMPORT = "highlight.js/styles/github-dark.css";
const HLJS_CORE_IMPORT = "highlight.js/lib/core";
const HLJS_JS_IMPORT = "highlight.js/lib/languages/javascript";
const HLJS_TS_IMPORT = "highlight.js/lib/languages/typescript";
const HLJS_GO_IMPORT = "highlight.js/lib/languages/go";
const HLJS_JAVA_IMPORT = "highlight.js/lib/languages/java";
const HLJS_CSHARP_IMPORT = "highlight.js/lib/languages/csharp";
const HLJS_CSS_IMPORT = "highlight.js/lib/languages/css";
const HLJS_RUST_IMPORT = "highlight.js/lib/languages/rust";

const IconHome = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconResume = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconProjects = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconBlog = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconGitHub = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;
const IconLinkedIn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const IconYouTube = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
const IconRSS = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>;
const IconExternal = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IconMail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconSettings = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconTerminal = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;
const IconDollar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconBot = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconLogIn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const IconLogOut = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconBrandMark = () => (
  <svg className="brand-mark-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="brandRingGradient" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="55%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="100%" stopColor="rgba(234,179,8,0.95)" />
      </linearGradient>
      <linearGradient id="brandScanGradient" x1="10" y1="0" x2="38" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(234,179,8,0)" />
        <stop offset="50%" stopColor="rgba(234,179,8,0.55)" />
        <stop offset="100%" stopColor="rgba(234,179,8,0)" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="40" height="40" rx="11" className="brand-mark-bg" />
    <circle cx="24" cy="24" r="17" className="brand-mark-ring brand-mark-ring-outer" />
    <circle cx="24" cy="24" r="13.2" className="brand-mark-ring brand-mark-ring-inner" />
    <path className="brand-scan-line" d="M9 31 C17 21, 31 21, 39 31" />
    <text className="brand-mark-text-outline" x="24.5" y="24" textAnchor="middle">EC</text>
    <text className="brand-mark-text" x="24.5" y="24" textAnchor="middle">EC</text>
  </svg>
);

const ICON_MAP = {
  IconHome,
  IconResume,
  IconProjects,
  IconTerminal,
  IconDollar,
  IconBlog,
  IconBot,
  IconSearch,
  IconLogIn,
  IconLogOut,
  IconGitHub,
  IconLinkedIn,
  IconYouTube,
  IconRSS,
  IconExternal
};

const PATH_HOME = "/";
const PATH_RESUME = "/resume";
const PATH_PROJECTS = "/projects";
const PATH_RCTS = "/rcts";
const PATH_BUDGET = "/budget";
const PATH_SLACKANIME = "/slackanime";
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
const API_BLOG_RSS_FEED_PATH = "/api/blogs/feed.xml";
const BudgetToolPageLazy = lazy(() => import("./budget/entry.jsx"));
let highlightRuntime = null;
let highlightRuntimePromise = null;

/**
 * @returns {Promise<[any|null, Error|null]>}
 */
function loadHighlightRuntime() {
  if (highlightRuntime) {
    return Promise.resolve([highlightRuntime, null]);
  }
  if (highlightRuntimePromise) {
    return highlightRuntimePromise;
  }

  highlightRuntimePromise = (async () => {
    const modulesRes = await fromPromise(Promise.all([
      import(HLJS_CORE_IMPORT),
      import(HLJS_STYLE_IMPORT),
      import(HLJS_JS_IMPORT),
      import(HLJS_TS_IMPORT),
      import(HLJS_GO_IMPORT),
      import(HLJS_JAVA_IMPORT),
      import(HLJS_CSHARP_IMPORT),
      import(HLJS_CSS_IMPORT),
      import(HLJS_RUST_IMPORT)
    ]));
    if (modulesRes.err) {
      highlightRuntimePromise = null;
      return [null, modulesRes.err];
    }

    const core = modulesRes.value[0].default;
    const javascriptLang = modulesRes.value[2].default;
    const typescriptLang = modulesRes.value[3].default;
    const goLang = modulesRes.value[4].default;
    const javaLang = modulesRes.value[5].default;
    const csharpLang = modulesRes.value[6].default;
    const cssLang = modulesRes.value[7].default;
    const rustLang = modulesRes.value[8].default;

    core.registerLanguage("javascript", javascriptLang);
    core.registerLanguage("js", javascriptLang);
    core.registerLanguage("typescript", typescriptLang);
    core.registerLanguage("ts", typescriptLang);
    core.registerLanguage("go", goLang);
    core.registerLanguage("java", javaLang);
    core.registerLanguage("csharp", csharpLang);
    core.registerLanguage("cs", csharpLang);
    core.registerLanguage("c#", csharpLang);
    core.registerLanguage("css", cssLang);
    core.registerLanguage("zig", rustLang);

    highlightRuntime = core;
    return [highlightRuntime, null];
  })();

  return highlightRuntimePromise;
}

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
  const [homeContent, setHomeContent] = useState(null);

  useEffect(() => {
    let active = true;
    const loadHome = async () => {
      const [motdRes, homeRes] = await Promise.all([fetchMessageOfDay(), fetchHomeContent()]);
      if (!active) {
        return;
      }

      if (motdRes.err) {
        setMotd({ quote: TEXT_MOTD_FALLBACK, loading: false });
      } else {
        setMotd({ quote: motdRes.value, loading: false });
      }
      if (!homeRes.err && homeRes.value) {
        setHomeContent(homeRes.value);
      }
    };

    loadHome();
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
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">

      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand-mark" aria-hidden="true"><IconBrandMark /></div>
          <div>
            <h1 className="brand-name">{TEXT_NAME}</h1>
            <p className="brand-role">{TEXT_ROLE}</p>
          </div>
        </div>
      </header>

      <nav aria-label={ARIA_PRIMARY} className="nav-wrap">
        <div className="container nav-shell">
          <div className="nav-row">
          {navRes.value.map((item) => {
            const IconComponent = item.icon ? ICON_MAP[item.icon] : null;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "is-active" : ""}`}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer noopener" : undefined}
              >
                {IconComponent && <span className="nav-icon"><IconComponent /></span>}
                {item.label}
                {item.external ? <span className="nav-ext"><IconExternal /></span> : null}
              </a>
            );
          })}
          </div>
        </div>
      </nav>

      <main className="container main-grid">{renderPage(pathname, handleResumeDownload, motd, homeContent)}</main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <div className="footer-title">{TEXT_NAME}</div>
            <div className="footer-sub">{TEXT_TAGLINE}</div>
            <div className="footer-links">
              <a className="footer-link" href="https://github.com/monstercameron" target="_blank" rel="noreferrer noopener"><IconGitHub /> GitHub</a>
              <a className="footer-link" href="https://www.linkedin.com/in/earl-cameron/" target="_blank" rel="noreferrer noopener"><IconLinkedIn /> LinkedIn</a>
              <a className="footer-link" href="https://www.youtube.com/@EarlCameron007" target="_blank" rel="noreferrer noopener"><IconYouTube /> YouTube</a>
              <button className="footer-top-btn" onClick={handleScrollToTop} type="button">Top <IconArrowRight /></button>
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
 * @param {unknown} homeContent
 * @returns {JSX.Element}
 */
function renderPage(pathname, onResumeDownload, motd, homeContent) {
  if (pathname === PATH_HOME) return <HomePage motd={motd} homeContentOverride={homeContent} />;
  if (pathname === PATH_RESUME) return <ResumePage onResumeDownload={onResumeDownload} />;
  if (pathname === PATH_BUDGET) return <BudgetToolRoutePage />;
  if (pathname === PATH_SLACKANIME) return <SlackAnimePage />;
  if (pathname === PATH_PROJECTS || pathname === PATH_RCTS) return <ProjectsPage />;
  if (pathname === PATH_BLOG || pathname.startsWith(PATH_BLOG_PREFIX)) return <BlogPage />;
  if (pathname === PATH_AI_WORKSHOP) return <AiWorkshopPage />;
  return <NotFoundPage />;
}

function BudgetToolRoutePage() {
  return (
    <div className="budget-route-shell">
      <Suspense fallback={<section className="panel"><p><IconBot /> {TEXT_BUDGET_LOADING}</p></section>}>
        <BudgetToolPageLazy />
      </Suspense>
    </div>
  );
}

function HomePage({ motd, homeContentOverride }) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const homeRes = getDailyHomeContent(dateKey);
  const fallbackHomeContent = homeRes.err
    ? {
      heroTitle: "Systems thinker. Builder. Pragmatist.",
      heroBody: "I frame problems as interacting subsystems and push toward buildable outcomes with clear tradeoffs.",
      heroCaption: "Tokyo, after-hours systems thinking.",
      todayLens: "Today's lens: clear interfaces and practical delivery.",
      metrics: ["Cross-Domain Architecture", "HPC & AI Tooling", "Hardware/Software Integration", "High-Signal Execution"],
      operatingHeading: "Operating Principles",
      operatingItems: [
        { key: "Design-to-Build", val: "Pushing concepts into manufacturable, serviceable artifacts." },
        { key: "Tradeoff-Driven", val: "Balancing performance with real constraints." },
        { key: "Constraint-First", val: "Selecting architecture from hard requirements first." },
        { key: "Team Signal", val: "Keeping decisions explicit and actionable." }
      ],
      beyondHeading: "Engineering & Exploration",
      beyondItems: [
        { key: "Maker Systems", val: "Hardware and software systems built with real constraints." },
        { key: "Compute + AI", val: "Practical runtime and model deployment tradeoffs." },
        { key: "Operations Mindset", val: "Instrumentation, reliability, and maintainability first." },
        { key: "Life Outside Work", val: "Travel, sport, and structured self-optimization." }
      ],
      youtubeLead: "Current build notes and execution walkthroughs."
    }
    : homeRes.value;
  const homeContent = homeContentOverride && typeof homeContentOverride === "object" ? homeContentOverride : fallbackHomeContent;

  return (
    <>
      <section className="panel hero hero-intro">
        <div className="hero-intro-grid">
          <div className="hero-copy">
            <p className="eyebrow">SENIOR SOFTWARE ENGINEER</p>
            <h2>{homeContent.heroTitle}</h2>
            <p>{homeContent.heroBody}</p>
            <p className="home-day-lens">{homeContent.todayLens}</p>
            <div className="hero-mini-metrics">
              {homeContent.metrics.map((metric) => <span className="metric-pill" key={metric}>{metric}</span>)}
            </div>
          </div>
          <div className="hero-anchor-wrap">
            <picture>
              <source
                type="image/webp"
                srcSet={LINK_PROFILE_ANCHOR_IMAGE_WEBP}
                sizes="(max-width: 900px) 100vw, 520px"
              />
              <img
                className="home-anchor-image"
                src={LINK_PROFILE_ANCHOR_IMAGE}
                srcSet={`${LINK_PROFILE_ANCHOR_IMAGE} 720w, ${LINK_PROFILE_ANCHOR_IMAGE_FULL} 876w`}
                sizes="(max-width: 900px) 100vw, 520px"
                alt={ALT_PROFILE_ANCHOR_IMAGE}
                width="576"
                height="768"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
            <p className="hero-caption">{homeContent.heroCaption}</p>
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
          <h3>{homeContent.operatingHeading}</h3>
          <div className="kv-grid">
            {homeContent.operatingItems.map((item) => (
              <div key={item.key}>
                <p className="key">{item.key}</p>
                <p className="val">{item.val}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">BEYOND THE CODE</p>
          <h3>{homeContent.beyondHeading}</h3>
          <div className="kv-grid">
            {homeContent.beyondItems.map((item) => (
              <div key={item.key}>
                <p className="key">{item.key}</p>
                <p className="val">{item.val}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">YOUTUBE</p>
          <h3>Latest Video</h3>
          <p>{homeContent.youtubeLead}</p>
          <div className="video-wrap">
            <LiteYouTubeEmbed videoUrl={LINK_YOUTUBE_VIDEO} title="Earl Cameron YouTube video" />
          </div>
          <p>
            <a href={LINK_YOUTUBE_VIDEO} target="_blank" rel="noreferrer noopener"><IconYouTube /> Watch on YouTube</a>
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
            <a href={`mailto:${TEXT_EMAIL}`}><IconMail /> {TEXT_EMAIL}</a>
            <span className="dot-sep">•</span>
            <a href={LINK_LINKEDIN} target="_blank" rel="noreferrer noopener"><IconLinkedIn /> LinkedIn</a>
            <span className="dot-sep">•</span>
            <a href={LINK_GITHUB} target="_blank" rel="noreferrer noopener"><IconGitHub /> GitHub</a>
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
          <a className="cta-link" href="/resume/EarlCameron.pdf" onClick={onResumeDownload}><IconDownload /> Download Full Resume (PDF)</a>
        </div>
      </section>

      <div className="resume-grid">
        <section className="resume-block skills-block">
          <h3>Core Skills</h3>
          <div className="chip-row">
            <span className="chip chip-label">Languages</span><span className="chip">JavaScript / ES6+</span><span className="chip">Go</span><span className="chip">Python</span><span className="chip">C (Systems)</span><span className="chip">SQL</span>
            <span className="chip chip-label">Web / APIs</span><span className="chip">React</span><span className="chip">Angular</span><span className="chip">Vite</span><span className="chip">Node.js</span><span className="chip">HONO.js</span><span className="chip">HTMX</span><span className="chip">REST APIs</span>
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
              <li>Engineered an award-winning AI chatbot prototype that reduced support case resolution time by 30%, recognized through internal innovation awards.</li>
              <li>Spearheaded critical war-room response for infrastructure and product-impacting incidents, reducing mean time to resolution (MTTR) by 25%.</li>
              <li>Developed internal dashboards using HONO.js JSX, HTMX, and MSSQL to streamline development and infrastructure Jira case tracking, improving team efficiency by 40%.</li>
              <li>Mentored 5+ interns and conducted training sessions for support teams on engineering workflows, simplifying complex technical concepts for non-specialist audiences.</li>
            </ul>
          </article>

          <article className="xp-item">
            <div className="xp-head">
              <p className="xp-role">Instructor/TA - 4Geeks Academy</p>
              <p className="xp-time">Jan 2020 - Aug 2021</p>
            </div>
            <ul className="list">
              <li>Instructed and guided 50+ students through full-stack web development foundations and project delivery, achieving a 90% graduation rate.</li>
              <li>Delivered structured training on practical engineering best practices, translating complex programming paradigms into accessible lessons.</li>
              <li>Evaluated student projects and provided actionable code reviews to improve code quality and architecture understanding.</li>
              <li>Collaborated with lead instructors to refine curriculum materials based on student feedback and industry trends.</li>
            </ul>
          </article>

          <article className="xp-item">
            <div className="xp-head">
              <p className="xp-role">HTML/CSS and JavaScript Tutor - HeyTutor.com</p>
              <p className="xp-time">180+ Hours Tutored</p>
            </div>
            <ul className="list">
              <li>Maintained a perfect 5.0 rating across student evaluations by providing personalized, outcome-focused instruction to 12 students.</li>
              <li>Designed custom lesson plans to address individual learning gaps, resulting in a 100% pass rate for students' target exams or projects.</li>
            </ul>
          </article>
        </section>

        <section className="resume-block resume-projects-block">
          <h3>Notable Projects</h3>
          <ul className="list">
            <li><a href="https://github.com/monstercameron/GoWebComponents" target="_blank" rel="noreferrer noopener">GoWebComponents</a>: Architected a Go-powered component architecture focused on reusable frontend primitives, utilizing TEMPL for type-safe HTML rendering.</li>
            <li><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener">LatentSpaceBrowser</a>: Developed an interactive AI exploration experience built around latent-space navigation using SOTA AI/ML models.</li>
            <li><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener">Zerver</a>: Engineered a C-based server project emphasizing low-level performance and runtime fundamentals.</li>
            <li><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener" title="Repo: Budgetting_tool_vibecoded">Budgeting Tool</a>: Implemented a finance tracking app for expenses, debt, and goal progress workflows.</li>
            <li><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener">Pi Camera GUI</a>: Built a Python + Pygame interface for Raspberry Pi HQ camera controls and capture workflows.</li>
          </ul>
        </section>

        <section className="resume-block resume-interests-block">
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
            <h3><a href="https://github.com/monstercameron/Zerver" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> Zerver</a></h3>
            <span className="chip chip-zero">Zig</span>
          </div>
          <p><strong>The Build:</strong> A backend framework built around pure-step request pipelines, explicit side effects, and built-in tracing.</p>
          <p><strong>The Why:</strong> I wanted to make API behavior observable by default, so bottlenecks and failures are easier to diagnose and fix in production without relying on heavy external APM tools.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/SchemaFlow" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> SchemaFlow</a></h3>
            <span className="chip chip-zero">Go</span>
          </div>
          <p><strong>The Build:</strong> A library for type-safe LLM extraction and structured output validation.</p>
          <p><strong>The Why:</strong> Parsing JSON from LLMs is notoriously fragile. I built this to replace runtime guessing with compile-time safety, making LLM pipelines actually production-friendly.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/pi-camera-gui" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> Pi Camera Rig</a></h3>
            <span className="chip chip-zero">Python / Hardware</span>
          </div>
          <p><strong>The Build:</strong> A Pygame-based GUI that turns a bare Raspberry Pi HQ camera setup into a menu-driven, standalone camera experience.</p>
          <p><strong>The Why:</strong> Command-line camera control isn't practical in the field. I needed a reliable interface with deep settings, metadata support, and a desktop mock mode for rapid iteration.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/LatentSpaceBrowser" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> Latent Space Browser</a></h3>
            <span className="chip chip-zero">React / LLMs</span>
          </div>
          <p><strong>The Build:</strong> A generative encyclopedia UI where every linked term recursively generates new, context-aware AI content.</p>
          <p><strong>The Why:</strong> Exploring a new interaction model for LLMs that moves beyond the standard chat interface, focusing on low-latency exploration and transparent token/cost metrics.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/GoScript" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> GoScript</a></h3>
            <span className="chip chip-zero">Go / WebAssembly</span>
          </div>
          <p><strong>The Build:</strong> A browser-based Go environment running the real Go compiler entirely client-side via WebAssembly.</p>
          <p><strong>The Why:</strong> To make Go runnable in documentation, tutorials, and playgrounds instantly, without requiring users to install a local toolchain or rely on a backend execution server.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/MetaHumanServer" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> MetaHuman Server</a></h3>
            <span className="chip chip-zero">Python / Audio</span>
          </div>
          <p><strong>The Build:</strong> A voice-interactive chatbot server that combines NLP and real-time audio processing pipelines.</p>
          <p><strong>The Why:</strong> Text chat is slow. I wanted to build a more human-like, low-latency voice interaction layer that could be integrated into games or online services.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/mdchem" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> MDChem Backend</a></h3>
            <span className="chip chip-zero">Node.js / REST</span>
          </div>
          <p><strong>The Build:</strong> Backend services for an educational chemistry game, handling data capture, reporting workflows, and educator access.</p>
          <p><strong>The Why:</strong> Gameplay is only half the product. I built the infrastructure to store telemetry, generate useful trends, and manage controlled access for teachers.</p>
        </article>

        <article className="card">
          <div className="project-card-head">
            <h3><a href="https://github.com/monstercameron/Budgetting_tool_vibecoded" target="_blank" rel="noreferrer noopener" className="project-link"><IconGitHub /> Personal Finance Dashboard</a></h3>
            <span className="chip chip-zero">React / Vite</span>
          </div>
          <p><strong>The Build:</strong> A fast, client-side budgeting app for tracking income, expenses, debt, and goal progress.</p>
          <p><strong>The Why:</strong> Off-the-shelf tools were too slow or lacked specific workflows. I built this to centralize my personal finance tracking with instant feedback and high-visibility metrics.</p>
        </article>
      </div>
    </section>
  );
}

function SlackAnimePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [dailyQuestion, setDailyQuestion] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(Boolean(getBlogAdminToken().value));
  const [status, setStatus] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);
  const feedUrlsRes = getSlackAnimeFeedUrls();
  const feedUrls = feedUrlsRes.err
    ? { tracked: "/api/slackanime/feed/tracked.xml", questions: "/api/slackanime/feed/questions.xml" }
    : feedUrlsRes.value;

  const loadTracked = async () => {
    const trackedRes = await listTrackedSlackAnime();
    if (trackedRes.err) {
      setStatus({ text: trackedRes.err.message, error: true });
      setIsAdmin(false);
      return;
    }
    setIsAdmin(true);
    setTracked(trackedRes.value || []);
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadTracked();
    const loadQuestion = async () => {
      const questionRes = await fetchSlackAnimeQuestionOfDay();
      if (questionRes.err || !questionRes.value || !questionRes.value.question) {
        return;
      }
      setDailyQuestion(questionRes.value.question);
    };
    loadQuestion();
  }, [isAdmin]);

  const connect = async () => {
    const loginRes = await loginBlogAdmin(password);
    if (loginRes.err) {
      setStatus({ text: loginRes.err.message, error: true });
      return;
    }
    setPassword("");
    setStatus({ text: "Airing Radar session connected.", error: false });
    setIsAdmin(true);
  };

  const disconnect = async () => {
    const logoutRes = await logoutBlogAdmin();
    if (logoutRes.err) {
      setStatus({ text: logoutRes.err.message, error: true });
      return;
    }
    setIsAdmin(false);
    setResults([]);
    setTracked([]);
    setDailyQuestion("");
    setStatus({ text: "Airing Radar session disconnected.", error: false });
  };

  const onSearch = async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      setStatus({ text: "Connect first using the admin password.", error: true });
      return;
    }
    const q = String(query || "").trim();
    if (!q) {
      setResults([]);
      return;
    }
    setBusy(true);
    const searchRes = await searchSlackAnime(q);
    setBusy(false);
    if (searchRes.err) {
      setStatus({ text: searchRes.err.message, error: true });
      return;
    }
    setStatus({ text: "", error: false });
    setResults(searchRes.value || []);
  };

  const onTrack = async (anime) => {
    const saveRes = await trackSlackAnime(anime);
    if (saveRes.err) {
      setStatus({ text: saveRes.err.message, error: true });
      return;
    }
    setStatus({ text: `Tracking ${anime.title}`, error: false });
    await loadTracked();
  };

  const onUntrack = async (anime) => {
    const removeRes = await untrackSlackAnime(anime.anilistId);
    if (removeRes.err) {
      setStatus({ text: removeRes.err.message, error: true });
      return;
    }
    setStatus({ text: `Removed ${anime.title}`, error: false });
    await loadTracked();
  };

  return (
    <section className="panel slackanime-shell">
      {isAdmin ? (
        <div className="slackanime-top-actions">
          <button className="cta-link cta-button cta-danger slackanime-btn" type="button" onClick={() => { void disconnect(); }}><IconLogOut /> Disconnect</button>
        </div>
      ) : null}
      <p className="eyebrow">AIRING RADAR</p>
      <h2>Anime Release Radar</h2>
      <p className="projects-intro slackanime-intro">
        Monitor tracked shows, scan AniList quickly, and maintain a local release radar with SQLite plus RSS feeds for updates and prompts.
      </p>

      {!isAdmin ? (
        <section className="slackanime-auth-card">
          <div className="slackanime-auth-head">
            <h3 className="slackanime-auth-title">Radar Admin Access</h3>
            <p className="slackanime-auth-subtitle">Admin session required to manage tracked shows.</p>
          </div>
          <div className="slackanime-auth-form">
            <label>
              Admin Password
              <input className="slackanime-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter admin password" />
            </label>
            <div className="slackanime-auth-actions">
              <button className="cta-link cta-button slackanime-btn" type="button" onClick={() => { void connect(); }}><IconLogIn /> Connect</button>
            </div>
            <p className="slackanime-auth-state">Auth: Disconnected</p>
          </div>
        </section>
      ) : null}

      {dailyQuestion ? (
        <p className="slackanime-daily">
          <strong>Daily Anime Prompt:</strong> {dailyQuestion}
        </p>
      ) : null}

      <div className="slackanime-rss-row">
        <a className="cta-link" href={feedUrls.tracked} target="_blank" rel="noreferrer noopener"><IconRSS /> Release Feed RSS</a>
        <a className="cta-link" href={feedUrls.questions} target="_blank" rel="noreferrer noopener"><IconRSS /> Prompt Feed RSS</a>
      </div>

      <form className="slackanime-search-form" onSubmit={onSearch}>
        <input
          className="slackanime-input"
          type="search"
          placeholder="Search anime..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="cta-link cta-button slackanime-btn" type="submit"><IconSearch /> {busy ? "Searching..." : "Search"}</button>
      </form>

      {status.text ? <p className={status.error ? "slackanime-error" : "slackanime-success"}>{status.text}</p> : null}

      <h3 className="slackanime-section-title">Tracked Shows</h3>
      <div className="slackanime-grid">
        {tracked.length < 1 ? <p className="slackanime-empty">No tracked shows yet.</p> : null}
        {tracked.map((anime) => (
          <article className="slackanime-card" key={`tracked-${anime.anilistId}`}>
            <div className="slackanime-card-head">
              <h3>{anime.siteUrl ? <a href={anime.siteUrl} target="_blank" rel="noreferrer noopener">{anime.title}</a> : anime.title}</h3>
              <span className="chip slackanime-chip">{anime.status || "UNKNOWN"}</span>
            </div>
            <p className="slackanime-card-meta">{anime.format || "ANIME"}{anime.seasonYear ? ` � ${anime.seasonYear}` : ""}{anime.episodes ? ` � ${anime.episodes} eps` : ""}</p>
            <div className="slackanime-card-actions">
              <button className="cta-link cta-button cta-danger slackanime-btn" type="button" onClick={() => { void onUntrack(anime); }}><IconTrash /> Remove</button>
            </div>
          </article>
        ))}
      </div>

      <h3 className="slackanime-section-title">AniList Search Results</h3>
      <div className="slackanime-grid">
        {results.length < 1 ? <p className="slackanime-empty">Search AniList to load results.</p> : null}
        {results.map((anime) => (
          <article className="slackanime-card" key={`result-${anime.anilistId}`}>
            <div className="slackanime-card-head">
              <h3>{anime.siteUrl ? <a href={anime.siteUrl} target="_blank" rel="noreferrer noopener">{anime.title}</a> : anime.title}</h3>
              <span className="chip slackanime-chip">{anime.status || "UNKNOWN"}</span>
            </div>
            <p className="slackanime-card-meta">{anime.format || "ANIME"}{anime.seasonYear ? ` � ${anime.seasonYear}` : ""}{anime.episodes ? ` � ${anime.episodes} eps` : ""}</p>
            <div className="slackanime-card-actions">
              <button className="cta-link cta-button slackanime-btn" type="button" onClick={() => { void onTrack(anime); }}><IconPlus /> Add to Radar</button>
            </div>
          </article>
        ))}
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
      <h2><IconBot /> 404 - Page Not Found</h2>
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
          <a className="tab-btn" href={API_BLOG_RSS_FEED_PATH} target="_blank" rel="noreferrer noopener"><IconRSS /> Blog RSS</a>
          <button className={`tab-btn ${view === "list" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG)}><IconBlog /> Public Logs</button>
          {!isAdmin ? <button className={`tab-btn ${view === "login" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}><IconSettings /> Authenticate</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "dashboard" ? "is-active" : ""}`} type="button" onClick={() => goTo(PATH_BLOG_DASHBOARD)}><IconSettings /> Dashboard</button> : null}
          {isAdmin ? <button className={`tab-btn ${view === "editor" ? "is-active" : ""}`} type="button" onClick={() => { setPreviousView(view); goTo("/blog/0/new"); }}><IconPlus /> New Entry</button> : null}
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
        <button className="cta-link cta-button" type="button" onClick={(event) => goToAnimated(PATH_BLOG, event)}><IconArrowLeft /> Back to System Logs</button>
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
          {detailNav.prevId ? <a className="cta-link" href={`/blog/${detailNav.prevId}`} onClick={(event) => goToAnimated(`/blog/${detailNav.prevId}`, event)}><IconArrowLeft /> Previous Log</a> : <span />}
          {detailNav.nextId ? <a className="cta-link" href={`/blog/${detailNav.nextId}`} onClick={(event) => goToAnimated(`/blog/${detailNav.nextId}`, event)}>Next Log <IconArrowRight /></a> : <span />}
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
            <span className="dash-stat-icon"><IconTerminal /></span>
          </div>
          <h3 className="dash-stat-value">{dashboard.total}</h3>
        </article>
        <article className="dash-card">
          <div className="dash-stat-head">
            <p className="dash-stat-label">Published</p>
            <span className="dash-stat-icon dash-stat-icon-accent"><IconEye /></span>
          </div>
          <h3 className="dash-stat-value">{dashboard.published}</h3>
        </article>
        <article className="dash-card">
          <div className="dash-stat-head">
            <p className="dash-stat-label">Drafts</p>
            <span className="dash-stat-icon"><IconEyeOff /></span>
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
                  <a className="cta-link" href={`/blog/${row.id}/edit`} onClick={(event) => onNavigate(`/blog/${row.id}/edit`, event)}><IconEdit /> Edit</a>
                  <button className="cta-link cta-button" type="button" onClick={() => onTogglePublish(row)}>{row.published ? <><IconEyeOff /> Unpublish</> : <><IconEye /> Publish</>}</button>
                  <button className="cta-link cta-button cta-danger" type="button" onClick={(event) => onDelete(row.id, event)}><IconTrash /> Delete</button>
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
              <a className="cta-link" href={`/blog/${row.id}/edit`} onClick={(event) => onNavigate(`/blog/${row.id}/edit`, event)}><IconEdit /> Edit</a>
              <button className="cta-link cta-button cta-danger" type="button" onClick={(event) => onDelete(row.id, event)}><IconTrash /> Delete</button>
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
          <button className="cta-link cta-button" type="button" onClick={() => goBack(previousView === "dashboard" ? PATH_BLOG_DASHBOARD : PATH_BLOG)}><IconArrowLeft /> Back to Console</button>
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
            <button className="cta-link cta-button" type="button" onClick={createCategory}><IconPlus /> Add</button>
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
      <button className="tab-btn pagination-btn" type="button" onClick={props.onPrevious} disabled={props.page <= 1}><IconArrowLeft /> Previous</button>
      <span className="pagination-meta">Page {props.page} of {props.totalPages}</span>
      <button className="tab-btn pagination-btn" type="button" onClick={props.onNext} disabled={props.page >= props.totalPages}>Next <IconArrowRight /></button>
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
function buildYouTubeThumbUrl(id) {
  return `${LINK_YOUTUBE_THUMB_PREFIX}${encodeURIComponent(id)}/hqdefault.jpg`;
}

/**
 * @param {string} id
 * @returns {string}
 */
function buildYouTubeEmbedUrl(id) {
  return `${LINK_YOUTUBE_EMBED_NOCOOKIE_PREFIX}${encodeURIComponent(id)}`;
}

/**
 * @param {{ videoUrl: string, title: string }} props
 * @returns {JSX.Element}
 */
function LiteYouTubeEmbed(props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoId = parseYouTubeVideoId(props.videoUrl);
  const embedUrl = videoId ? `${LINK_YOUTUBE_EMBED_NOCOOKIE_PREFIX}${encodeURIComponent(videoId)}` : LINK_YOUTUBE_EMBED;
  const thumbUrl = videoId ? buildYouTubeThumbUrl(videoId) : "";

  if (isLoaded) {
    return (
      <iframe
        className="video-frame"
        src={embedUrl}
        title={props.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="video-lite-shell"
      onClick={() => setIsLoaded(true)}
      aria-label={TEXT_VIDEO_LITE_TITLE}
    >
      {thumbUrl ? (
        <img
          className="video-lite-thumb"
          src={thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width="480"
          height="360"
        />
      ) : null}
      <span className="video-lite-overlay">
        <span className="video-lite-play" aria-hidden="true">▶</span>
        <span className="video-lite-label">{TEXT_VIDEO_LITE_CTA}</span>
      </span>
    </button>
  );
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
            return <img key={`img-${partIndex}`} src={imageMatch[1]} className="rich-image" style={{ width: `${Math.max(10, Math.min(100, widthPct))}%` }} alt="System Log Artifact" loading="lazy" decoding="async" />;
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
  const [hlApi, setHlApi] = useState(null);
  const normalizedCode = String(props.code || "").replace(/\r\n/g, "\n");
  const lines = normalizedCode.split("\n");
  const lang = hlApi && props.language && hlApi.getLanguage(props.language) ? props.language : "";

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [api, err] = await loadHighlightRuntime();
      if (!active || err || !api) {
        return;
      }
      setHlApi(api);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

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
        {!hlApi ? <div className="code-loading">{TEXT_CODE_LOADING}</div> : null}
        {lines.map((line, index) => {
          const rawLine = line || " ";
          const highlighted = hlApi ? (lang ? hlApi.highlight(rawLine, { language: lang }).value : hlApi.highlightAuto(rawLine).value) : "";
          return (
            <div className="code-line" key={`line-${index}`}>
              <span className="line-no">{index + 1}</span>
              {hlApi ? <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} /> : <code>{rawLine}</code>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
