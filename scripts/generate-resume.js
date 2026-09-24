#!/usr/bin/env node

/**
 * Builds index.html from the two Markdown sources of truth:
 *   README.md        -> English
 *   README.pt-BR.md  -> Portuguese (Brazil)
 *
 * Design: quiet editorial typography, responsive project grid and a two-page
 * print composition. Both views share the same Markdown content.
 * Do not edit index.html directly.
 */

const fs = require("fs");
const path = require("path");
const { slugify, sectionize, parseIntro } = require("./lib/parse-resume");

const ROOT = path.resolve(__dirname, "..");
const outputPath = path.join(ROOT, "index.html");

const SITE = "https://cv.felipe.run";

// Plain-Markdown mirrors of the two sources, published at stable short URLs.
// GitHub Pages serves .md as `text/markdown; charset=utf-8`, which browsers
// show inline as source and which agents can read without stripping a 100KB
// page of inline CSS, both languages, and the embedded copy-to-clipboard blocks.
// (Pages is static: there is no Accept-header negotiation to hang this off.)
const MIRRORS = { en: "en.md", pt: "pt.md" };

const SOURCES = {
  en: path.join(ROOT, "README.md"),
  pt: path.join(ROOT, "README.pt-BR.md"),
};

// -- Language-independent configuration -------------------------------------

// -- Markdown helpers -------------------------------------------------------

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/(?<!["'=>])(https?:\/\/[^\s<]+)/g, (url) => {
    const clean = url.replace(/[.,;:!?]+$/, "");
    const suffix = url.slice(clean.length);
    return `<a href="${clean}">${clean}</a>${suffix}`;
  });
  return html;
}

function parseMarkdown(inputLines) {
  const html = [];
  let paragraph = [];
  let inList = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  };

  for (const line of inputLines) {
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      closeList();
      html.push(`<h3>${renderInline(line.slice(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith("#### ")) {
      flushParagraph();
      closeList();
      html.push(`<h4>${renderInline(line.slice(5).trim())}</h4>`);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(line.slice(2).trim())}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  closeList();
  return html.join("\n");
}

// Role of a section, keyed on EN and PT slugs so ordering stays flexible.
const ROLE_MAP = {
  profile: ["profile", "perfil"],
  case: ["featured-case-study", "estudo-de-caso-em-destaque"],
  side: [
    "domains", "dominios",
    "expertise", "especialidades",
    "education", "formacao",
    "certifications", "certificacoes",
    "languages", "idiomas",
  ],
};
const ROLE_LOOKUP = {};
for (const [role, slugs] of Object.entries(ROLE_MAP)) {
  for (const slug of slugs) ROLE_LOOKUP[slug] = role;
}
function roleOf(slug) {
  return ROLE_LOOKUP[slug] || "default";
}

// Sections kept in the copyable Markdown but not rendered on the page
// (e.g. LinkedIn-style hashtags that would clutter the designed layout).
const OMIT = new Set(["hashtags"]);

// Terminal-prompt favicon: a `>` chevron + underscore cursor.
const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0d0f12"/><path d="M9 11 L15 16 L9 21" fill="none" stroke="#6ea8fe" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21 H23" fill="none" stroke="#6ea8fe" stroke-width="2.4" stroke-linecap="round"/></svg>`
  );

function contactHtml(contactItems) {
  return contactItems
    .map((item) => {
      const [label, ...rest] = item.split(":");
      const value = rest.join(":").trim();
      let rendered;
      if (/^https?:\/\/\S+$/.test(value)) {
        const short = value.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
        rendered = `<a href="${value}">${escapeHtml(short)}</a>`;
      } else {
        rendered = label.trim() === "Email" ? `<a href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>` : renderInline(value);
      }
      return `<div class="contact-row"><span class="contact-k">${escapeHtml(label.trim())}</span><span class="contact-v">${rendered}</span></div>`;
    })
    .join("\n");
}

function renderMainSection(section, lang, extras = "") {
  const slug = slugify(section.title);
  const id = `${lang}-${slug}`;
  const isExperience = ["experience", "experiencia"].includes(slug);
  const isProjects = ["selected-open-source", "open-source-em-destaque"].includes(slug);
  const head = `<h2 class="sec-h" id="${id}">${escapeHtml(section.title)}</h2>`;
  let body = parseMarkdown(section.content);
  if (isExperience) {
    body = body.replace(/<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>([\s\S]*?)(?=<h3>|$)/g,
      (_, role, meta, details) => {
        const fields = meta.split(" - ");
        const dates = fields.pop();
        const company = fields.shift();
        return `<article class="job"><div class="job-date">${dates}</div><div class="job-body"><h3>${role}</h3><p class="company">${company}</p><div class="job-description">${details}</div></div></article>`;
      });
    return `<section class="sec sec-exp" aria-labelledby="${id}"><div class="continuation"><span>Felipe R. Broering</span><span>cv.felipe.run</span></div>${head}<div class="career">${body}</div>${extras}<div class="page-end"><span>Felipe R. Broering · hi@felipe.run</span><span>02 / 02</span></div></section>`;
  }
  if (isProjects) {
    let other = "";
    body = body.replace(/<p>(?:Other projects:|Outros projetos:)[\s\S]*?<\/p>/, match => { other = match; return ""; });
    body = body.replace(/<h3>(.*?) · (.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
      (_, name, subtitle, details) => `<article class="project"><h3>${name}</h3><p class="project-subtitle">${subtitle}</p><div class="prose">${details.replace(/<p><strong>(.*?)<\/strong> · ([\s\S]*?)<\/p>/g, '<p class="project-meta"><strong>$1</strong><span class="project-links">$2</span></p>')}</div></article>`);
    return `<section class="sec sec-projects" aria-labelledby="${id}">${head}<div class="projects">${body}</div><div class="other-projects">${other}</div></section>`;
  }
  return `<section class="sec sec-profile" aria-labelledby="${id}">${head}<div class="lede">${body}</div></section>`;
}

function renderSideSection(section, lang) {
  const slug = slugify(section.title);
  const id = `${lang}-${slug}`;
  const isTags = slug === "expertise" || slug === "especialidades";
  const body = isTags ? renderTagCloud(section.content) : parseMarkdown(section.content);
  return `<section class="side side-${slug}" aria-labelledby="${id}">
    <h3 class="side-h" id="${id}">${escapeHtml(section.title)}</h3>
    <div class="prose">${body}</div>
  </section>`;
}

function renderTagCloud(contentLines) {
  const text = contentLines.filter((l) => l.trim()).join(" ").trim();
  const tags = text.split(",").map((t) => t.trim()).filter(Boolean);
  return `<ul class="tags">${tags.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
}

function renderHeroCopy(lang, subtitle, location) {
  return `<div class="hero-copy"><p class="eyebrow">${escapeHtml(subtitle)}</p><h1>Felipe R. Broering</h1><p class="loc">${escapeHtml(location)}</p></div>`;
}

function renderContact(lang, contact) {
  return `<address class="contact">${contactHtml(contact)}</address>`;
}

function langBlock(lang, inner) {
  return `<div class="lang ${lang}" data-lang-block="${lang}">${inner}</div>`;
}

// -- Assemble ---------------------------------------------------------------

const parsed = {};
const markdownRaw = {};
for (const lang of ["en", "pt"]) {
  markdownRaw[lang] = fs.readFileSync(SOURCES[lang], "utf8").trimEnd();
  const { title, introLines, sections } = sectionize(markdownRaw[lang]);
  const intro = parseIntro(introLines);
  parsed[lang] = { title, intro, sections };
}

const title = parsed.en.title;

function buildHeroCopyBlocks() {
  return ["en", "pt"]
    .map((lang) => langBlock(lang, renderHeroCopy(lang, parsed[lang].intro.subtitle, parsed[lang].intro.location)))
    .join("\n");
}

function buildContactBlocks() {
  return ["en", "pt"]
    .map((lang) => langBlock(lang, renderContact(lang, parsed[lang].intro.contact)))
    .join("\n");
}

function buildBodyBlocks() {
  return ["en", "pt"].map(lang => {
    const visible = parsed[lang].sections.filter(s => !OMIT.has(slugify(s.title)));
    const career = visible.filter(s => ["experience", "experiencia"].includes(slugify(s.title)));
    const side = visible.filter(s => roleOf(slugify(s.title)) === "side");
    const overview = visible.filter(s => !career.includes(s) && !side.includes(s));
    return langBlock(lang, `<div class="overview">${overview.map(s => renderMainSection(s, lang)).join("\n")}<div class="page-end"><span>cv.felipe.run · ${lang === "pt" ? "Perfil e projetos" : "Profile & projects"}</span><span>01 / 02</span></div></div>${career.map(s => renderMainSection(s, lang, `<aside class="credentials">${side.map(item => renderSideSection(item, lang)).join("\n")}</aside>`)).join("\n")}`);
  }).join("\n");
}

const jsonLd = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: title,
    url: "https://cv.felipe.run",
    sameAs: ["https://www.linkedin.com/in/felipebroering/", "https://github.com/feliperun"],
    jobTitle: "Senior Product Engineer",
    worksFor: { "@type": "Organization", name: "Micromed" },
    address: { "@type": "PostalAddress", addressRegion: "Santa Catarina", addressCountry: "Brazil" },
  },
  null,
  2
);

const css = `
:root {
  color-scheme: light;
  --bg: #f5f5f2; --paper: #fff; --ink: #222b33; --muted: #59636b;
  --line: #dde2e3; --accent: #315d72; --soft: #eaf0f2;
  --sans: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
html[data-theme="dark"] {
  color-scheme: dark;
  --bg: #171c20; --paper: #1e252a; --ink: #e8edf0; --muted: #acb8c0;
  --line: #3b464e; --accent: #a3c5d5; --soft: #2c3942;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.65 var(--sans); -webkit-font-smoothing: antialiased; }
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; }
a:hover { text-decoration: none; }
button, summary { -webkit-tap-highlight-color: transparent; }
a:focus-visible, button:focus-visible, summary:focus-visible, pre:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.lang { display: none; }
html[data-lang="en"] .lang.en, html[data-lang="pt"] .lang.pt { display: contents; }
.toolbar { display: flex; align-items: center; gap: 10px; max-width: 1040px; margin: auto; padding: 18px 28px; }
.device { color: var(--muted); font-size: 14px; letter-spacing: .02em; white-space: nowrap; }
.device b { color: var(--ink); font-weight: 600; }
.spacer { flex: 1; }
.seg { display: flex; gap: 2px; }
button, summary { font: 500 13px/1 var(--sans); color: var(--ink); cursor: pointer; }
.seg button, .tbtn, .tools summary { border: 0; background: transparent; min-height: 40px; padding: 10px 12px; border-radius: 6px; }
.seg button[aria-pressed="true"], .tbtn:hover, .tools summary:hover { background: var(--soft); color: var(--accent); }
.tbtn.primary { background: var(--accent); color: var(--paper); padding-inline: 16px; }
.tbtn.icon { font-size: 20px; width: 40px; padding: 0; }
.tools { position: relative; }
.tools summary { list-style: none; display: grid; place-items: center; font-size: 20px; width: 40px; }
.tools summary::-webkit-details-marker { display: none; }
.tools-menu { position: absolute; right: 0; top: 46px; z-index: 10; display: grid; min-width: 180px; padding: 8px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px #00000012; }
.tools-menu button { text-align: left; }
.copy-status { font-size: 13px; color: var(--accent); padding-inline: 12px; }
.copy-status:empty { display: none; }
.resume, .raw-wrap { width: min(984px, calc(100% - 48px)); margin: 12px auto 48px; background: var(--paper); border: 1px solid var(--line); border-radius: 4px; }
.resume { padding: 48px 56px 24px; }
header { display: grid; grid-template-columns: minmax(0,1fr) 88px; gap: 16px 28px; padding-bottom: 28px; border-bottom: 1px solid var(--line); }
h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(34px, 4.5vw, 49px); line-height: 1.12; letter-spacing: -.035em; margin: 8px 0 12px; }
.eyebrow { color: var(--accent); margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .075em; text-transform: uppercase; }
.loc { margin: 0; color: var(--muted); font-size: 14px; }
.portrait { width: 88px; height: 100px; object-fit: cover; border-radius: 6px; filter: grayscale(1); }
.contact-area { grid-column: 1 / -1; }
.contact { display: flex; flex-wrap: wrap; gap: 6px 22px; font-size: 13px; font-style: normal; }
.contact-k { display: none; }
.contact a { color: var(--muted); text-decoration: none; }
.contact a:hover { color: var(--accent); text-decoration: underline; }
main { padding-top: 28px; }
.sec-h, .side-h { font: 600 11px/1.4 var(--sans); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin: 0 0 16px; }
.sec { margin: 0; }
.sec + .sec { margin-top: 32px; }
p { margin: 0; }
p + p { margin-top: 10px; }
.lede { max-width: 77ch; }
.lede p + p { color: var(--muted); }
.projects { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 26px 36px; }
.project { border-top: 1px solid var(--line); padding-top: 16px; }
h3 { font-size: 18px; line-height: 1.3; margin: 0; font-weight: 600; letter-spacing: -.015em; }
.project-subtitle { font-size: 14px; line-height: 1.4; font-weight: 500; color: var(--accent); margin: 4px 0 12px; }
.project .prose { font-size: 15px; line-height: 1.65; color: var(--muted); }
.project-meta { font-size: 12px; line-height: 1.65; }
.project-meta strong { font-weight: 500; color: var(--ink); }
.project-links { display: block; }
.other-projects { font-size: 13px; color: var(--muted); margin-top: 22px; }
.credentials { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 36px; margin-top: 28px; padding: 22px 0; border-top: 1px solid var(--line); }
.side-expertise, .side-especialidades { grid-column: 1 / -1; }
.side-h { margin-bottom: 8px; font-size: 10px; }
.side .prose { font-size: 13px; color: var(--muted); line-height: 1.6; }
.tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 4px 0; }
.tags li { display: inline; }
.tags li:not(:last-child)::after { content: " / "; white-space: pre; color: var(--line); margin-inline: 6px; }
.sec-exp { margin-top: 22px; padding-top: 28px; border-top: 1px solid var(--line); }
.career { display: grid; gap: 22px; }
.job { display: grid; grid-template-columns: 148px minmax(0,1fr); gap: 24px; }
.job-date { color: var(--muted); font-size: 12px; padding-top: 3px; }
.job h3 { font-size: 17px; }
.company { color: var(--accent); font-size: 13px; margin-top: 3px; font-weight: 500; }
.job-description { color: var(--muted); font-size: 14px; line-height: 1.65; margin-top: 7px; }
ul { padding-left: 17px; margin: 0; }
li + li { margin-top: 5px; }
li::marker { color: var(--accent); }
.foot { border-top: 1px solid var(--line); margin-top: 32px; padding-top: 16px; display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 12px; }
.foot a { color: inherit; }
.page-end, .continuation { display: none; }
.raw-wrap { display: none; }
html[data-view="raw"] .raw-wrap { display: block; }
html[data-view="raw"] .resume { display: none; }
.raw-head { border-bottom: 1px solid var(--line); padding: 16px 24px; font-size: 13px; color: var(--muted); }
.raw-md { margin: 0; padding: 24px; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.7 ui-monospace, monospace; }
.view-off { display: none; }
html[data-view="raw"] .view-on { display: none; }
html[data-view="raw"] .view-off { display: inline; }
@media screen and (max-width: 740px) {
  .resume { padding: 32px; }
  .projects { gap: 24px; }
  .job { grid-template-columns: 120px minmax(0,1fr); gap: 18px; }
  .toolbar { padding: 12px 24px; gap: 4px; }
}
@media screen and (max-width: 560px) {
  body { background: var(--paper); }
  .toolbar { padding: 10px 16px; border-bottom: 1px solid var(--line); gap: 2px; }
  .device span { display: none; }
  .seg button { padding-inline: 10px; min-height: 44px; }
  .tbtn, .tools summary { min-height: 44px; }
  .resume, .raw-wrap { width: 100%; border: 0; margin: 0; }
  .resume { padding: 28px 20px; }
  header { grid-template-columns: minmax(0,1fr) 58px; gap: 14px; padding-bottom: 24px; }
  .portrait { width: 58px; height: 70px; }
  h1 { font-size: 34px; max-width: 10ch; }
  .eyebrow { font-size: 10px; letter-spacing: .05em; }
  .loc { font-size: 12px; }
  .contact { display: grid; gap: 5px; font-size: 13px; }
  main { padding-top: 24px; }
  .projects, .credentials { grid-template-columns: 1fr; }
  .project .prose, .lede { font-size: 15px; }
  .sec + .sec { margin-top: 28px; }
  .credentials { gap: 18px; }
  .job { grid-template-columns: 1fr; gap: 5px; }
  .job-date { font-size: 11px; }
  .career { gap: 24px; }
  .foot { flex-wrap: wrap; }
}
/* Keep the safe area inside the document. Chrome's "Margins: None"
   overrides @page margins; element padding survives that print setting. */
@page { size: A4; margin: 0; }
@media print {
  :root, html[data-theme="dark"] { color-scheme: light; --paper: #fff; --ink: #222b33; --muted: #505b63; --line: #cdd6da; --accent: #315d72; }
  body { background: #fff; font: 10pt/1.4 Arial, Helvetica, sans-serif; }
  .toolbar, .foot, .portrait, .raw-wrap { display: none !important; }
  .resume, html[data-view="raw"] .resume { display: block; width: auto; margin: 0; padding: 0; border: 0; }
  header { position: relative; display: block; padding: 13mm 15mm 5mm; border: 0; }
  header::after { content: ""; position: absolute; left: 15mm; right: 15mm; bottom: 0; border-bottom: 1px solid var(--line); }
  .overview { padding: 0 15mm 13mm; }
  h1 { font-size: 31pt; margin: 2mm 0; }
  .eyebrow { font: 600 8pt/1.4 Arial, sans-serif; letter-spacing: .08em; }
  .loc { font-size: 8.5pt; }
  .contact { display: flex; gap: 5mm; font-size: 8pt; margin-top: 3mm; }
  main { padding-top: 5mm; }
  .sec-h { font: 600 8pt/1.4 Arial, sans-serif; letter-spacing: .13em; margin-bottom: 3mm; }
  .lede { max-width: none; }
  .lede p + p { margin-top: 2mm; }
  .sec + .sec { margin-top: 5mm; }
  .projects { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 5mm 8mm; }
  .project { padding-top: 3mm; break-inside: avoid; }
  .project h3 { font-size: 13pt; }
  .project-subtitle { font-size: 9pt; line-height: 1.35; margin: 1mm 0 2mm; min-height: 1.35em; }
  .project .prose { font-size: 9.5pt; line-height: 1.42; }
  .project-meta { font-size: 7.5pt; line-height: 1.4; margin-top: 2mm; }
  .project-meta strong { display: block; }
  .other-projects { font-size: 8pt; line-height: 1.4; margin-top: 4mm; }
  .credentials { grid-template-columns: 1fr 1fr; gap: 3mm 8mm; margin-top: 4mm; padding: 3mm 0 0; }
  .side { break-inside: avoid; }
  .side-h { font: 600 7.5pt/1.4 Arial, sans-serif; margin-bottom: 1mm; }
  .side .prose { font-size: 8pt; line-height: 1.4; }
  .tags { display: block; }
  .tags li:not(:last-child)::after { margin-inline: 2px; color: #75858d; }
  .page-end { display: flex; justify-content: space-between; color: var(--muted); font-size: 7pt; border-top: 1px solid var(--line); margin-top: 5mm; padding-top: 2mm; }
  .sec-exp { break-before: page; border: 0; margin: 0; padding: 13mm 15mm; }
  .continuation { display: flex; justify-content: space-between; font-size: 8pt; color: var(--muted); padding-bottom: 3mm; border-bottom: 1px solid var(--line); margin-bottom: 5mm; }
  .career { display: grid; gap: 2.3mm; }
  .job { grid-template-columns: 30mm minmax(0,1fr); gap: 5mm; break-inside: avoid; }
  .job-date { font-size: 7.5pt; padding-top: 1px; }
  .job h3 { display: inline; font-size: 10.5pt; }
  .company { display: inline; }
  .company::before { content: "/"; margin-inline: 1.2mm; color: var(--muted); }
  .company { font-size: 8.5pt; margin-top: .5mm; }
  .job-description { font-size: 9.5pt; line-height: 1.4; margin-top: 1.5mm; }
  .job-description li + li { margin-top: 1mm; }
  a { color: inherit; text-decoration: none; }
  p, li { orphans: 2; widows: 2; }
  h2, h3 { break-after: avoid; }
}
`;

const html = `<!doctype html>
<html lang="en" data-theme="light" data-lang="en" data-view="rendered">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · Resume</title>
  <meta name="description" content="Resume of ${escapeHtml(title)}: senior/lead engineer and engineering leader specializing in AI engineering: agentic delivery harnesses, LLM tooling, cloud-native platforms, and open-source developer tools.">
  <link rel="icon" href="${favicon}">
  <link rel="canonical" href="${SITE}/">
  <link rel="alternate" type="text/markdown" hreflang="en" href="${SITE}/en.md" title="Resume as Markdown (English)">
  <link rel="alternate" type="text/markdown" hreflang="pt-BR" href="${SITE}/pt.md" title="Currículo em Markdown (Português)">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    (function () {
      try {
        var t = localStorage.getItem("cv-theme");
        if (!t) t = "light";
        document.documentElement.setAttribute("data-theme", t);
        var l = localStorage.getItem("cv-lang");
        if (l !== "en" && l !== "pt") l = "en";
        document.documentElement.setAttribute("data-lang", l);
        var v = location.hash === "#markdown" ? "raw" : localStorage.getItem("cv-view");
        document.documentElement.setAttribute("data-view", v === "raw" ? "raw" : "rendered");
      } catch (e) {}
    })();
  </script>
  <style>${css}</style>
  <script type="application/ld+json">
${jsonLd}
  </script>
</head>
<body>
  <!-- Generated from README.md + README.pt-BR.md. Do not edit index.html directly. -->
  <nav class="toolbar" aria-label="Resume controls">
    <span class="device"><b>FRB</b><span> / cv.felipe.run</span></span>
    <span class="spacer"></span>
    <span class="seg" role="group" aria-label="Language">
      <button type="button" data-lang-btn="en" aria-pressed="true">EN</button>
      <button type="button" data-lang-btn="pt" aria-pressed="false">PT</button>
    </span>
    <button class="tbtn icon" type="button" data-action="theme" aria-label="Toggle theme" title="Toggle theme">
      <span data-theme-icon>◐</span>
    </button>
    <button class="tbtn primary" type="button" data-action="download" aria-label="Print or save PDF / Imprimir ou salvar PDF">PDF <span aria-hidden="true">↓</span></button>
    <details class="tools"><summary aria-label="More options / Mais opções">⋯</summary><div class="tools-menu">
    <button class="tbtn" type="button" data-action="view" aria-pressed="false"><span class="lang en"><span class="view-on">View Markdown</span><span class="view-off">View resume</span></span><span class="lang pt"><span class="view-on">Ver Markdown</span><span class="view-off">Ver currículo</span></span></button>
    <button class="tbtn" type="button" data-action="copy"><span class="lang en">Copy Markdown</span><span class="lang pt">Copiar Markdown</span></button>
    <span class="copy-status" aria-live="polite"></span>
    </div></details>
  </nav>

  <article class="resume">
    <header>
      ${buildHeroCopyBlocks()}
      <img class="portrait" src="felipe-avatar.jpg" width="88" height="100" alt="Portrait of ${escapeHtml(title)}">
      <div class="contact-area">${buildContactBlocks()}</div>
    </header>

    <main>
      ${buildBodyBlocks()}
    </main>

    <footer class="foot"><span>Felipe R. Broering</span><span><span class="lang en"><a href="/${MIRRORS.en}">Resume as Markdown</a></span><span class="lang pt"><a href="/${MIRRORS.pt}">Currículo em Markdown</a></span></span>
    </footer>
  </article>

  <section class="raw-wrap" aria-label="Markdown source">
    <div class="raw-head">
      <span class="lang en">source · <b>README.md</b></span>
      <span class="lang pt">fonte · <b>README.pt-BR.md</b></span>
    </div>
    <pre class="raw-md" id="raw-out" tabindex="0"></pre>
  </section>

  <script type="text/plain" id="md-en">${escapeHtml(markdownRaw.en)}</script>
  <script type="text/plain" id="md-pt">${escapeHtml(markdownRaw.pt)}</script>
  <script>
    (function () {
      var root = document.documentElement;
      var status = document.querySelector(".copy-status");
      var viewBtn = document.querySelector("[data-action='view']");
      var rawOut = document.getElementById("raw-out");
      var COPIED = { en: "Copied", pt: "Copiado" };
      var menu = document.querySelector(".tools");
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && menu.open) {
          menu.open = false;
          menu.querySelector("summary").focus();
        }
      });
      document.addEventListener("click", function (event) {
        if (!menu.contains(event.target)) menu.open = false;
      });

      function markdownFor(lang) {
        var node = document.getElementById("md-" + lang);
        var decode = document.createElement("textarea");
        decode.innerHTML = node.textContent;
        return decode.value.trim() + "\\n";
      }

      function setLang(lang) {
        root.setAttribute("data-lang", lang);
        root.setAttribute("lang", lang === "pt" ? "pt-BR" : "en");
        try { localStorage.setItem("cv-lang", lang); } catch (e) {}
        var btns = document.querySelectorAll("[data-lang-btn]");
        for (var i = 0; i < btns.length; i++) {
          btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-lang-btn") === lang ? "true" : "false");
        }
        if (root.getAttribute("data-view") === "raw") renderRaw();
      }
      function renderRaw() {
        rawOut.textContent = markdownFor(root.getAttribute("data-lang") || "en");
      }
      function setView(view) {
        root.setAttribute("data-view", view);
        try { localStorage.setItem("cv-view", view); } catch (e) {}
        viewBtn.setAttribute("aria-pressed", view === "raw" ? "true" : "false");
        if (view === "raw") renderRaw();
      }
      function setTheme(theme) {
        root.setAttribute("data-theme", theme);
        try { localStorage.setItem("cv-theme", theme); } catch (e) {}
      }

      var langBtns = document.querySelectorAll("[data-lang-btn]");
      for (var i = 0; i < langBtns.length; i++) {
        langBtns[i].addEventListener("click", function () {
          setLang(this.getAttribute("data-lang-btn"));
        });
      }
      setLang(root.getAttribute("data-lang") || "en");
      setView(root.getAttribute("data-view") === "raw" ? "raw" : "rendered");

      viewBtn.addEventListener("click", function () {
        setView(root.getAttribute("data-view") === "raw" ? "rendered" : "raw");
        document.querySelector(".tools").open = false;
      });

      document.querySelector("[data-action='theme']").addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });

      document.querySelector("[data-action='download']").addEventListener("click", function () {
        window.print();
      });

      document.querySelector("[data-action='copy']").addEventListener("click", function () {
        var lang = root.getAttribute("data-lang") || "en";
        var markdown = markdownFor(lang);
        function done() {
          status.textContent = COPIED[lang];
          window.setTimeout(function () { status.textContent = ""; }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(markdown).then(done, fallback);
        } else {
          fallback();
        }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = markdown;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          ta.remove();
          done();
        }
      });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, html, "utf8");

// Markdown mirrors + an llms.txt index pointing at them. llms.txt is a
// community convention, not a standard, and nothing guarantees a crawler
// reads it — it costs one small file, so it is here as a cheap bet.
const written = [outputPath];
for (const lang of ["en", "pt"]) {
  const mirrorPath = path.join(ROOT, MIRRORS[lang]);
  fs.writeFileSync(mirrorPath, markdownRaw[lang] + "\n", "utf8");
  written.push(mirrorPath);
}

const llms = `# ${title}

> Lead engineer and engineering leader specializing in AI engineering: agentic
> delivery harnesses, LLM tooling, cloud-native platforms, and open-source
> developer tools. Based in Florianópolis, SC, Brazil.

The rendered page at ${SITE}/ carries both languages in one document plus
inline styling; these files are the same resume as plain Markdown, one language
each.

## Resume

- [Resume (English)](${SITE}/${MIRRORS.en}): full resume in Markdown.
- [Currículo (Português do Brasil)](${SITE}/${MIRRORS.pt}): same resume, pt-BR.

## Contact

- Email: hi@felipe.run
- LinkedIn: https://www.linkedin.com/in/felipebroering
- GitHub: https://github.com/feliperun
`;
const llmsPath = path.join(ROOT, "llms.txt");
fs.writeFileSync(llmsPath, llms, "utf8");
written.push(llmsPath);

console.log(
  `Generated ${written.map((p) => path.relative(ROOT, p)).join(", ")} from README.md + README.pt-BR.md`
);
