# Felipe R. Broering

Lead Engineer · AI Engineering

Florianópolis, SC, Brasil

- Email: hi@felipe.run
- LinkedIn: https://www.linkedin.com/in/felipebroering/
- GitHub: https://github.com/feliperun

## Perfil

Engenheiro e líder de engenharia com quase duas décadas construindo produtos digitais complexos de ponta a ponta: descoberta, modelagem de domínio, arquitetura, implementação e produção. Nos últimos anos venho reconstruindo *como esse trabalho é feito* com IA. Desenho os harnesses, guardrails e workflows de agentes que permitem um time entregar com coding agents em qualidade de produção: rápido, revisável e com accountability, não uma pilha de código gerado por IA em que ninguém confia.

Trabalho melhor onde produto e engenharia não se separam: fluxos complexos, sistemas operacionais, domínios regulados, plataformas cloud-native e automação que precisa se manter confiável em produção. Minha trajetória cobre engenharia full-stack, arquitetura de nuvem, gestão de produto e integração de hardware, em papéis de engenheiro de software, tech lead, CTO/fundador, engineering manager e head of engineering.

Liderei plataformas em operações críticas, incluindo o Coreum na Micromed, destacado pelo Google Cloud. Também construo ferramentas open-source, terminal-first, de IA: agentes nos trilhos, sistemas local-first e os harnesses de engenharia que mantêm mudanças assistidas por agentes prontas para produção.

## Engenharia de IA

Eu não só uso ferramentas de IA, eu construo a engenharia em volta delas. O princípio por trás de tudo que entrego, e o que eu traria para liderar um time AI-native: **regras primeiro, IA depois.** Coloque o modelo nos trilhos para que a velocidade nunca custe arquitetura, correção ou accountability. Na prática, isso significa:

- **Harness de entrega agêntica.** Playbooks `AGENTS.md` por repositório (com `CLAUDE.md` / `GEMINI.md` / `CURSOR.md` como symlinks), ADRs para cada decisão estrutural, TDD, quality gates estruturais e pre-commit + CI, para que os diffs escritos por agente fiquem pequenos, escopados, revisáveis e verdes. Nunca `--no-verify`: se um hook bloqueia, o problema de fundo é corrigido.
- **Skills reutilizáveis como primitivas de engenharia.** Construí uma biblioteca de skills (Figma-to-code, code review, validação de release, investigação de produção, automação de Linear/PR, sync de docs, planejamento técnico, enforcement de TDD) para que o trabalho recorrente vire um comando repetível e inspecionável, em vez de um prompt ad-hoc novo toda vez.
- **Loops autônomos de CI / merge.** Pipelines que abrem um PR, monitoram o CI, corrigem as falhas, aplicam sugestões dos bots de review e mergeiam no verde, para que humanos revisem *intenção e design* em vez de ficar de babá de checklist.
- **Orquestração multi-agente.** Workflows de fan-out/verificação e subagentes especializados para review, investigação e edições limitadas, com verificação adversarial antes de confiar em qualquer achado, porque uma resposta errada e confiante é o modo de falha caro.
- **Model-neutral por design.** Ferramental agnóstico de LLM entre Claude, Gemini e modelos locais, conectado via servidores MCP, para que o workflow sobreviva a qualquer provedor único ou mudança de preço.
- **Terminal-first, dentro do loop real.** Claude Code e Cursor CLI, prompts estruturados, harnesses locais e integrações MCP plugados direto no loop de dev e de feedback de produção, não uma janela de chat de lado.

A prova é open source: três produtos onde a engenharia de IA *é* o ponto, não uma demo. Veja abaixo.

## Estudo de Caso em Destaque

### Coreum no Google Cloud: escalando uma plataforma cloud-native

Publicado pelo Google Cloud: https://cloud.google.com/customers/micromed

Liderei o Coreum do zero até se tornar a plataforma cloud-native da Micromed: fluxos escaláveis, recursos de IA, integração com ERP e uma base de produção feita para releases rápidos e seguros (ela sustenta o diagnóstico cardiológico). O estudo de caso do Google Cloud reporta:

- Redução de 50%+ no custo de infraestrutura
- Carregamento 10x mais rápido, de 2 segundos para 200 milissegundos
- 20TB migrados com apenas 3 horas de downtime
- Múltiplos releases diários com zero downtime
- 10.000+ cargas processadas por dia

## Como Eu Construo

Encaro engenharia de produto como uma disciplina de ciclo completo. Meu loop preferido:

**Problema → Modelo de domínio → Comportamento do produto → Arquitetura → Implementação → Produção → Observabilidade → Iteração.**

Começo perto do problema real (usuários, fluxos, restrições de negócio, riscos operacionais, edge cases, critérios de sucesso), depois modelo o domínio, desenho o sistema, construo, coloco no ar, observo como ele se comporta em produção e realimento o que aprendo. A IA torna cada passada mais rápida; a disciplina é o que mantém tudo em nível de produção.

## Open Source

Construo no aberto: ferramentas terminal-first que colocam IA nos trilhos.

### phai · IA nos trilhos para finanças pessoais · Rust, local-first

Fundador e mantenedor do phai, um agente de finanças pessoais rules-first e LLM-neutral. As regras decidem; o modelo assiste, nunca o contrário. Ingere dados de open-finance (Pluggy), normaliza tudo em SQLite (local) ou BigQuery (produção) e transforma o extrato bancário em uma base de finanças consultável, scriptável e reportável, com integração MCP e um web app local embutido num binário Rust único.

Também serve de harness de referência para engenharia de IA: ADRs, TDD, CI, guardrails de privacidade, quality gates, automação de release e guardrails rígidos que mantêm mudanças assistidas por agentes revisáveis e prontas para produção.

Tecnologias: Rust, SQLite, BigQuery, Pluggy, MCP, React/LiveStore.

Projeto: https://github.com/feliperun/phai

### cueme · second brain local-first com copilot de conversa ao vivo · Swift nativo, macOS

Um produto de conhecimento pessoal file-first para macOS: edição em blocos estilo Notion sobre arquivos Markdown puros. Cada nota é uma pasta normal no disco; SQLite, FTS5 e embeddings `sqlite-vec` são índices reconstruíveis, nunca a fonte da verdade. Notas escritas, journals, reuniões gravadas e áudio importado compartilham um único modelo de memória com busca híbrida local.

Sobre essa memória roda um copilot de conversa em tempo real para reuniões e conversas difíceis. Captura os dois lados de uma call de forma nativa (mic via `AVAudioEngine` + áudio do sistema via `ScreenCaptureKit`, então quem falou é sabido pela origem, sem diarização), transcreve e traduz on-device, e faz streaming de cards de orientação ao vivo e ata incremental a partir de um processo de agente aquecido em ~1-2s, ancorado nas suas próprias notas via retrieval semântico local. 100% Swift 6 nativo, sem webview, sem driver de áudio virtual; Swift Concurrency em toda parte (actors para estado compartilhado, fan-out via `AsyncStream`, cancelamento cooperativo), mais um watchdog de calls longas e failover automático de provedor. O "cérebro" chama o Claude Code CLI local: keyless por padrão, nada para configurar, nenhuma chave para vazar.

Tecnologias: Swift 6, Claude Code CLI, ScreenCaptureKit, Deepgram / STT on-device da Apple, sqlite-vec.

Projeto: https://github.com/feliperun/cueme

### ford / create-openclaw-agent · agente autônomo, deploy com hardening · IaC + GCP

Um comando que provisiona um agente de IA self-hosted em nível de produção (OpenClaw) na nuvem: um gateway em Claude Sonnet com memória persistente Mem0 (vetores no Qdrant), um Chrome headless, transcrição de áudio e um canal de WhatsApp, sobre infra Terraform/OpenTofu com defense-in-depth: sem IP externo (acesso só por IAP), firewall de egress, segredos no Secret Manager buscados para a RAM (nunca em disco), containers read-only com hardening (`cap_drop: ALL`, imagens pinadas por digest), backups criptografados com age e scanning de CI com gitleaks/Trivy. A instância que rodo em produção é o Ford, meu próprio assistente de WhatsApp always-on.

Tecnologias: OpenTofu, Google Cloud, Docker, Mem0/Qdrant, Claude, Secret Manager.

Projeto: https://github.com/feliperun/create-openclaw-agent

### Também

- **eai**: CLI em Rust que transforma linguagem natural em comandos de shell seguros por um fluxo inspecionar-confirmar-executar, multi-provedor (Ollama, Gemini, Groq, OpenAI). https://github.com/feliperun/eai
- **dsync**: CLI em Rust que mantém o Markdown como fonte da verdade local enquanto sincroniza documentos com Google Docs e Linear Docs. https://github.com/feliperun/dsync

## Experiência

### Senior Product Engineer

Micromed Health - Florianópolis, Brasil - Jan 2026 até o presente

Depois de três anos e meio liderando a engenharia, escolhi voltar ao trabalho profundamente hands-on: o jeito AI-native de construir que eu vinha dirigindo como líder é agora o que faço o dia inteiro. Construo o harness com que o time coda, enquanto entrego produto de ponta a ponta em descoberta, modelagem de domínio, arquitetura, implementação, validação, release e operação em produção.

- Desenhando e operando o harness de engenharia de IA do time: coding agents nos trilhos com prompts estruturados, skills reutilizáveis, ADRs, TDD, quality gates, code review e loops autônomos de CI/merge, mantendo a entrega assistida por agentes rápida *e* em nível de produção.
- Construindo skills de engenharia reutilizáveis (Figma-to-code, review de UX, modelagem de produto, planejamento técnico, code review, validação de release, investigação de produção, documentação e análise de dados) para que o trabalho recorrente rode como comandos repetíveis e inspecionáveis.
- Liderando iniciativas de engenharia de produto do Figma e do design à implementação, validação, release, observabilidade e iteração em produção.
- Construindo experiências web com React, Node.js e TypeScript entre frontend, backend, APIs, autenticação e fluxos de dados; Python para processamento de sinais de ECG; Rust como camada de integração nativa entre hardware médico, PCs locais e nuvem.
- Rodando um workflow de IA terminal-first e model-neutral (pi.dev, Claude CLI, Cursor CLI, MCP, ferramental local) conectado ao Superset e a feedback loops de produção.
- Trazendo experiência de liderança para direção técnica, trade-offs de produto, alinhamento de time e prontidão para produção, como builder sênior hands-on.

### Head of Engineering

Micromed Health - Florianópolis, Brasil - Mai 2022 a Dez 2025

Liderei a engenharia do Coreum, a plataforma cloud-native da Micromed para diagnóstico cardiológico, fluxos de exame, análise assistida por IA, integração com ERP, dispositivos conectados e operação em produção.

- Liderei o Coreum do desenvolvimento inicial até se tornar uma plataforma de estudo de caso do Google Cloud.
- Conduzi o programa de modernização por trás dos resultados do estudo de caso do Google Cloud acima: custo de infraestrutura, latência de carregamento de exames, a migração de 20TB e a virada para múltiplos releases diários com zero downtime.
- Estruturei processo e cultura de engenharia para suportar o crescimento do time, novos projetos, entrega mais rápida e operação mais confiável.
- Construí e evoluí práticas de engenharia em arquitetura, entrega, operação de nuvem, confiabilidade, segurança, desenvolvimento assistido por IA, disciplina de review e prontidão para produção.
- Liderei e apoiei times multidisciplinares em backend, frontend, UX, nuvem, firmware, eletrônica, QA, integrações e entrega de produto.
- Consolidei sistemas críticos no Google Cloud, incluindo ERP e Coreum, melhorando confiabilidade, segurança, velocidade de integração e eficiência operacional.
- Avancei o roadmap da Micromed para cardiologia com IA, dispositivos médicos conectados, nuvem híbrida, edge computing e interoperabilidade com padrões como DICOM, HL7 e FHIR.

### Engineering Manager

Micromed Health - Florianópolis, Brasil - Nov 2020 a Jun 2022

Entrei na Micromed para liderar a engenharia do zero de uma solução de monitoramento de pacientes internados, combinando aquisição de ECG, processamento em nuvem, algoritmos de machine learning e predição de risco cardíaco.

- Montei e liderei um time interno de sete pessoas (seis engenheiros e um designer de UX) responsáveis por core da plataforma, back ends, front ends, design system e infraestrutura de nuvem.
- Coordenei dez engenheiros terceiros entre microsserviços de IA, firmware e eletrônica, conectando data science, software embarcado, hardware e entrega de produto.
- Fui dono do design de sistema e liderei o desenvolvimento ponta a ponta em software, nuvem, integração de machine learning, integração de hardware e execução de produto.
- Conectei requisitos de produto, fluxos clínicos, decisões de arquitetura e planejamento de entrega em um modelo coerente de execução.

### Engineering Manager

Animati - Florianópolis, Brasil - Jun 2019 a Out 2020

Liderei o desenvolvimento do S.I.M., um sistema integrado de medicina diagnóstica e SaaS cloud-native feito para preencher lacunas de fluxo em RIS/PACS.

- Gerenciei o ciclo completo de desenvolvimento do produto, da descoberta e arquitetura à entrega para clientes.
- Montei um time do zero com UX e engenheiros full-stack em React, TypeScript, Python, Django REST, Node.js, Firebase e arquitetura serverless.
- Introduzi pensamento de design system, modelagem detalhada de UX, micro-frontends e padrões de nuvem que reduziam escala fora do horário de pico.
- Equilibrei arquitetura hands-on, liderança de time, execução de entrega e direção de produto.

### Product Manager: Saúde, depois Construção

Softplan - Florianópolis, Brasil - Mar 2018 a Mai 2019

- Conduzi a descoberta de produto para uma nova unidade de negócio de saúde, avaliando caminhos de build/buy/partner e apresentando opções estratégicas ao CEO; trabalhei com engenheiros de ML em um produto de BI para planos de saúde.
- Antes, gerenciei os módulos de CRM e comercial do Sienge, um ERP de construção usado em todo o Brasil: roadmap, canais de venda, grandes clientes e planejamento ágil.

### Chief Technology Officer & Fundador

Healfies - Florianópolis, Brasil - Jan 2015 a Mar 2018

Fundei e liderei a tecnologia de uma rede de saúde onde pessoas e organizações podiam organizar e compartilhar informações com segurança.

- Fui dono do design de sistema da plataforma, do roadmap de produto, da estratégia técnica e da formação do time do zero, liderando sete pessoas entre engenharia full-stack, UX e QA.
- Atuei hands-on em estratégia, design, testes, deploy e código com Node.js, MongoDB e AngularJS.
- Projetei e operei infraestrutura na AWS e no Google Cloud: microsserviços, armazenamento, functions, Kubernetes, gestão de custo e operação em produção.
- Liderei ETL e interoperabilidade clínica entre CIS, LIS, RIS, HIS e PACS via APIs REST.
- Vivi o ciclo completo de startup (descoberta, captação, contratação, entrega, operação, parcerias), ajudando a captar R$2,2M, conectar 23 centros de diagnóstico, entregar 2M de registros e cadastrar 10 mil usuários.

### Tech Lead

Chaordic - Florianópolis, Brasil - Jan 2014 a Mai 2015

Liderei a entrega e integração de uma plataforma de personalização para as maiores marcas de e-commerce do Brasil.

- Atuei como PM e líder técnico de oito engenheiros em JavaScript, UX/frontend e QA.
- Introduzi OKRs e uma função de technical account management, reduzindo o tempo de integração em 50% e o churn entre as principais contas.
- Trabalhei diretamente com grandes clientes, incluindo Walmart, Máquina de Vendas, Saraiva, Centauro e Nova.com.

### Product Manager

Pixeon Medical Systems - Florianópolis / São Paulo, Brasil - Out 2010 a Jan 2014

- Fui dono do portfólio de produtos LIS/RIS/PACS, traduzindo necessidades de mercado e vendas em roadmaps de engenharia.
- Conduzi o ciclo completo de seis novos produtos, da definição do problema ao registro na ANVISA, precificação e go-to-market, e ajudei a unificar portfólios na fusão Medical Systems / Pixeon.

### Full-stack Engineer

Pixeon Medical Systems - Brasil - Jan 2007 a Out 2010

- Construí um visualizador DICOM desktop para imagens de TC, RM, ultrassom e CR com C++, Qt e Java (Swing, J2EE), atuando em requisitos, backend e frontend sob Scrum e CI.

### Analista de Tecnologia da Informação

Tigre S.A. - Joinville, Brasil - Jul 2006 a Jan 2007

- Analista de TI em uma grande indústria, antes de migrar para produto e engenharia de software.

## Domínios

- Ferramentas de dev: CLIs, harnesses de agentes, IA nos trilhos
- E-commerce: personalização em escala
- Fintech: ferramentas de finanças pessoais
- Saúde: plataformas, imagem, diagnóstico
- ERP / SaaS: construção e diagnóstico
- Indústria: base inicial em TI

## Especialidades

Engenharia de IA, Workflows Agênticos & Orquestração Multi-Agente, Ferramental de LLM & MCP, Design de Prompts & Skills, Engenharia de Produto, Engenharia Full-Stack, Design de Sistemas, Arquitetura Cloud-Native, Ferramentas de Dev & CLIs, Sistemas Local-First, Release Engineering, Deploys sem Downtime, Liderança de Engenharia, Google Cloud, AWS, Interoperabilidade (DICOM / HL7 / FHIR), Sistemas com LGPD.

## Formação

Universidade do Vale do Itajaí: Bacharelado em Engenharia de Computação (engenharia de software, integração de hardware), 2001 a 2005.

## Idiomas

- Português: Nativo ou proficiência bilíngue
- Inglês: Proficiência profissional
- Espanhol: Proficiência básica a intermediária

## Hashtags

#AIEngineering #AgenticWorkflows #LLMTooling #MCP #ProductEngineering #FullStackEngineering #EngineeringLeadership #SoftwareArchitecture #CloudNative #OpenSource #DeveloperTools #Rust #TypeScript #React #NodeJS #GoogleCloud
