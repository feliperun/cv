# Felipe R. Broering

Lead Engineer · AI Engineering

Santa Catarina, Brazil

- Email: hi@felipe.run
- LinkedIn: https://www.linkedin.com/in/felipebroering/
- GitHub: https://github.com/feliperun

## Profile

Engineer and engineering leader with nearly two decades building complex digital products end to end — and, over the last few years, rebuilding *how that work gets done* with AI. I design the harnesses, guardrails, and agent workflows that let a team ship with coding agents at production quality: fast, reviewable, and accountable — not a pile of AI-generated code nobody trusts.

I work best where product and engineering can't be separated: complex workflows, operational systems, regulated domains, cloud-native platforms, and automation that has to stay reliable in production. My background spans full-stack engineering, cloud architecture, product management, and hardware integration — as software engineer, tech lead, CTO/founder, engineering manager, and head of engineering.

I've led platforms in critical operations — including Coreum at Micromed, featured by Google Cloud — and I build open-source, terminal-first AI tooling: agents on rails, local-first systems, and the engineering harnesses that keep agent-assisted changes production-ready.

## AI Engineering

I don't just use AI tools — I engineer the system around them. The principle behind everything I ship, and what I'd bring to leading an AI-native team: **rules first, AI second.** Put the model on rails so velocity never costs you architecture, correctness, or accountability. Concretely, that means:

- **Agentic delivery harness.** Per-repo `AGENTS.md` playbooks (with `CLAUDE.md` / `GEMINI.md` / `CURSOR.md` as symlinks), ADRs for every structural decision, TDD, structural quality gates, and pre-commit + CI — so agent-written diffs stay small, scoped, reviewable, and green. Never `--no-verify`: if a hook blocks, the underlying issue gets fixed.
- **Reusable skills as engineering primitives.** I've built a library of skills — Figma-to-code, code review, release validation, production investigation, Linear/PR automation, doc sync, technical planning, TDD enforcement — so recurring work becomes one repeatable, inspectable command instead of a fresh ad-hoc prompt every time.
- **Autonomous CI / merge loops.** Pipelines that open a PR, watch CI, fix the failures, apply review-bot suggestions, and merge on green — so humans review *intent and design*, not babysit a checklist.
- **Multi-agent orchestration.** Fan-out/verify workflows and specialized subagents for review, investigation, and bounded edits, with adversarial verification before any finding is trusted — because a confident wrong answer is the expensive failure mode.
- **Model-neutral by design.** LLM-agnostic tooling across Claude, Gemini, and local models, wired through MCP servers, so the workflow outlives any single provider or price change.
- **Terminal-first, in the real loop.** Claude Code and Cursor CLI, structured prompts, local harnesses, and MCP integrations plugged straight into the dev and production feedback loop — not a chat window off to the side.

The proof is open source: three products where the AI engineering *is* the point, not a demo — below.

## Featured Case Study

### Coreum on Google Cloud: scaling a cloud-native platform

Published by Google Cloud: https://cloud.google.com/customers/micromed

Led Coreum from zero into Micromed's cloud-native platform — scalable workflows, AI features, ERP integration, and a production foundation built for fast, safe releases (it powers cardiology diagnostics). The Google Cloud case study reports:

- 50%+ infrastructure cost reduction
- 10x faster load times, from 2 seconds to 200 milliseconds
- 20TB migrated with only 3 hours of downtime
- Multiple daily releases with zero downtime
- 10,000+ workloads processed per day

## How I Build

I treat product engineering as a full-cycle discipline. My preferred loop:

**Problem → Domain model → Product behavior → Architecture → Implementation → Production → Observability → Iteration.**

I start close to the real problem — users, workflows, business constraints, operational risks, edge cases, success criteria — then model the domain, design the system, build it, ship it, watch how it behaves in production, and feed what I learn back in. AI makes each pass faster; the discipline is what keeps it production-grade.

## Open Source

I build in the open — terminal-first tools that put AI on rails.

### phai — AI on rails for personal finance · Rust, local-first

Founder and maintainer of phai, a rules-first, LLM-neutral personal-finance agent. Rules decide; the model assists — never the other way around. It ingests open-finance data (Pluggy), normalizes everything into SQLite (local) or BigQuery (production), and turns a bank feed into a queryable, scriptable, reportable finance database with MCP integration and a local web app embedded in a single Rust binary.

It doubles as a reference AI-engineering harness — ADRs, TDD, CI, privacy guardrails, quality gates, release automation, and strict guardrails that keep agent-assisted changes reviewable and production-ready.

Technologies: Rust, SQLite, BigQuery, Pluggy, MCP, React/LiveStore.

Project: https://github.com/feliperun/phai

### cueme — local-first second brain with a live conversation copilot · native Swift, macOS

A file-first personal knowledge product for macOS: Notion-style block editing over plain Markdown files. Every note is a normal folder on disk — SQLite, FTS5, and `sqlite-vec` embeddings are rebuildable indexes, never the source of truth. Written notes, journals, recorded meetings, and imported audio share one memory model with local hybrid search.

On top of that memory sits a real-time conversation copilot for meetings and hard conversations. It captures both sides of a call natively (mic via `AVAudioEngine` + system audio via `ScreenCaptureKit`, so who spoke is known by origin — no diarization), transcribes and translates on-device, and streams live guidance cards and incremental meeting minutes from a warm agent process in ~1–2s — grounded in your own notes via local semantic retrieval. 100% native Swift 6, no webview, no virtual audio driver; Swift Concurrency throughout — actors for shared state, `AsyncStream` fan-out, cooperative cancellation — plus a long-call watchdog and automatic provider failover. The "brain" shells out to the local Claude Code CLI: keyless by default, nothing to configure, no key to leak.

Technologies: Swift 6, Claude Code CLI, ScreenCaptureKit, Deepgram / Apple on-device STT, sqlite-vec.

Project: https://github.com/feliperun/cueme

### ford / create-openclaw-agent — autonomous agent, hardened cloud deploy · IaC + GCP

One command that provisions a production-grade, self-hosted AI agent (OpenClaw) to the cloud: a gateway on Claude Sonnet with Mem0 persistent memory (Qdrant vectors), a headless Chrome browser, audio transcription, and a WhatsApp channel — on Terraform/OpenTofu infrastructure with defense-in-depth: no external IP (IAP-only access), egress firewall, secrets in Secret Manager fetched into RAM (never on disk), read-only hardened containers (`cap_drop: ALL`, images pinned by digest), age-encrypted backups, and gitleaks/Trivy CI scanning. The instance I run in production is Ford — my own always-on WhatsApp assistant.

Technologies: OpenTofu, Google Cloud, Docker, Mem0/Qdrant, Claude, Secret Manager.

Project: https://github.com/feliperun/create-openclaw-agent

### Also

- **eai** — Rust CLI that turns natural language into safe shell commands through an inspect-confirm-run flow, multi-provider (Ollama, Gemini, Groq, OpenAI). https://github.com/feliperun/eai
- **dsync** — Rust CLI that keeps Markdown as the local source of truth while syncing documents with Google Docs and Linear Docs. https://github.com/feliperun/dsync

## Experience

### Senior Product Engineer

Micromed Health - Florianopolis, Brazil - Jan 2026 to Present

After three and a half years leading engineering, I chose to return to deep hands-on work — the AI-native way of building I'd been driving as a leader is now what I do all day. I build the harness the team codes with, while shipping product end to end across discovery, domain modeling, architecture, implementation, validation, release, and production operations.

- Designing and operating the team's AI engineering harness: coding agents on rails with structured prompts, reusable skills, ADRs, TDD, quality gates, code review, and autonomous CI/merge loops — keeping agent-assisted delivery fast *and* production-grade.
- Building reusable engineering skills — Figma-to-code, UX review, product modeling, technical planning, code review, release validation, production investigation, documentation, and data analysis — so recurring work runs as repeatable, inspectable commands.
- Leading product engineering initiatives from Figma and product design through implementation, validation, release, observability, and production iteration.
- Building web experiences with React, Node.js, and TypeScript across frontend, backend, APIs, authentication, and data workflows; Python for ECG signal-processing; Rust as the native integration layer between medical hardware, local PCs, and cloud.
- Running a terminal-first, model-neutral AI workflow (pi.dev, Claude CLI, Cursor CLI, MCP, local tooling) wired into Superset and production feedback loops.
- Bringing leadership experience into technical direction, product trade-offs, team alignment, and production readiness — as a senior hands-on builder.

### Head of Engineering

Micromed Health - Florianopolis, Brazil - May 2022 to Dec 2025

Led engineering for Coreum, Micromed's cloud-native platform for cardiology diagnostics, exam workflows, AI-assisted analysis, ERP integration, connected devices, and production operations.

- Led Coreum from early product development into a Google Cloud customer case study platform.
- Drove the modernization program behind the Google Cloud case study results above — infrastructure cost, exam loading latency, the 20TB migration, and the move to multiple daily zero-downtime releases.
- Structured engineering process and culture to support team growth, new projects, faster delivery, and more reliable production operations.
- Built and evolved engineering practices around architecture, delivery, cloud operations, reliability, security, AI-assisted development, review discipline, and production readiness.
- Led and supported multidisciplinary teams across backend, frontend, UX, cloud, firmware, electronics, QA, integrations, and product delivery.
- Consolidated critical systems on Google Cloud, including ERP and Coreum, improving reliability, security, integration speed, and operational efficiency.
- Advanced Micromed's roadmap for AI-powered cardiology, connected medical devices, hybrid cloud, edge computing, and interoperability with standards such as DICOM, HL7, and FHIR.

### Engineering Manager

Micromed Health - Florianopolis, Brazil - Nov 2020 to Jun 2022

Joined Micromed to lead engineering from scratch for an inpatient monitoring solution combining ECG acquisition, cloud processing, machine learning algorithms, and cardiac risk prediction.

- Built and led an internal team of seven — six engineers and one UX designer — responsible for platform core, back ends, front ends, design system, and cloud infrastructure.
- Coordinated ten third-party engineers across AI microservices, firmware, and electronics, connecting data science, embedded software, hardware, and product delivery.
- Owned system design and led end-to-end development across software, cloud, machine learning integration, hardware integration, and product execution.
- Connected product requirements, clinical workflows, architecture decisions, and delivery planning into a coherent execution model.

### Engineering Manager

Animati - Florianopolis, Brazil - Jun 2019 to Oct 2020

Led development of S.I.M., an integrated diagnostic medicine system and cloud-native SaaS designed to fill RIS/PACS workflow gaps.

- Managed the full product development cycle from problem discovery and software architecture to customer delivery.
- Built a team from scratch with UX and full-stack engineers working with React, TypeScript, Python, Django REST, Node.js, Firebase, and serverless architecture.
- Introduced design-system thinking, detailed UX modeling, micro-frontends, and cost-efficient cloud patterns that could scale down during off-hours.
- Balanced hands-on architecture, team leadership, delivery execution, and product direction.

### Product Manager — Healthcare, then Construction

Softplan - Florianopolis, Brazil - Mar 2018 to May 2019

- Led product discovery for a new healthcare business unit, evaluating build/buy/partner paths and presenting strategic options to the CEO; worked with ML engineers on a health-insurance BI product.
- Earlier, managed CRM and commercial modules for Sienge, a construction ERP used across Brazil — roadmap, sales channels, large customers, and agile planning.

### Chief Technology Officer & Founder

Healfies - Florianopolis, Brazil - Jan 2015 to Mar 2018

Founded and led technology for a healthcare network where people and organizations could securely organize and share information.

- Owned platform system design, product roadmap, technical strategy, and team building from scratch — leading seven people across full-stack engineering, UX, and QA.
- Worked hands-on across strategy, design, testing, deployment, and coding with Node.js, MongoDB, and AngularJS.
- Designed and operated AWS and Google Cloud infrastructure: microservices, storage, functions, Kubernetes, cost management, and production operations.
- Led ETL and clinical interoperability across CIS, LIS, RIS, HIS, and PACS via REST APIs.
- Lived the full startup cycle — discovery, fundraising, hiring, delivery, operations, partnerships — helping raise R$2.2M, connect 23 diagnostic centers, deliver 2M records, and register 10K users.

### Tech Lead

Chaordic - Florianopolis, Brazil - Jan 2014 to May 2015

Led delivery and integration of a personalization platform for major Brazilian e-commerce brands.

- Acted as PM and technical lead for eight engineers across JavaScript, UX/frontend, and QA.
- Introduced OKRs and a technical account management function, cutting integration time by 50% and reducing churn among top accounts.
- Worked directly with major customers including Walmart, Máquina de Vendas, Saraiva, Centauro, and Nova.com.

### Product Manager

Pixeon Medical Systems - Florianopolis / Sao Paulo, Brazil - Oct 2010 to Jan 2014

- Owned the LIS/RIS/PACS product portfolio, translating market and sales needs into engineering roadmaps.
- Led the full cycle for six new products — from problem definition through ANVISA registration, pricing, and go-to-market — and helped unify portfolios through the Medical Systems / Pixeon merger.

### Full-stack Engineer

Pixeon Medical Systems - Brazil - Jan 2007 to Oct 2010

- Built a desktop DICOM viewer for CT, MRI, ultrasound, and CR imaging with C++, Qt, and Java (Swing, J2EE), working across requirements, backend, and frontend under Scrum and CI.

### Information Technology Analyst

Tigre S.A. - Joinville, Brazil - Jul 2006 to Jan 2007

- IT analyst at a large industrial manufacturer, before moving into product and software engineering.

## Domains

- Developer tools — CLIs, agent harnesses, AI on rails
- E-commerce — personalization at scale
- Fintech — personal finance tooling
- Healthcare — platforms, imaging, diagnostics
- ERP / SaaS — construction and diagnostics
- Industrial — early IT foundations

## Expertise

AI Engineering, Agentic Workflows & Multi-Agent Orchestration, LLM Tooling & MCP, Prompt & Skill Design, Product Engineering, Full-Stack Engineering, System Design, Cloud-Native Architecture, Developer Tools & CLIs, Local-First Systems, Release Engineering, Zero-downtime Deployments, Engineering Leadership, Google Cloud, AWS, Interoperability (DICOM / HL7 / FHIR), LGPD-aware Systems.

## Education

Universidade do Vale do Itajaí — BS in Computer Engineering (software engineering, hardware integration) — 2001 to 2005.

## Languages

- Portuguese — Native or bilingual proficiency
- English — Professional working proficiency
- Spanish — Basic to intermediate proficiency

## Hashtags

#AIEngineering #AgenticWorkflows #LLMTooling #MCP #ProductEngineering #FullStackEngineering #EngineeringLeadership #SoftwareArchitecture #CloudNative #OpenSource #DeveloperTools #Rust #TypeScript #React #NodeJS #GoogleCloud
