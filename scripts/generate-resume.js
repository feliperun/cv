#!/usr/bin/env node

/**
 * Builds index.html from the two Markdown sources of truth:
 *   README.md        -> English
 *   README.pt-BR.md  -> Portuguese (Brazil)
 *
 * Design: an engineering-console dual theme.
 *   dark  = terminal on monitor glass
 *   light = clean printout on graph paper
 * The console prompt is the signature element (hero command + section glyphs + metric sparklines).
 * Do not edit index.html directly.
 */

const fs = require("fs");
const path = require("path");
const { slugify, sectionize, parseIntro } = require("./lib/parse-resume");

const ROOT = path.resolve(__dirname, "..");
const outputPath = path.join(ROOT, "index.html");

const SOURCES = {
  en: path.join(ROOT, "README.md"),
  pt: path.join(ROOT, "README.pt-BR.md"),
};

// -- Language-independent configuration -------------------------------------

// Career metrics — values are shared; labels/subs translate. Framed as
// engineering + startup outcomes, not tied to any single domain.
const VITALS = [
  { value: "10×", subEn: "2s → 200ms", subPt: "2s → 200ms", en: "Latency cut", pt: "Latência" },
  { value: "50%+", subEn: "cloud modernization", subPt: "modernização cloud", en: "Infra cost cut", pt: "Custo de infra" },
  { value: "10k+", subEn: "processed / day", subPt: "processadas / dia", en: "Throughput", pt: "Throughput" },
  { value: "20TB", subEn: "3h downtime", subPt: "3h de downtime", en: "Data migrated", pt: "Dados migrados" },
  { value: "2M", subEn: "as founder", subPt: "como fundador", en: "Records delivered", pt: "Registros entregues" },
  { value: "R$2.2M", subEn: "seed round", subPt: "rodada seed", en: "Funding raised", pt: "Captação" },
];

const FOCUS = {
  en: ["AI engineering & agents", "Agentic delivery harnesses", "Cloud-native platforms", "0→1 products & teams", "Rust & developer tools"],
  pt: ["Engenharia de IA & agentes", "Harnesses de entrega agêntica", "Plataformas cloud-native", "Produtos & times 0→1", "Rust & ferramentas de dev"],
};

// Hero console signature (domain-agnostic; reflects his terminal-first OSS).
const TERM = {
  prompt: "felipe@run",
  cmd: "ship",
  args: [
    { flag: "--from", value: "idea" },
    { flag: "--to", value: "production" },
  ],
  en: "# nearly two decades shipping across e-commerce, fintech, ERP, developer tools & healthcare",
  pt: "# quase duas décadas entregando em e-commerce, fintech, ERP, ferramentas de dev & saúde",
};

const UI = {
  en: {
    langLabel: "EN",
    download: "Download PDF",
    copy: "Copy Markdown",
    copied: "Copied",
    operator: "Contact",
    vitals: "Selected impact",
    themeToDark: "Switch to dark",
    themeToLight: "Switch to light",
    live: "Live",
  },
  pt: {
    langLabel: "PT",
    download: "Baixar PDF",
    copy: "Copiar Markdown",
    copied: "Copiado",
    operator: "Contato",
    vitals: "Impacto",
    themeToDark: "Mudar para escuro",
    themeToLight: "Mudar para claro",
    live: "Ao vivo",
  },
};

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
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
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

// -- Signature geometry -----------------------------------------------------

// A neutral rising data-trend sparkline (not a physiological signal) for tiles.
function sparkPath({ width, height, levels, baseline = 0.86, amp = 0.72 }) {
  const yBase = height * baseline;
  const a = height * amp;
  const step = width / (levels.length - 1);
  return levels
    .map((lv, i) => (i === 0 ? "M" : "L") + (i * step).toFixed(1) + " " + (yBase - lv * a).toFixed(1))
    .join(" ");
}

const SPARK_LEVELS = [0.12, 0.26, 0.19, 0.4, 0.33, 0.58, 0.5, 0.8, 0.7, 1.0];
const SPARK = sparkPath({ width: 58, height: 24, levels: SPARK_LEVELS });
const sparkSvg = `<svg class="spark" viewBox="0 0 58 24" preserveAspectRatio="none" aria-hidden="true"><path d="${SPARK}"></path></svg>`;

// Terminal-prompt favicon: a `>` chevron + underscore cursor.
const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0a0e0d"/><path d="M9 11 L15 16 L9 21" fill="none" stroke="#2fe6b0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21 H23" fill="none" stroke="#2fe6b0" stroke-width="2.4" stroke-linecap="round"/></svg>`
  );

// Hero console band: shared command, per-language comment line.
function renderTermBand() {
  const args = TERM.args
    .map((a) => `<span class="t-flag">${escapeHtml(a.flag)}</span> <span class="t-val">${escapeHtml(a.value)}</span>`)
    .join(" ");
  const ariaLabel = `${TERM.prompt}:~$ ${TERM.cmd} ${TERM.args.map((a) => a.flag + " " + a.value).join(" ")}`;
  const outs = ["en", "pt"]
    .map((lang) => `<div class="lang ${lang}"><p class="term-out">${escapeHtml(TERM[lang])}</p></div>`)
    .join("\n");
  return `<div class="term-band">
    <div class="term" role="img" aria-label="${escapeHtml(ariaLabel)}"><span class="t-prompt">${escapeHtml(TERM.prompt)}</span><span class="t-sep">:~$</span> <span class="t-cmd">${escapeHtml(TERM.cmd)}</span> ${args}<span class="t-cursor" aria-hidden="true"></span></div>
    ${outs}
  </div>`;
}

// -- Per-language rendering -------------------------------------------------

function contactHtml(contactItems) {
  return contactItems
    .map((item) => {
      const [label, ...rest] = item.split(":");
      const value = rest.join(":").trim();
      let rendered;
      if (/^https?:\/\/\S+$/.test(value)) {
        const short = value.replace(/^https?:\/\//, "").replace(/\/$/, "");
        rendered = `<a href="${value}">${escapeHtml(short)}</a>`;
      } else {
        rendered = renderInline(value);
      }
      return `<div class="contact-row"><span class="contact-k">${escapeHtml(label.trim())}</span><span class="contact-v">${rendered}</span></div>`;
    })
    .join("\n");
}

function renderMainSection(section, lang) {
  const slug = slugify(section.title);
  const id = `${lang}-${slug}`;
  const role = roleOf(slug);
  const body = parseMarkdown(section.content);
  const head = `<h2 class="sec-h" id="${id}"><span class="sec-glyph" aria-hidden="true">&#9656;</span><span>${escapeHtml(section.title)}</span><span class="sec-rule"></span></h2>`;

  if (role === "profile") {
    return `<section class="sec sec-profile" aria-labelledby="${id}">${head}<div class="lede">${body}</div></section>`;
  }
  if (role === "case") {
    return `<section class="sec sec-case" aria-labelledby="${id}">${head}<div class="case">${body}</div></section>`;
  }
  const extra = slug === "experience" || slug === "experiencia" ? " sec-exp" : "";
  return `<section class="sec${extra}" aria-labelledby="${id}">${head}<div class="prose">${body}</div></section>`;
}

function renderSideSection(section, lang) {
  const slug = slugify(section.title);
  const id = `${lang}-${slug}`;
  const isTags = slug === "expertise" || slug === "especialidades";
  const body = isTags ? renderTagCloud(section.content) : parseMarkdown(section.content);
  return `<section class="side" aria-labelledby="${id}">
    <h3 class="side-h" id="${id}">${escapeHtml(section.title)}</h3>
    <div class="prose">${body}</div>
  </section>`;
}

function renderTagCloud(contentLines) {
  const text = contentLines.filter((l) => l.trim()).join(" ").trim();
  const tags = text.split(",").map((t) => t.trim()).filter(Boolean);
  return `<ul class="tags">${tags.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
}

function renderVitals(lang) {
  const t = UI[lang];
  const cells = VITALS.map((v) => {
    const sub = lang === "pt" ? v.subPt : v.subEn;
    return `<div class="vital">
      <span class="vital-label">${escapeHtml(lang === "pt" ? v.pt : v.en)}</span>
      <span class="vital-value">${escapeHtml(v.value)}</span>
      <span class="vital-sub">${escapeHtml(sub)}</span>
      ${sparkSvg}
    </div>`;
  }).join("\n");
  return `<section class="vitals-wrap" aria-label="${escapeHtml(t.vitals)}">
    <div class="vitals-cap"><span class="dot"></span><span>${escapeHtml(t.vitals)}</span></div>
    <div class="vitals">${cells}</div>
  </section>`;
}

function renderHeroCopy(lang, subtitle, location) {
  const chips = FOCUS[lang].map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  return `<div class="hero-copy">
    <p class="eyebrow">${escapeHtml(subtitle)}</p>
    <h1>Felipe R.<br>Broering</h1>
    <p class="loc">${escapeHtml(location)}</p>
    <ul class="focus" aria-label="Focus areas">${chips}</ul>
  </div>`;
}

function renderContact(lang, contact) {
  const t = UI[lang];
  return `<div class="operator-tag">${escapeHtml(t.operator)}</div>
    <address class="contact">${contactHtml(contact)}</address>`;
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

function buildVitalsBlocks() {
  return ["en", "pt"].map((lang) => langBlock(lang, renderVitals(lang))).join("\n");
}

function buildBodyBlocks() {
  return ["en", "pt"]
    .map((lang) => {
      const { sections } = parsed[lang];
      const visible = sections.filter((s) => !OMIT.has(slugify(s.title)));
      const main = visible.filter((s) => roleOf(slugify(s.title)) !== "side");
      const side = visible.filter((s) => roleOf(slugify(s.title)) === "side");
      const mainHtml = main.map((s) => renderMainSection(s, lang)).join("\n");
      const sideHtml = side.map((s) => renderSideSection(s, lang)).join("\n");
      const inner = `<div class="content">${mainHtml}</div><aside>${sideHtml}</aside>`;
      return langBlock(lang, inner);
    })
    .join("\n");
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
  --bg: #0a0e0d;
  --bg-2: #0d1211;
  --panel: #0f1615;
  --raise: #121a18;
  --ink: #e9f2ec;
  --muted: #8ba39a;
  --faint: #56685f;
  --line: rgba(120, 210, 180, 0.16);
  --line-2: rgba(120, 210, 180, 0.08);
  --grid: rgba(60, 220, 170, 0.045);
  --grid-strong: rgba(60, 220, 170, 0.07);
  --signal: #2fe6b0;
  --signal-ink: #2fe6b0;
  --signal-soft: rgba(47, 230, 176, 0.13);
  --amber: #ffb44d;
  --glow: 0 0 22px rgba(47, 230, 176, 0.28);
  --shadow: 0 40px 120px rgba(0, 0, 0, 0.55);
  --grid-size: 26px;
  --serif: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
}

html[data-theme="light"] {
  --bg: #f5efe9;
  --bg-2: #fdfaf6;
  --panel: #fffbf6;
  --raise: #fffaf4;
  --ink: #16211d;
  --muted: #5c675f;
  --faint: #9aa39a;
  --line: rgba(20, 40, 32, 0.14);
  --line-2: rgba(20, 40, 32, 0.08);
  --grid: rgba(214, 116, 84, 0.09);
  --grid-strong: rgba(214, 116, 84, 0.16);
  --signal: #0e7c66;
  --signal-ink: #0b5c4c;
  --signal-soft: rgba(14, 124, 102, 0.1);
  --amber: #b5651a;
  --glow: none;
  --shadow: 0 30px 90px rgba(70, 50, 30, 0.14);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.6;
  background:
    linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / var(--grid-size) var(--grid-size),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / var(--grid-size) var(--grid-size),
    linear-gradient(var(--grid-strong) 1px, transparent 1px) 0 0 / calc(var(--grid-size) * 5) calc(var(--grid-size) * 5),
    linear-gradient(90deg, var(--grid-strong) 1px, transparent 1px) 0 0 / calc(var(--grid-size) * 5) calc(var(--grid-size) * 5),
    var(--bg);
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--signal-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--line);
  transition: border-color 0.15s, color 0.15s;
  word-break: break-word;
}
a:hover { border-color: var(--signal); }
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 3px;
  border-radius: 3px;
}

/* language switching */
.lang { display: none; }
html[data-lang="en"] .lang.en,
html[data-lang="pt"] .lang.pt { display: contents; }

/* ---- toolbar ---- */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(12px);
  font-family: var(--mono);
  font-size: 0.78rem;
}
.device {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--muted);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.device .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--signal);
  box-shadow: var(--glow);
  animation: blink 2.4s steps(1) infinite;
}
.device b { color: var(--ink); font-weight: 600; }
.toolbar .spacer { flex: 1; }
.seg {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
}
.seg button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
}
.seg button[aria-pressed="true"] {
  background: var(--signal-soft);
  color: var(--signal-ink);
}
.tbtn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--raise);
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  padding: 6px 13px;
  cursor: pointer;
  white-space: nowrap;
}
.tbtn:hover { border-color: var(--signal); }
.tbtn.icon { padding: 6px 10px; }
.copy-status { color: var(--signal-ink); min-width: 58px; }

/* ---- shell ---- */
.resume {
  width: min(1120px, 100% - 36px);
  margin: 30px auto 60px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

/* ---- hero ---- */
header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 46px;
  padding: 54px 56px 34px;
  border-bottom: 1px solid var(--line);
}
.eyebrow {
  margin: 0 0 20px;
  font-family: var(--mono);
  font-size: 0.76rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--signal-ink);
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-family: var(--serif);
  font-weight: 600;
  font-size: clamp(2.9rem, 6.4vw, 5.4rem);
  line-height: 0.94;
  letter-spacing: -0.02em;
}
.loc {
  margin: 18px 0 0;
  font-family: var(--mono);
  font-size: 0.9rem;
  color: var(--muted);
}
.focus {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}
.focus li {
  font-family: var(--mono);
  font-size: 0.76rem;
  font-weight: 500;
  padding: 6px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--panel);
}

.profile-panel { align-self: start; }
.portrait {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 1px solid var(--line);
  filter: grayscale(1) contrast(1.04);
}
html[data-theme="dark"] .portrait {
  filter: grayscale(1) contrast(1.05) brightness(0.92);
}
.operator-tag {
  margin: 12px 0 10px;
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}
.contact { display: grid; gap: 9px; font-style: normal; }
.contact-row { display: grid; gap: 1px; }
.contact-k {
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
}
.contact-v { font-size: 0.86rem; color: var(--ink); }
.contact-v a { border-bottom-color: var(--line-2); }

/* ---- console signature ---- */
.term-band {
  padding: 20px 56px 22px;
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(180deg, var(--signal-soft), transparent 70%),
    var(--panel);
}
.term {
  font-family: var(--mono);
  font-size: clamp(0.9rem, 2vw, 1.08rem);
  line-height: 1.5;
  letter-spacing: -0.01em;
  overflow-x: auto;
  white-space: nowrap;
}
.t-prompt { color: var(--signal-ink); font-weight: 600; }
.t-sep { color: var(--faint); }
.t-cmd { color: var(--ink); font-weight: 600; }
.t-flag { color: var(--amber); }
.t-val { color: var(--muted); }
.t-cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.05em;
  margin-left: 0.18em;
  vertical-align: -0.18em;
  background: var(--signal);
  box-shadow: var(--glow);
  animation: cursor 1.1s steps(1) infinite;
}
.term-out {
  margin: 8px 0 0;
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--faint);
}

/* ---- vitals monitor ---- */
.vitals-wrap {
  padding: 26px 56px 30px;
  border-bottom: 1px solid var(--line);
}
.vitals-cap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}
.vitals-cap .dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--amber);
}
.vitals {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
  background: var(--panel);
}
.vital {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 16px 40px;
  border-right: 1px solid var(--line);
  min-width: 0;
}
.vital:last-child { border-right: 0; }
.vital-label {
  font-family: var(--mono);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.vital-value {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.9rem;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.vital-sub {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--signal-ink);
}
.vital .spark {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 12px;
  width: auto;
  height: 20px;
  opacity: 0.85;
}
.vital .spark path {
  fill: none;
  stroke: var(--signal);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- main grid ---- */
main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 50px;
  padding: 42px 56px 20px;
}
.content { min-width: 0; }

.sec + .sec { margin-top: 38px; }
.sec-h {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 18px;
  font-family: var(--mono);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
}
.sec-glyph {
  color: var(--signal);
  font-size: 0.85em;
  line-height: 1;
}
.sec-rule { flex: 1; height: 1px; background: var(--line); }

h3 {
  margin: 22px 0 3px;
  font-family: var(--sans);
  font-weight: 600;
  font-size: 1.12rem;
  line-height: 1.28;
  letter-spacing: -0.01em;
}
h3:first-child { margin-top: 0; }

.prose p, .lede p, .case p { margin: 0; color: var(--muted); }
.prose p + p, .lede p + p, .case p + p,
.prose h3 + p, .prose h4 + p { margin-top: 10px; }
.prose ul, .lede ul, .case ul { margin: 9px 0 0; padding-left: 1.1rem; }
.prose li, .case li, .lede li { color: var(--muted); }
.prose li + li, .case li + li, .lede li + li { margin-top: 6px; }
.prose li::marker { color: var(--signal); }

/* profile lede */
.lede p {
  color: var(--ink);
  font-size: 1.05rem;
}
.lede p + p { color: var(--muted); font-size: 1rem; }

/* the featured case card */
.sec-case .case {
  position: relative;
  padding: 24px 26px;
  border: 1px solid var(--line);
  background:
    linear-gradient(180deg, var(--signal-soft), transparent 60%),
    var(--panel);
  border-radius: 4px;
}
.sec-case .case::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--signal);
}
.sec-case h3 { color: var(--ink); }

/* experience — role date line + lead wire */
.sec-exp .prose { position: relative; padding-left: 22px; }
.sec-exp .prose::before {
  content: "";
  position: absolute;
  left: 3px; top: 8px; bottom: 8px;
  width: 1px;
  background: var(--line);
}
.sec-exp .prose h3 { position: relative; }
.sec-exp .prose h3::before {
  content: "";
  position: absolute;
  left: -22px; top: 0.5em;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 0 4px var(--bg-2);
}
.sec-exp .prose h3 + p {
  margin-top: 2px;
  font-family: var(--mono);
  font-size: 0.76rem;
  color: var(--muted);
}

/* aside */
aside { display: grid; gap: 26px; align-content: start; }
.side { border-top: 1px solid var(--line); padding-top: 20px; }
.side:first-child { border-top: 0; padding-top: 0; }
.side-h {
  margin: 0 0 12px;
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}
.side .prose p { font-size: 0.9rem; }
.side .prose ul { list-style: none; padding-left: 0; margin: 0; }
.side .prose li { margin-top: 8px; font-size: 0.9rem; color: var(--ink); }
.side .prose li:first-child { margin-top: 0; }
.tags { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; padding: 0; list-style: none; }
.tags li {
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--panel);
}

/* footer */
.foot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 56px 40px;
  border-top: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--faint);
}
.foot .flat { flex: 1; height: 1px; background: repeating-linear-gradient(90deg, var(--line) 0 6px, transparent 6px 12px); }

/* ---- responsive ---- */
@media (max-width: 900px) {
  .resume { width: 100%; margin: 0; border-left: 0; border-right: 0; }
  header, .term-band, .vitals-wrap, main, .foot {
    padding-left: 22px; padding-right: 22px;
  }
  header { grid-template-columns: 1fr; gap: 26px; padding-top: 34px; }
  .profile-panel {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .operator-tag { margin-top: 0; }
  main { grid-template-columns: 1fr; gap: 34px; padding-top: 34px; }
  .vitals { grid-template-columns: repeat(3, 1fr); }
  .vital:nth-child(3) { border-right: 0; }
  .vital:nth-child(-n+3) { border-bottom: 1px solid var(--line); }
}

@media (max-width: 560px) {
  .toolbar { flex-wrap: wrap; gap: 10px; }
  .toolbar .device { width: 100%; }
  header, .term-band, .vitals-wrap, main, .foot {
    padding-left: 16px; padding-right: 16px;
  }
  .profile-panel { grid-template-columns: 104px minmax(0, 1fr); }
  .vitals { grid-template-columns: repeat(2, 1fr); }
  .vital { border-right: 1px solid var(--line); }
  .vital:nth-child(2n) { border-right: 0; }
  .vital:nth-child(-n+4) { border-bottom: 1px solid var(--line); }
  h1 { font-size: clamp(2.6rem, 13vw, 3.4rem); }
}

/* ---- motion / a11y ---- */
@keyframes cursor { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
@keyframes blink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.28; } }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .t-cursor { animation: none; }
  .device .dot { animation: none; }
}

/* ---- print: clean light printout ---- */
@page { margin: 0.5in; }
@media print {
  :root, html[data-theme="dark"], html[data-theme="light"] {
    --bg: #fff; --bg-2: #fff; --panel: #fff; --raise: #fff;
    --ink: #14201c; --muted: #333; --faint: #666;
    --line: #d7d0c6; --line-2: #e2ddd4;
    --grid: transparent; --grid-strong: transparent;
    --signal: #0b5c4c; --signal-ink: #0b5c4c; --signal-soft: rgba(11,92,76,0.06);
    --amber: #a05a13; --glow: none; --shadow: none;
  }
  body { background: #fff; }
  .toolbar, .foot .flat { display: none; }
  .resume { width: 100%; margin: 0; border: 0; box-shadow: none; }
  header, .term-band, .vitals-wrap, main, .foot { padding-left: 0; padding-right: 0; }
  header { grid-template-columns: minmax(0,1fr) 180px; padding-top: 8px; }
  .portrait { max-width: 180px; }
  .term-band { background: none; border-bottom-color: var(--line); }
  .t-cursor { display: none; }
  .vital .spark path { filter: none; }
  a { color: var(--ink); border: 0; }
  .sec, .side, .vital, .sec-case .case { break-inside: avoid; }
  h1 { font-size: 3.1rem; }
}
`;

const html = `<!doctype html>
<html lang="en" data-theme="dark" data-lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Resume</title>
  <meta name="description" content="Resume of ${escapeHtml(title)} — senior/lead engineer and engineering leader specializing in AI engineering: agentic delivery harnesses, LLM tooling, cloud-native platforms, and open-source developer tools.">
  <link rel="icon" href="${favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <script>
    (function () {
      try {
        var t = localStorage.getItem("cv-theme");
        if (!t) t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", t);
        var l = localStorage.getItem("cv-lang");
        if (l !== "en" && l !== "pt") l = "en";
        document.documentElement.setAttribute("data-lang", l);
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
    <span class="device"><span class="dot"></span><b>FRB</b> · cv.felipe.run</span>
    <span class="spacer"></span>
    <span class="seg" role="group" aria-label="Language">
      <button type="button" data-lang-btn="en" aria-pressed="true">EN</button>
      <button type="button" data-lang-btn="pt" aria-pressed="false">PT</button>
    </span>
    <button class="tbtn icon" type="button" data-action="theme" aria-label="Toggle theme" title="Toggle theme">
      <span data-theme-icon>◐</span>
    </button>
    <button class="tbtn" type="button" data-action="download"><span class="lang en">Download PDF</span><span class="lang pt">Baixar PDF</span></button>
    <button class="tbtn" type="button" data-action="copy"><span class="lang en">Copy Markdown</span><span class="lang pt">Copiar Markdown</span></button>
    <span class="copy-status" aria-live="polite"></span>
  </nav>

  <article class="resume">
    <header>
      ${buildHeroCopyBlocks()}
      <div class="profile-panel">
        <img class="portrait" src="felipe-avatar.jpg" alt="Portrait of ${escapeHtml(title)}">
        <div class="contact-area">${buildContactBlocks()}</div>
      </div>
    </header>

    ${renderTermBand()}

    ${buildVitalsBlocks()}

    <main>
      ${buildBodyBlocks()}
    </main>

    <footer class="foot">
      <span>Rendered from README · ${new Date().getUTCFullYear()}</span>
      <span class="flat"></span>
      <span>cv.felipe.run</span>
    </footer>
  </article>

  <script type="text/plain" id="md-en">${escapeHtml(markdownRaw.en)}</script>
  <script type="text/plain" id="md-pt">${escapeHtml(markdownRaw.pt)}</script>
  <script>
    (function () {
      var root = document.documentElement;
      var status = document.querySelector(".copy-status");
      var COPIED = { en: "Copied", pt: "Copiado" };

      function setLang(lang) {
        root.setAttribute("data-lang", lang);
        try { localStorage.setItem("cv-lang", lang); } catch (e) {}
        var btns = document.querySelectorAll("[data-lang-btn]");
        for (var i = 0; i < btns.length; i++) {
          btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-lang-btn") === lang ? "true" : "false");
        }
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

      document.querySelector("[data-action='theme']").addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });

      document.querySelector("[data-action='download']").addEventListener("click", function () {
        window.print();
      });

      document.querySelector("[data-action='copy']").addEventListener("click", function () {
        var lang = root.getAttribute("data-lang") || "en";
        var node = document.getElementById("md-" + lang);
        var decode = document.createElement("textarea");
        decode.innerHTML = node.textContent;
        var markdown = decode.value.trim() + "\\n";
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
console.log(`Generated ${path.relative(ROOT, outputPath)} from README.md + README.pt-BR.md`);
