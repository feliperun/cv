#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readmePath = path.join(ROOT, "README.md");
const outputPath = path.join(ROOT, "index.html");

const markdown = fs.readFileSync(readmePath, "utf8").trimEnd();
const lines = markdown.split(/\r?\n/);

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/(?<!["'=])(https?:\/\/[^\s<]+)/g, (url) => {
    const clean = url.replace(/[.,;:!?]+$/, "");
    const suffix = url.slice(clean.length);
    return `<a href="${clean}">${clean}</a>${suffix}`;
  });
  return html;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMarkdown(inputLines) {
  const html = [];
  let paragraph = [];
  let inList = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  }

  for (const line of inputLines) {
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      closeList();
      const text = line.slice(4).trim();
      html.push(`<h3>${renderInline(text)}</h3>`);
      continue;
    }

    if (line.startsWith("#### ")) {
      flushParagraph();
      closeList();
      const text = line.slice(5).trim();
      html.push(`<h4>${renderInline(text)}</h4>`);
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

function sectionize(inputLines) {
  const titleLine = inputLines.find((line) => line.startsWith("# "));
  const title = titleLine ? titleLine.slice(2).trim() : "Felipe R. Broering";
  const titleIndex = inputLines.findIndex((line) => line.startsWith("# "));
  const bodyLines = titleIndex >= 0 ? inputLines.slice(titleIndex + 1) : inputLines;
  const firstSectionIndex = bodyLines.findIndex((line) => line.startsWith("## "));
  const introLines = firstSectionIndex >= 0 ? bodyLines.slice(0, firstSectionIndex) : bodyLines;
  const sectionLines = firstSectionIndex >= 0 ? bodyLines.slice(firstSectionIndex) : [];
  const sections = [];

  for (let i = 0; i < sectionLines.length; i += 1) {
    const line = sectionLines[i];
    if (!line.startsWith("## ")) continue;
    const sectionTitle = line.slice(3).trim();
    const content = [];
    i += 1;
    while (i < sectionLines.length && !sectionLines[i].startsWith("## ")) {
      content.push(sectionLines[i]);
      i += 1;
    }
    i -= 1;
    sections.push({ title: sectionTitle, content });
  }

  return { title, introLines, sections };
}

function parseIntro(introLines) {
  const compact = introLines.filter((line) => line.trim());
  const subtitle = compact.find((line) => !line.startsWith("- ")) || "";
  const location = compact.find((line) => line.includes("Brazil")) || "";
  const contact = compact
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
  return { subtitle, location, contact };
}

function contactHtml(contactItems) {
  return contactItems
    .map((item) => {
      const [label, ...rest] = item.split(":");
      const value = rest.join(":").trim();
      const rendered = renderInline(value);
      return `<div><strong>${escapeHtml(label.trim())}</strong><br>${rendered}</div>`;
    })
    .join("\n");
}

function renderSection(section) {
  const id = slugify(section.title);
  const body = parseMarkdown(section.content);
  const lower = section.title.toLowerCase();

  if (lower === "profile") {
    return `<section class="section section-profile" aria-labelledby="${id}">
      <h2 id="${id}">${escapeHtml(section.title)}</h2>
      <div class="highlight">${body}</div>
    </section>`;
  }

  if (lower === "featured case study") {
    return `<section class="section section-case" aria-labelledby="${id}">
      <h2 id="${id}">${escapeHtml(section.title)}</h2>
      <div class="case-study">${body}</div>
    </section>`;
  }

  return `<section class="section" aria-labelledby="${id}">
    <h2 id="${id}">${escapeHtml(section.title)}</h2>
    <div class="markdown">${body}</div>
  </section>`;
}

const sideSectionTitles = new Set([
  "Selected Impact",
  "Expertise",
  "Education",
  "Certifications",
  "Languages",
]);

const { title, introLines, sections } = sectionize(lines);
const { subtitle, location, contact } = parseIntro(introLines);
const mainSections = sections.filter((section) => !sideSectionTitles.has(section.title));
const sideSections = sections.filter((section) => sideSectionTitles.has(section.title));

const mainHtml = mainSections.map(renderSection).join("\n");
const sideHtml = sideSections.map((section) => {
  const id = slugify(section.title);
  return `<section class="side-block" aria-labelledby="${id}">
    <h2 id="${id}">${escapeHtml(section.title)}</h2>
    <div class="markdown">${parseMarkdown(section.content)}</div>
  </section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Resume</title>
  <meta name="description" content="Resume of ${escapeHtml(title)}, Product Engineer and engineering leader focused on healthcare technology, AI, cloud platforms, and end-to-end product delivery.">
  <style>
    :root {
      color-scheme: light;
      --bg: #ece7df;
      --paper: #fffdf8;
      --panel: #f7f2ea;
      --ink: #1f211f;
      --muted: #62635e;
      --line: #d9d0c4;
      --accent: #0f766e;
      --accent-2: #9a5b44;
      --accent-3: #536b45;
      --tag: #ede7dd;
      --shadow: 0 24px 80px rgba(30, 28, 23, 0.13);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background:
        linear-gradient(90deg, rgba(83, 107, 69, 0.11) 0 1px, transparent 1px 100%),
        linear-gradient(180deg, rgba(15, 118, 110, 0.1), transparent 320px),
        var(--bg);
      background-size: 48px 48px, auto, auto;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }

    a {
      color: inherit;
      text-decoration-color: rgba(15, 118, 110, 0.48);
      text-underline-offset: 0.18em;
    }

    .page-actions {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(236, 231, 223, 0.82);
      border-bottom: 1px solid rgba(217, 208, 196, 0.75);
      backdrop-filter: blur(14px);
    }

    .action-button {
      min-height: 38px;
      padding: 0 14px;
      border: 1px solid rgba(31, 33, 31, 0.18);
      border-radius: 999px;
      background: var(--paper);
      color: var(--ink);
      font: inherit;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
    }

    .copy-status {
      align-self: center;
      min-width: 84px;
      color: var(--muted);
      font-size: 0.88rem;
    }

    .resume {
      width: min(1180px, calc(100% - 32px));
      margin: 34px auto 56px;
      background: var(--paper);
      border: 1px solid rgba(217, 208, 196, 0.95);
      box-shadow: var(--shadow);
    }

    header {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 40px;
      padding: 56px 60px 42px;
      overflow: hidden;
      border-bottom: 1px solid var(--line);
    }

    header::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 9px;
      background: linear-gradient(180deg, var(--accent), var(--accent-2) 54%, var(--accent-3));
    }

    header > * { position: relative; }

    .eyebrow {
      margin: 0 0 14px;
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      max-width: 760px;
      margin: 0;
      font-size: clamp(2.8rem, 5.4vw, 5.5rem);
      line-height: 0.92;
      letter-spacing: 0;
    }

    .headline {
      max-width: 760px;
      margin: 24px 0 0;
      color: var(--muted);
      font-size: clamp(1.05rem, 1.8vw, 1.32rem);
    }

    .hero-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 26px 0 0;
      padding: 0;
      list-style: none;
    }

    .hero-tags li {
      margin: 0;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(247, 242, 234, 0.78);
      color: #3f403b;
      font-size: 0.86rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .profile-panel { align-self: start; }

    .portrait {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border: 1px solid rgba(31, 33, 31, 0.18);
      filter: grayscale(1) contrast(1.05);
    }

    .contact {
      display: grid;
      gap: 10px;
      margin-top: 18px;
      font-size: 0.92rem;
      color: var(--muted);
      font-style: normal;
    }

    .contact strong {
      color: var(--ink);
      font-weight: 780;
    }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 330px;
      gap: 52px;
      padding: 42px 60px 60px;
    }

    .section + .section { margin-top: 42px; }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 18px;
      color: var(--accent);
      font-size: 0.8rem;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    h2::after {
      content: "";
      height: 1px;
      flex: 1;
      background: var(--line);
    }

    h3 {
      margin: 24px 0 8px;
      font-size: 1.18rem;
      line-height: 1.25;
    }

    h3:first-child { margin-top: 0; }

    .highlight {
      padding: 20px 22px;
      background:
        linear-gradient(90deg, rgba(223, 238, 234, 0.95), rgba(223, 238, 234, 0.36)),
        var(--panel);
      border-left: 4px solid var(--accent);
      color: #303531;
    }

    .case-study {
      position: relative;
      padding: 24px;
      border: 1px solid rgba(15, 118, 110, 0.22);
      background:
        linear-gradient(135deg, rgba(15, 118, 110, 0.13), transparent 48%),
        linear-gradient(180deg, #fffefb, #f4eee5);
    }

    .case-study::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 7px;
      background: linear-gradient(180deg, var(--accent), var(--accent-3));
    }

    .markdown p {
      margin: 0;
      color: var(--muted);
    }

    .markdown p + p,
    .highlight p + p,
    .case-study p + p {
      margin-top: 12px;
    }

    .markdown ul,
    .case-study ul,
    .highlight ul {
      margin: 10px 0 0;
      padding-left: 1.15rem;
    }

    .markdown li + li,
    .case-study li + li,
    .highlight li + li {
      margin-top: 7px;
    }

    .section .markdown h3 {
      padding-top: 22px;
      border-top: 1px solid var(--line);
    }

    .section .markdown h3:first-child {
      padding-top: 0;
      border-top: 0;
    }

    .section:nth-of-type(3) .markdown h3,
    .section:nth-of-type(4) .markdown h3 {
      color: var(--accent-2);
    }

    aside {
      padding-left: 24px;
      border-left: 1px solid var(--line);
    }

    .side-block {
      padding: 24px 0;
      border-top: 1px solid var(--line);
    }

    .side-block:first-child {
      padding-top: 0;
      border-top: 0;
    }

    .side-block p {
      color: var(--muted);
    }

    .side-block ul {
      margin-top: 0;
    }

    .side-block li {
      color: var(--muted);
    }

    @media (max-width: 900px) {
      .resume {
        width: 100%;
        margin: 0;
        border-left: 0;
        border-right: 0;
      }

      header,
      main {
        grid-template-columns: 1fr;
        padding-left: 24px;
        padding-right: 24px;
      }

      header {
        gap: 28px;
        padding-top: 36px;
      }

      .profile-panel {
        display: grid;
        grid-template-columns: 142px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }

      main { gap: 34px; }

      aside {
        padding-left: 0;
        border-left: 0;
      }
    }

    @media (max-width: 560px) {
      .page-actions {
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .copy-status { width: 100%; }
      .profile-panel { grid-template-columns: 112px minmax(0, 1fr); }
    }

    @page { margin: 0.45in; }

    @media print {
      body { background: #fff; }
      .page-actions { display: none; }
      .resume {
        width: 100%;
        margin: 0;
        border: 0;
        box-shadow: none;
      }
      header,
      main {
        padding-left: 28px;
        padding-right: 28px;
      }
      header { grid-template-columns: minmax(0, 1fr) 180px; }
      .portrait { max-width: 180px; }
      .section,
      .side-block { break-inside: avoid; }
    }
  </style>
  <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: title,
      url: "https://cv.felipe.run",
      sameAs: [
        "https://www.linkedin.com/in/felipebroering/",
        "https://github.com/feliperun",
      ],
      jobTitle: "Product Engineer",
      worksFor: {
        "@type": "Organization",
        name: "Micromed",
      },
      address: {
        "@type": "PostalAddress",
        addressRegion: "Santa Catarina",
        addressCountry: "Brazil",
      },
    }, null, 4)}
  </script>
</head>
<body>
  <!-- Generated from README.md. Do not edit index.html directly. -->
  <div class="page-actions" aria-label="Resume actions">
    <button class="action-button" type="button" data-action="download-pdf">Download PDF</button>
    <button class="action-button" type="button" data-action="copy-markdown">Copy Markdown</button>
    <span class="copy-status" aria-live="polite"></span>
  </div>

  <article class="resume">
    <header>
      <div>
        <p class="eyebrow">${escapeHtml(subtitle)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="headline">${escapeHtml(location)}</p>
        <ul class="hero-tags" aria-label="Primary focus areas">
          <li>Healthcare platforms</li>
          <li>AI engineering harnesses</li>
          <li>Rust CLIs</li>
          <li>Cloud-native systems</li>
          <li>Open Source</li>
        </ul>
      </div>
      <div class="profile-panel">
        <img class="portrait" src="felipe-avatar.jpg" alt="Black-and-white portrait of ${escapeHtml(title)}">
        <address class="contact">
          ${contactHtml(contact)}
        </address>
      </div>
    </header>

    <main>
      <div>${mainHtml}</div>
      <aside>${sideHtml}</aside>
    </main>
  </article>

  <script type="text/plain" id="resume-markdown">${escapeHtml(markdown)}</script>
  <script>
    (() => {
      const status = document.querySelector(".copy-status");
      const markdownNode = document.getElementById("resume-markdown");

      document.querySelector("[data-action='download-pdf']").addEventListener("click", () => {
        window.print();
      });

      document.querySelector("[data-action='copy-markdown']").addEventListener("click", async () => {
        const textareaDecode = document.createElement("textarea");
        textareaDecode.innerHTML = markdownNode.innerHTML;
        const markdown = textareaDecode.value.trim() + "\\n";

        try {
          await navigator.clipboard.writeText(markdown);
          status.textContent = "Copied";
        } catch (error) {
          const textarea = document.createElement("textarea");
          textarea.value = markdown;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
          status.textContent = "Copied";
        }

        window.setTimeout(() => {
          status.textContent = "";
        }, 2200);
      });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Generated ${path.relative(ROOT, outputPath)} from ${path.relative(ROOT, readmePath)}`);
