# Felipe R. Broering

Senior Product Engineer · Applied AI

Florianópolis, SC, Brazil

- Email: hi@felipe.run
- LinkedIn: https://www.linkedin.com/in/felipebroering/
- GitHub: https://github.com/feliperun

## Profile

Senior engineer with nearly 20 years shipping products from discovery to production, most of them in healthcare, where software has to be reliable and auditable. Today I build LLM agents that run in production, including an internal assistant used by 43 people across six teams. I work agent-first: on a proof of concept for a Class II medical device, coding agents check the product's 170 regulatory requirements before every change and stop on any conflict instead of trading one away. In 2026 I merged 565 pull requests across 35 repositories in Rust, TypeScript and Python, with most of the code written by agents under tests and CI.

Before returning to hands-on work I was a founder, CTO and Head of Engineering. I led Coreum at Micromed, featured in a [Google Cloud customer case study](https://cloud.google.com/customers/micromed): over 50% lower infrastructure costs, exam loading from 2 s to 200 ms, and 20 TB migrated with 3 hours of downtime.

## Selected Open Source

### expert-agent · Grounded specialist agents as an API

Created a framework for declarative specialist agents: a system prompt, a document corpus and a YAML schema become a Cloud Run API with grounded answers, citations, and session and long-term memory. Uses Gemini long context with Context Cache and ships a Python CLI for scaffolding, validation, sync and E2E tests. Powered Micromed's first four expert agents before they moved to in-process RAG inside Maia.

**Python · FastAPI · Gemini · Cloud Run** · [github.com/feliperun/expert-agent](https://github.com/feliperun/expert-agent)

### Bone Age · Medical imaging inference in the browser

Built a bilingual app that runs an existing bone-age model entirely in the browser, with DICOM support, image preparation and local PDF reports. Ported the three-model ensemble by ianpan from PyTorch to ONNX, with numerical parity checks; patient images stay on the device. Experimental engineering project, not clinically validated.

**TypeScript · Python · ONNX Runtime Web · WebAssembly** · [bone-age.app](https://bone-age.app) · [Source](https://github.com/feliperun/bone-age)

### Faberun · Verified delivery with coding agents

Created a runtime that turns implementation plans into durable task graphs with dependencies, isolated Git worktrees, retries and integration gates. Combines deterministic checks with independent review across model vendors; records usage and cost per invocation. Campaigns resume across sessions and coding harnesses, including Claude Code and Codex.

**JavaScript / Node.js · Git · CLI orchestration** · [github.com/feliperun/faberun](https://github.com/feliperun/faberun)

### agent-belt · Voice and hardware for agent workflows

Built a native macOS daemon connecting a programmable HID keypad, push-to-talk transcription and coding-agent sessions. Prioritizes agents waiting for a decision, shows session cost and status, and launches local or remote agents by voice. Includes tooling for isolated worktrees and tmux sessions across machines.

**Zig · macOS APIs · Deepgram · tmux** · [github.com/feliperun/agent-belt](https://github.com/feliperun/agent-belt)

Other projects: [md.html](https://github.com/feliperun/md.html), portable self-contained Markdown documents in Rust; [phai](https://github.com/feliperun/phai), a Rust personal-finance agent; [cueme](https://github.com/feliperun/cueme), a native Swift conversation copilot; [create-openclaw-agent](https://github.com/feliperun/create-openclaw-agent), cloud deployment for a self-hosted assistant. All built in 2026, mostly as hands-on learning; still early and evolving.

## Experience

### Senior Product Engineer

Micromed Health - Florianópolis, Brazil - Jan 2026 to Present

- Built and run Maia, an internal LLM agent in Slack (TypeScript, Mastra, Gemini, Cloud Run): tool calling against billing and ERP APIs, RAG over four curated knowledge bases (~420 documents, pgvector) and human approval for sensitive actions. Replaced four always-on expert microservices with in-process RAG to cut cost. In 16 weeks, 43 people across six teams asked 1,100+ questions; 70% came back in a later week.
- Main contributor to Coreum's Rust edge runtime and its DICOM/HL7/FHIR interoperability agent, which connect medical devices and legacy desktop apps in clinics to the cloud.
- Clinical AI: led the postmortem and fix for duplicate processing in the ECG AI classifier (Pub/Sub redelivery, ~2x cost) and implemented the Peguero-Lo Presti LVH criterion in the ECG inference service.

### Head of Engineering

Micromed Health - Florianópolis, Brazil - May 2022 to Dec 2025

Led Coreum and teams across software, UX, cloud, firmware, electronics and QA through the modernization documented by Google Cloud: multiple daily releases without downtime, 10,000+ exams per day.

### Engineering Manager

Micromed Health - Florianópolis, Brazil - Nov 2020 to Apr 2022

Built a team of seven and coordinated ten contractors on an inpatient ECG monitoring platform.

### Engineering Manager

Animati - Florianópolis, Brazil - Jun 2019 to Oct 2020

Built the team and led S.I.M., a diagnostic-medicine SaaS, from discovery and architecture to customer delivery using React, TypeScript, Python and serverless infrastructure.

### Product Manager

Softplan - Florianópolis, Brazil - Mar 2018 to May 2019

Led discovery for a new healthcare business unit and an ML-based BI product for health insurers; owned Sienge's CRM roadmap.

### CTO & Founder

Healfies - Florianópolis, Brazil - Jan 2015 to Mar 2018

Built the platform and a team of seven; helped raise ~US$650k and connect 23 diagnostic centers, delivering 2M records to 10,000 users.

### Tech Lead

Chaordic - Florianópolis, Brazil - Jan 2014 to May 2015

Led eight engineers delivering e-commerce personalization for clients including Walmart and Saraiva; cut integration time by 50%.

### Product Manager

Pixeon Medical Systems - Brazil - Oct 2010 to Jan 2014

Owned the LIS/RIS/PACS portfolio and launched six products, from discovery through ANVISA registration and go-to-market.

### Full-stack Engineer

Pixeon Medical Systems - Brazil - Jan 2007 to Oct 2010

Built a desktop DICOM viewer for CT, MRI and ultrasound with C++, Qt and Java.

## Expertise

LLM agents & tool calling, RAG / pgvector, Agentic coding workflows, TypeScript / React / Node.js, Rust, Python, System design, Product engineering, Google Cloud / AWS, CI/CD, DICOM / HL7 / FHIR, Technical leadership

## Education

BS in Computer Engineering · Universidade do Vale do Itajaí · 2001–2005.

## Languages

Portuguese: native · English: professional working proficiency · Spanish: basic to intermediate.
