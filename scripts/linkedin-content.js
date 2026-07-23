#!/usr/bin/env node
"use strict";

/**
 * Maps the resume Markdown (README.md EN / README.pt-BR.md PT) to LinkedIn
 * profile fields: { headline, about, positions[] }, as plain text and within
 * LinkedIn's length limits. No secrets, no network — pure content transform.
 *
 * Reuses the shared structural parser (scripts/lib/parse-resume.js) so the
 * section structure matches the HTML resume exactly.
 *
 * Usage:
 *   node scripts/linkedin-content.js --lang en      # prints EN JSON
 *   node scripts/linkedin-content.js --lang pt      # prints PT JSON
 *   node scripts/linkedin-content.js                # prints { en, pt }
 * Programmatic:
 *   const { buildContent } = require("./linkedin-content");
 */

const fs = require("fs");
const path = require("path");
const { sectionize, parseIntro, slugify } = require("./lib/parse-resume");

const ROOT = path.resolve(__dirname, "..");
const SOURCES = {
  en: path.join(ROOT, "README.md"),
  pt: path.join(ROOT, "README.pt-BR.md"),
};

// LinkedIn field limits (chars). Verified conservatively; adjust if LinkedIn changes.
const LIMITS = { headline: 220, about: 2600, positionDescription: 2000 };

// Section slugs (EN + PT) that feed each LinkedIn field.
const PROFILE_SLUGS = new Set(["profile", "perfil"]);
const HOWIBUILD_SLUGS = new Set(["how-i-build", "como-eu-construo"]);
const EXPERIENCE_SLUGS = new Set(["experience", "experiencia"]);
const PRESENT = /^(present|current|até o presente|ate o presente|o presente)$/i;

// Strip inline Markdown to plain text: **bold** -> bold, [t](url) -> t.
function stripInline(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .trim();
}

// Render section lines to plain text: paragraphs separated by blank lines,
// bullets prefixed with "• ". Skips any "### " subheadings passed in.
function renderPlain(lines) {
  const out = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) {
      out.push(stripInline(paragraph.join(" ")));
      paragraph = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("### ") || line.startsWith("#### ")) continue;
    if (line.startsWith("- ")) {
      flush();
      out.push("• " + stripInline(line.slice(2)));
      continue;
    }
    paragraph.push(line);
  }
  flush();
  // Join: bullets stay on their own lines; paragraphs separated by blank line.
  return out
    .map((block, i) => {
      const prev = out[i - 1];
      const isBullet = block.startsWith("• ");
      const prevBullet = prev && prev.startsWith("• ");
      const sep = i === 0 ? "" : isBullet && prevBullet ? "\n" : "\n\n";
      return sep + block;
    })
    .join("");
}

function findSection(sections, slugSet) {
  return sections.find((s) => slugSet.has(slugify(s.title)));
}

// "Micromed Health - Florianopolis, Brazil - Jan 2026 to Present"
function parseMeta(metaLine) {
  const parts = stripInline(metaLine)
    .split(" - ")
    .map((p) => p.trim())
    .filter(Boolean);
  const company = parts[0] || "";
  const dateRange = parts.length >= 2 ? parts[parts.length - 1] : "";
  const location = parts.length >= 3 ? parts.slice(1, -1).join(" - ") : "";
  const range = parseDateRange(dateRange);
  return { company, location, dateRange, ...range };
}

// "Jan 2026 to Present" / "May 2022 to Jul 2026" / "Jan 2015 a Mar 2018"
function parseDateRange(dateRange) {
  const split = dateRange.split(/\s+(?:to|a|até)\s+/i);
  const start = (split[0] || "").trim();
  const endRaw = (split[1] || "").trim();
  const current = PRESENT.test(endRaw) || endRaw === "";
  return { start, end: current ? null : endRaw, current };
}

function parsePositions(experienceSection) {
  if (!experienceSection) return [];
  const lines = experienceSection.content;
  const positions = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      if (cur) positions.push(cur);
      cur = { title: stripInline(line.slice(4)), _block: [] };
      continue;
    }
    if (cur) cur._block.push(line);
  }
  if (cur) positions.push(cur);

  return positions.map((p) => {
    const block = p._block;
    const firstIdx = block.findIndex((l) => l.trim());
    const metaLine = firstIdx >= 0 ? block[firstIdx] : "";
    const rest = firstIdx >= 0 ? block.slice(firstIdx + 1) : [];
    const meta = parseMeta(metaLine);
    const description = clamp(renderPlain(rest), LIMITS.positionDescription);
    return {
      title: p.title,
      company: meta.company,
      location: meta.location,
      dateRange: meta.dateRange,
      start: meta.start,
      end: meta.end,
      current: meta.current,
      description: description.text,
      descriptionTruncated: description.truncated,
    };
  });
}

function clamp(text, max) {
  if (text.length <= max) return { text, truncated: false };
  // Cut on a word boundary just under the limit, add an ellipsis.
  const slice = text.slice(0, max - 1);
  const cut = slice.slice(0, slice.lastIndexOf(" ") > max * 0.6 ? slice.lastIndexOf(" ") : slice.length);
  return { text: cut.trimEnd() + "…", truncated: true };
}

function buildContent(lang) {
  const file = SOURCES[lang];
  if (!file || !fs.existsSync(file)) {
    throw new Error(`Unknown or missing source for lang "${lang}"`);
  }
  const markdown = fs.readFileSync(file, "utf8");
  const { sections, introLines } = sectionize(markdown);
  const intro = parseIntro(introLines);

  const headline = clamp(stripInline(intro.subtitle), LIMITS.headline);

  const profile = findSection(sections, PROFILE_SLUGS);
  const howIBuild = findSection(sections, HOWIBUILD_SLUGS);
  const aboutParts = [];
  if (profile) aboutParts.push(renderPlain(profile.content));
  if (howIBuild) aboutParts.push(renderPlain(howIBuild.content));
  const about = clamp(aboutParts.filter(Boolean).join("\n\n"), LIMITS.about);

  const positions = parsePositions(findSection(sections, EXPERIENCE_SLUGS));

  const warnings = [];
  if (headline.truncated) warnings.push(`headline truncated to ${LIMITS.headline} chars`);
  if (about.truncated) warnings.push(`about truncated to ${LIMITS.about} chars`);
  positions.forEach((p) => {
    if (p.descriptionTruncated) warnings.push(`position "${p.title}" description truncated to ${LIMITS.positionDescription} chars`);
  });

  return {
    lang,
    headline: headline.text,
    about: about.text,
    positions: positions.map(({ descriptionTruncated, ...rest }) => rest),
    limits: LIMITS,
    warnings,
  };
}

module.exports = { buildContent, LIMITS };

// -- CLI --------------------------------------------------------------------
if (require.main === module) {
  const argv = process.argv.slice(2);
  const langArg = (() => {
    const i = argv.indexOf("--lang");
    return i >= 0 ? argv[i + 1] : null;
  })();

  const emit = (obj) => process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
  const warn = (content) => {
    if (content.warnings && content.warnings.length) {
      process.stderr.write(`[${content.lang}] warnings:\n  - ${content.warnings.join("\n  - ")}\n`);
    }
  };

  try {
    if (langArg) {
      const content = buildContent(langArg);
      warn(content);
      emit(content);
    } else {
      const en = buildContent("en");
      const pt = buildContent("pt");
      warn(en);
      warn(pt);
      emit({ en, pt });
    }
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}
