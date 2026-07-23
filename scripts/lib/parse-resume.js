"use strict";

/**
 * Shared, HTML-agnostic structural parser for the resume Markdown sources.
 *
 * Both the HTML generator (scripts/generate-resume.js) and the LinkedIn
 * content exporter (scripts/linkedin-content.js) parse the same
 * README.md / README.pt-BR.md through these functions, so the section
 * structure stays identical across outputs.
 *
 * These functions only split Markdown into structure (title, intro, sections
 * as raw lines). Turning lines into HTML or plain text is the caller's job.
 */

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Split the document into { title, introLines, sections:[{title, content[]}] }.
function sectionize(markdown) {
  const lines = markdown.split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));
  const title = titleIndex >= 0 ? lines[titleIndex].slice(2).trim() : "Felipe R. Broering";
  const bodyLines = titleIndex >= 0 ? lines.slice(titleIndex + 1) : lines;
  const firstSection = bodyLines.findIndex((line) => line.startsWith("## "));
  const introLines = firstSection >= 0 ? bodyLines.slice(0, firstSection) : bodyLines;
  const sectionLines = firstSection >= 0 ? bodyLines.slice(firstSection) : [];
  const sections = [];

  for (let i = 0; i < sectionLines.length; i += 1) {
    if (!sectionLines[i].startsWith("## ")) continue;
    const sectionTitle = sectionLines[i].slice(3).trim();
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

// Intro block -> { subtitle, location, contact[] }.
function parseIntro(introLines) {
  const compact = introLines.filter((line) => line.trim());
  const nonBullet = compact.filter((line) => !line.startsWith("- "));
  const subtitle = nonBullet[0] || "";
  const location = nonBullet[1] || "";
  const contact = compact
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
  return { subtitle, location, contact };
}

module.exports = { slugify, sectionize, parseIntro };
