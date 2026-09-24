# Felipe R. Broering

Senior Product Engineer · Applied AI

Florianópolis, SC, Brasil

- Email: hi@felipe.run
- LinkedIn: https://www.linkedin.com/in/felipebroering/
- GitHub: https://github.com/feliperun

## Perfil

Engenheiro sênior com quase 20 anos levando produtos da descoberta à produção, a maioria em saúde, onde software precisa ser confiável e auditável. Hoje construo agentes com LLMs que rodam em produção, incluindo um assistente interno usado por 43 pessoas de seis áreas. Na prova de conceito de um dispositivo médico classe II, meus coding agents consultam os 170 requisitos regulatórios do produto antes de cada mudança e param em qualquer conflito, sem abrir mão de nenhum. Em 2026, mergeei 565 pull requests em 35 repositórios em Rust, TypeScript e Python, a maior parte escrita por agentes, sob testes e CI.

Antes de voltar ao trabalho hands-on, fui fundador, CTO e Head of Engineering. Liderei o Coreum na Micromed, destaque em um [case do Google Cloud](https://cloud.google.com/customers/micromed): redução de mais de 50% no custo de infraestrutura, carregamento de exames de 2 s para 200 ms e migração de 20 TB com 3 horas de indisponibilidade.

## Open Source em Destaque

### expert-agent · Agentes especialistas com base documental, como API

Criei um framework de agentes especialistas declarativos: prompt, corpus de documentos e schema YAML viram uma API no Cloud Run com respostas fundamentadas, citações e memória. Usa o contexto longo do Gemini com Context Cache e tem uma CLI em Python para scaffolding, validação, sync e testes E2E. Foi a base dos quatro primeiros especialistas da Micromed, antes de virarem RAG local na Maia.

**Python · FastAPI · Gemini · Cloud Run** · [github.com/feliperun/expert-agent](https://github.com/feliperun/expert-agent)

### Bone Age · Inferência de imagem médica no navegador

Construí um app bilíngue que executa um modelo existente de idade óssea no navegador, com suporte a DICOM, preparo da imagem e relatórios PDF locais. Adaptei o ensemble de três modelos de ianpan de PyTorch para ONNX, com verificação de paridade numérica; as imagens permanecem no dispositivo. Projeto experimental de engenharia, sem validação clínica.

**TypeScript · Python · ONNX Runtime Web · WebAssembly** · [bone-age.app](https://bone-age.app) · [Código](https://github.com/feliperun/bone-age)

### Faberun · Entrega verificada com coding agents

Criei um runtime que transforma planos de implementação em grafos persistentes de tarefas, com dependências, worktrees Git isoladas, retentativas e verificações de integração. Combina testes determinísticos com revisão independente entre provedores de modelos e registra uso e custo por execução. Retoma campanhas entre sessões e ferramentas, incluindo Claude Code e Codex.

**JavaScript / Node.js · Git · Orquestração por CLI** · [github.com/feliperun/faberun](https://github.com/feliperun/faberun)

### agent-belt · Voz e hardware no trabalho com agentes

Construí um daemon nativo para macOS que conecta um teclado HID programável, transcrição por voz e sessões de coding agents. Prioriza agentes aguardando decisão, exibe custo e estado das sessões e inicia agentes locais ou remotos por voz. Inclui ferramentas para worktrees isoladas e sessões tmux entre máquinas.

**Zig · APIs do macOS · Deepgram · tmux** · [github.com/feliperun/agent-belt](https://github.com/feliperun/agent-belt)

Outros projetos: [md.html](https://github.com/feliperun/md.html), documentos Markdown portáteis e auto-contidos em Rust; [phai](https://github.com/feliperun/phai), agente de finanças pessoais em Rust; [cueme](https://github.com/feliperun/cueme), copilot de conversas em Swift nativo; [create-openclaw-agent](https://github.com/feliperun/create-openclaw-agent), deploy em nuvem de um assistente self-hosted. Todos criados em 2026, a maioria como aprendizado prático; ainda em estágio inicial e em evolução.

## Experiência

### Senior Product Engineer

Micromed Health - Florianópolis, Brasil - Jan 2026 até o presente

- Construí e opero a Maia, agente de LLM interno no Slack (TypeScript, Mastra, Gemini, Cloud Run): tool calling sobre APIs de billing e ERP, RAG em quatro bases de conhecimento curadas (~420 documentos, pgvector) e aprovação humana para ações sensíveis. Troquei quatro microsserviços sempre ligados por RAG local para reduzir custo. Em 16 semanas, 43 pessoas de seis áreas fizeram mais de 1.100 perguntas; 70% voltaram em outra semana.
- Principal contribuidor do runtime de borda do Coreum (Rust) e do agente de interoperabilidade DICOM/HL7/FHIR, que ligam dispositivos médicos e apps legados das clínicas à nuvem.
- IA clínica: conduzi o postmortem e a correção de reprocessamento no classificador de ECG por IA (redelivery do Pub/Sub, ~2x de custo) e implementei o critério de Peguero-Lo Presti para HVE no serviço de inferência de ECG.

### Head of Engineering

Micromed Health - Florianópolis, Brasil - Mai 2022 a Dez 2025

Liderei o Coreum e times de software, UX, nuvem, firmware, eletrônica e QA na modernização documentada pelo Google Cloud: múltiplos releases diários sem downtime, mais de 10 mil exames por dia.

### Engineering Manager

Micromed Health - Florianópolis, Brasil - Nov 2020 a Abr 2022

Montei um time de sete pessoas e coordenei dez engenheiros externos numa plataforma de monitoramento hospitalar de ECG.

### Engineering Manager

Animati - Florianópolis, Brasil - Jun 2019 a Out 2020

Montei o time e liderei o S.I.M., SaaS de medicina diagnóstica, da descoberta e arquitetura à entrega para clientes, com React, TypeScript, Python e infraestrutura serverless.

### Product Manager

Softplan - Florianópolis, Brasil - Mar 2018 a Mai 2019

Liderei a descoberta de uma nova unidade de saúde e de um BI com ML para operadoras; antes, cuidei do roadmap de CRM do Sienge.

### CTO & Fundador

Healfies - Florianópolis, Brasil - Jan 2015 a Mar 2018

Construí a plataforma e um time de sete pessoas; ajudei a captar R$2,2M e conectar 23 centros diagnósticos, entregando 2M de registros a 10 mil usuários.

### Tech Lead

Chaordic - Florianópolis, Brasil - Jan 2014 a Mai 2015

Liderei oito engenheiros em personalização de e-commerce para clientes como Walmart e Saraiva; reduzi o tempo de integração em 50%.

### Product Manager

Pixeon Medical Systems - Brasil - Out 2010 a Jan 2014

Gerenciei o portfólio LIS/RIS/PACS e lancei seis produtos, da descoberta ao registro na ANVISA e go-to-market.

### Full-stack Engineer

Pixeon Medical Systems - Brasil - Jan 2007 a Out 2010

Desenvolvi um visualizador DICOM desktop para TC, RM e ultrassom com C++, Qt e Java.

## Especialidades

Agentes com LLM e tool calling, RAG / pgvector, Workflows com coding agents, TypeScript / React / Node.js, Rust, Python, Design de sistemas, Engenharia de produto, Google Cloud / AWS, CI/CD, DICOM / HL7 / FHIR, Liderança técnica

## Formação

Bacharelado em Engenharia de Computação · Universidade do Vale do Itajaí · 2001–2005.

## Idiomas

Português: nativo · Inglês: proficiência profissional · Espanhol: básico a intermediário.
