# PixelFandom — Agent Guide

## Stack
- **Next.js 15** (App Router, Turbopack), React 18, TypeScript 5
- **Supabase** (Postgres, Auth, RLS) — skills auto-loaded via `skills-lock.json`
- **shadcn/ui** (Radix primitives), **Tailwind CSS v3**, **Zustand**, **TipTap**
- **OpenRouter** + **Gemini** (dual LLM provider system — tenant-level hybrid)

## Commands
| Action | Command | Notes |
|--------|---------|-------|
| Dev server | `npm run dev` | Port **9002**, uses Turbopack |
| Build | `npm run build` | Sets `NODE_ENV=production` before `next build` |
| Docker | `docker compose up --build` | Sobe Next.js (9002) |
| Lint | `npm run lint` | `next lint` |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| No tests | — | Playwright in devDeps but no test script configured |

## Sistema adaptativo — zero exigência ao usuário

### Princípio fundamental
**O sistema se adapta ao usuário, nunca o contrário.** Em nenhum lugar do site o
usuário deve ser obrigado a saber inglês, slugs, underscores, formatos técnicos
ou qualquer convenção interna. Todo input é livre — o sistema resolve tradução,
slugificação, normalização, deduplicação, correção e persistência automaticamente.

### Onde se aplica

**Game Tables & Columns (Editor)**
- Nome de tabela: usuário digita em qualquer língua → `translateGameTerm()` +
  `ensure_game_table()` → slug English criado/adotado automaticamente.
- Nome de coluna: usuário digita em qualquer língua → `translateGameTerm()` +
  se coluna já existe → auto-usa; se não → `add_game_column()`.
- Sugestões de colunas existentes são filtradas dinamicamente contra as já
  usadas no formulário atual, evitando duplicatas.
- RPCs (`ensure_game_table`, `add_game_column`) sempre recebem slugs em inglês —
  a tradução acontece 100% no client, backend nunca vê texto original do usuário.

**Wiki pages (título, descrição, labels, slugs)**
- Título da página em qualquer idioma → slug automático via slugify + dedup.
- Descrições, labels e metadados são armazenados como o usuário digitou;
  apenas identificadores internos (slugs, chaves) são normalizados.
- Links entre páginas usam slugs gerados automaticamente a partir do título.

**Dashboard (configurações, labels, menus)**
- Nomes de seções, labels de abas, descrições de configuração aceitos em
  qualquer idioma. O sistema normaliza chaves internas.
- Nenhum campo exige formato específico (ex: "apenas letras minúsculas e
  underscores") — se o backend precisa de slug, o frontend gera.

**AI Chat (personalidade, persona, preferências)**
- Escolhas do usuário são sempre entre opções fechadas pré-definidas (nunca
  texto livre). O sistema adapta a montagem do prompt conforme a escolha.

**Em geral (todo o site)**
- Nenhum placeholder, label ou mensagem de erro deve instruir o usuário a
  digitar em formato técnico (ex: "use apenas letras minúsculas e underscore").
- Validações de formato (regex, tipo) são internas — o usuário vê apenas
  mensagens semanticas ("Este nome já existe", "Valor inválido").
- Toda criação de recurso passa por: tratar input → traduzir/normalizar →
  verificar existência → criar ou adotar → notificar.

### Implementação
- `translateGameTerm(text)` → `{ translated, slug }` em `src/lib/translate.ts`.
  Cache em memória (`Map`) por sessão de página.
- O backend (`/api/translate`) usa o endpoint público e gratuito do Google
  Translate via fetch direto — zero dependências, zero API key. Se falhar,
  fallback para slugify simples do input.
- Chamado em toda criação de tabela (`editor/page.tsx`), coluna
  (`data-table-content.tsx`), e deve ser chamado em qualquer novo ponto de
  criação de recurso nomeado pelo usuário.
- Cache de tradução vive apenas durante a sessão da página (não persiste).

## Build quirks
- `next.config.ts`: `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — build **will not catch** TS/ESLint errors. Rely on `npm run typecheck` and `npm run lint` separately.
- Recommended order: `lint -> typecheck -> build`
- Dev API proxy: routes under `/api/{token,rag,session,sessions,mood,goals,profile,profiles,settings,agents,wellington}` rewrite to `$PSYCHO_BACKEND_URL` (default `http://localhost:8000`)

## Structure
- `src/app/` route groups: `(marketing)/`, `(wiki)/`, `(dashboard)/` — each with its own layout
- Wiki pages: `/w/[slug]/[[...path]]` (catch-all, tenant-scoped)
- Dashboard: `/dashboard/{new,[slug]/{ai,discord,domains,editor,members,settings}}`
- API: `/api/chat` (provedor híbrido OpenRouter + Gemini), `/api/tenants`
- Auth callback: `/auth/callback`
- `src/supabase/` — Supabase client, typed Database defs, auth provider, hooks
- `supabase/migrations/` — 021→030 sequential SQL migrations
- `data/pixel-blade/` — static game data JSON fallback
- `public/audio-processors/` — worklets de áudio para o sistema de voz
- `api/token.py` — serverless function para gerar tokens Gemini Live API
- `@/*` alias → `src/`

## Multi-tenant
- Middleware (`src/middleware.ts`) looks up custom domains → rewrites to `/w/{slug}`
- Domain cookie `x-tenant-slug` set on main domain (`pixelfandom.vercel.app`)
- Tenant-scoped AI config via `tenants.ai_config` JSONB column
- Roles: `owner > admin > editor > viewer`

## Key env vars
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `FALLBACK_CHAIN` (comma-separated model list)
`PSYCHO_BACKEND_URL` — Python backend URL for dev API proxy (default `http://localhost:8000`)
`VERCEL_API_TOKEN` — Vercel Personal Access Token (domínios customizados)
`VERCEL_PROJECT_ID` — ID do projeto Vercel
`GEMINI_API_KEY` — Google Gemini API key (sistema de voz e chat de texto)

## Safety rules
- **NUNCA** exclua, modifique ou sobrescreva arquivos `.env*`. Eles contêm credenciais de produção.
- Se precisar de uma nova env var, adicione a chave vazia no `.env.example` ou documente neste guia — nunca altere o `.env` existente.

## Regras de segurança — escopo de controle

### Controle exclusivo do desenvolvedor (NÓS)
Nenhum usuário da plataforma — **incluindo owners, admins, editors e viewers de qualquer wiki** — pode ter acesso a:
- **Prompts de sistema da IA** (texto e voz) — `system_prompt`, `personality_id` → `systemPrompt`, instruções de persona, etc.
- **Modelos de IA, temperatura, max_tokens, provider, fallback chain** — toda configuração de modelo e parâmetros de inferência.
- **Chaves de API** (OpenRouter, Gemini, etc.)
- **Configurações de infraestrutura** — domínios, variáveis de ambiente, rate limits, etc.

Quem cria ou lê uma Wiki **não é dono do site**. Elas usam a plataforma, não a administram. Tudo que é core/infra deve ser controlado exclusivamente por nós, desenvolvedores.

### Única coisa que USUÁRIOS podem personalizar
Usuários (incluindo admin/owner de wiki) **só têm acesso a personalização**: escolher entre opções pré-definidas de humor, personalidade, estilo de emoji, tom de resposta, etc. — NADA disso envolve texto livre que vá parar no prompt.

### ⚠️ REGRA ABSOLUTA: Sem texto livre em prompts
- **Nenhuma personalização livre.** Usuário **nunca** digita código, texto arbitrário, system prompt customizado ou qualquer conteúdo que seja inserido diretamente no prompt da IA.
- **Todas as personalizações devem ser pré-montadas e pré-definidas por nós** em arquivos como `src/lib/ai-personalities.ts`, `src/lib/personas.ts`, `src/lib/emoji-styles.ts`, `src/lib/response-styles.ts`.
- **Toda escolha do usuário passa por validação** — o valor selecionado é comparado contra um conjunto fechado de opções conhecidas. Se não estiver na lista, é rejeitado. Isso previne SQL injection, prompt injection e qualquer tipo de ataque via entrada do usuário.
- A montagem final do prompt **só acontece no backend**, combinando as escolhas validadas do usuário com os templates definidos por nós.

### O que USUÁRIOS podem configurar (opções fechadas)
- **Wiki:** nome, descrição, logo, capa, favicon, cores do tema (apenas HSL via seletor de cor), layout, links (Discord, game).
- **Global (usuário logado):** personalidade (friendly/sarcastic/etc), persona (amigável/técnico), estilo de emoji, estilo de resposta, idioma do chat, voz preferida, volume, notificações, densidade da UI, tamanho da fonte, preset de tema de cor.

### Onde estas regras estão aplicadas
- `src/context/user-preferences-context.tsx` — `UserPreferences` com `chat_settings`, `voice_settings`, `theme_preset`
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Configurações globais do usuário (Chat, Voz, Tema, Mais)
- **Atenção:** Código existente em `src/app/(dashboard)/dashboard/[slug]/ai/page.tsx` que expõe `system_prompt` como campo de texto livre está em desacordo com estas regras e deve ser refatorado futuramente.

## Regras de segurança — páginas customizadas

### Controle exclusivo do desenvolvedor (NÓS)
Nenhum usuário da plataforma — **incluindo owners, admins, editors e viewers de qualquer wiki** — pode ter acesso a:
- **Templates/layout dos blocos** — cada componente `*-block.tsx`, `page-renderer.tsx`, floating islands
- **Lógica de renderização** — como blocos são exibidos, parsing de conteúdo, sanitização
- **Validação server-side** — API routes (`page-layout/route.ts`), sanitização de HTML e URLs
- **Componentes de bloco** — definição de quais blocos existem e seus schemas de configuração
- **Tipos e interfaces** — `types.ts`, interfaces de `BlockConfig`, `PageLayout`

### Única coisa que USUÁRIOS podem personalizar
Usuários (incluindo admin/owner de wiki) **só podem montar páginas usando blocos pré-definidos**:
- Escolher entre **57+ tipos de bloco** categorizados (layout, content, media, dynamic, data, interactive, footer, error/404)
- Preencher campos de texto/links/cores dentro de cada bloco (sempre sanitizados e validados via Zod)
- Escolher **posição de floating islands** (left/center/right) entre opções pré-definidas
- Configurar **cores do tema** via seletor HSL (apenas valores HSL, sem CSS arbitrário)
- Escolher **fontes** do par pré-definido no tema

### ⚠️ REGRA ABSOLUTA: Sem HTML/JS arbitrário em páginas
- **Nenhum conteúdo rich-text sem sanitização obrigatória.** `dangerouslySetInnerHTML` só pode ser usado com DOMPurify (ou similar) — tanto no client (`rich-text-block.tsx`) quanto no server (`page-renderer.tsx`).
- **Nenhum `<script>`, `<iframe>`, event handlers (`onerror`, `onload`, `onclick`, etc.)** permitido — DOMPurify deve removê-los automaticamente.
- **Nenhum protocolo `javascript:` ou `data:`** em URLs (`ctaUrl`, `link`, `discordUrl`, `imageUrl`, `src`, etc.) — toda URL deve ser sanitizada.
- **Sem CSS customizado** — apenas cores HSL via seletor de cor do tema.
- **Sem embeds arbitrários** (YouTube, Twitch, redes sociais) — apenas os blocos pré-definidos.
- **Toda entrada do usuário é texto inseguro** — React escapa texto por padrão, mas `href`/`src` precisam de sanitização explícita de protocolo.

### O que USUÁRIOS podem configurar (opções fechadas)
| Bloco | Campos permitidos | Restrições |
|-------|------------------|------------|
| Hero | title, subtitle, ctaText, ctaUrl, imageUrl, backgroundColor | URLs sanitizadas, sem protocolo javascript: |
| Article Grid | title, columns (1-4), articles[], tag | Apenas slugs, sem HTML |
| Featured List | title, items[] (label, description, icon, imageUrl) | URLs sanitizadas |
| Discord Embed | discordUrl, title, description | Apenas URL do Discord, sanitizada |
| News Feed | title, items[] (title, date, excerpt, link, imageUrl) | URLs sanitizadas |
| Image Gallery | title, images[] (src, alt) | src sanitizado, sem javascript: |
| Ranking Table | title, headers[], rows[][] | Apenas texto, sem HTML |
| Rich Text | title, html | **HTML obrigatoriamente sanitizado com DOMPurify** |

### Onde estas regras estão aplicadas
- `src/lib/block-schemas.ts` — Zod schemas de configuração para todos os 57+ blocos, com `safeParseBlockConfig()` para validação runtime
- `src/components/page-builder/config-panels/` — painéis de configuração estruturados com inputs tipados (SelectField, ItemsListEditor, etc.), sem campos JSON livre
- `src/components/page-builder/blocks/rich-text-block.tsx` — rich-text com dangerouslySetInnerHTML (deve usar DOMPurify)
- `src/components/page-builder/renderer/page-renderer.tsx` — renderização pública de blocos (deve sanitizar rich-text e URLs)
- `src/components/page-builder/block-config-panel.tsx` — painel de configuração de blocos (agora usa inputs estruturados dos config-panels)
- `src/app/api/tenants/[id]/page-layout/route.ts` — API de salvar layout (valida com Zod + sanitiza server-side)
- `src/components/page-builder/types.ts` — definições de tipos dos blocos
- `src/components/page-builder/page-builder-editor.tsx` — editor de páginas

### ⚠️ ATENÇÃO
- `page-layout/route.ts` agora valida cada bloco com `safeParseBlockConfig()` antes de salvar — se um config não passar no Zod schema, o request é rejeitado com status 400
- `DOMPurify` (isomorphic-dompurify) está instalado e é usado em `sanitize.ts` para limpeza de HTML e URLs
- Os schemas Zod em `block-schemas.ts` são a única fonte de verdade para configs válidos — qualquer campo extra ou tipo incorreto é rejeitado
- Nenhum bloco usa mais `ArrayField` (textarea JSON) — todos foram migrados para painéis com inputs tipados

## Config globais do usuário
- `src/context/user-preferences-context.tsx` — `UserPreferences` com `chat_settings`, `voice_settings`, `theme_preset`
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Configurações globais (Chat, Voz, Tema, Mais)
- **Regra:** Configurações avançadas de chat (modelo, temperatura, max_tokens, provider, system prompt) NÃO são editáveis pelo usuário nesta página. Elas são definidas exclusivamente pelo admin da wiki em `tenants.ai_config`. A página de settings globais só expõe Personalidade, Persona, Emoji, Estilo de Resposta e Idioma.

## Important files
- `docs/ai-rules.md` — strict agent behavior rules (Portuguese). Follow when editing code.
- `docs/blueprint.md` — original app concept (legacy reference)
- `docs/backend.json` — legacy Firestore schema (not actively used)
- `supabase/SCHEMA.md` — full DB schema, tables, enums, RLS
- `.env*` in `.gitignore` — must be provided locally

## Installed Tools & Skills
- **RTK** (`rtk-ai/rtk`) — CLI proxy que reduz consumo de tokens em 60-92%. Plugin OpenCode instalado globalmente. Comandos bash são reescritos automaticamente (`git status` → `rtk git status`).
- **Superpowers** (`obra/superpowers`) — Metodologia de desenvolvimento: brainstorming, TDD, code review, subagents, git worktrees. Skills em `.opencode/skills/superpowers/`.
- **ECC** (`affaan-m/ECC`) — 249 skills, 191 agents, 102 commands cross-harness. Skills em `.opencode/skills/ecc/`, agents em `.opencode/agents/`, commands em `.opencode/commands/`.
- **Caveman** (`JuliusBrussee/caveman`) — Compressão de ~75% dos tokens de output. 7 skills em `.opencode/skills/caveman*/`.
- **Mem0** (`mem0ai/mem0`) — Camada de memória inteligente. Skills em `.opencode/skills/mem0/` e `.opencode/skills/mem0-cli/`.
- **Baoyu Skills** (`JimLiu/baoyu-skills`) — 22 skills de geração de conteúdo (infográficos, slides, diagramas, tradução, etc.). Em `.opencode/skills/baoyu-*/`.
- **UI UX Pro Max** (`nextlevelbuilder/ui-ux-pro-max-skill`) — Design intelligence com 161 regras de UI/UX. Skill em `.opencode/skills/ui-ux-pro-max/`.
- **Scrapling** (`D4Vinci/Scrapling`) — Web scraping com anti-bot bypass. MCP server configurado em `opencode.json`. Skill em `.opencode/skills/scrapling/`.
- **SigNoz** (`SigNoz/signoz`) — Observabilidade open-source (logs, métricas, traces). Docker compose em `docker/signoz/`.

## MCP Servers
- `scrapling` — Web scraping MCP server configurado em `opencode.json`

## Patterns
- **All pages** are `'use client'` (no server components)
- Global state: `AppProvider` wraps `SupabaseProvider` + Zustand chat store
- Game data: fetched from Supabase `game_config` table, falls back to static data
- Dark mode forced: `<html className="dark">` — no theme toggle
- CSS vars define colors (`--primary: 198 100% 65%` = cyan-blue `#4BC5FF`)

## Engineering principles — Local-first

### Regra geral
Toda feature deve adotar **local-first**: a primeira fonte de dados é o estado local
(useState/useRef/Zustand). A requisição à API só acontece se não houver dados
em cache. Resultados de API são sempre salvos em cache local no primeiro uso.

### Padrão obrigatório
```
1. Verificar cache local (useRef / Zustand store / localStorage)
2. Se cache hit → usar imediatamente, zero requests
3. Se cache miss → disparar request, salvar resultado no cache
4. Navegação entre estados (filtro, ordenação, abas) opera só no cache local
```

### Implementação
- **useRef** para cache de dados fetched (items de comparação, listas, etc.)
- O ref persiste durante todo o ciclo de vida do componente (incluindo
  transições de searchParams na App Router)
- O estado (useState) é populado a partir do ref; nunca sobrescrever o ref
  com dados parciais
- Evitar `localStorage` quando o dado é específico da sessão — useRef é
  suficiente e mais performático

### Exemplo
```ts
const cache = useRef<Item[] | null>(null);

async function fetchData() {
  if (cache.current) { setItems(cache.current); return; }
  const { data } = await api.fetch();
  if (data) { cache.current = data; setItems(data); }
}
```
