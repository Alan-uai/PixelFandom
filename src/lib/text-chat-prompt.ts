import { responseFormatStyles, SECTION_META, type DisplayMode, displayModes } from './response-styles';

// ─── BASE MODULES (always included) ───

export const IDENTITY_MODULE = `You are an expert wiki assistant integrated with a game database. You have access to various tools for searching, querying, and analyzing game data.

LINKS:
Whenever you mention an item or wiki page, use this format: Name@path@
- Item: Iron Sword@weapons/iron-sword@
- Wiki page: Weapon Guide@weapon-guide@
The renderer will convert these to clickable links automatically.`;

export const TOOL_LIST_MODULE = `AVAILABLE TOOLS:

Search & Wiki: searchWiki, getWikiArticle, getWikiInfo, listWikiArticles, getWikiTags, searchWikiPages, listPagesByTag, getRecentPages, batchWikiSearch
Schema: listGameTables, getTableSchema, findColumns
Item Queries: getItem, queryItems, filterByRange, searchTable, countItems, listItems, searchAllTables, findByCategory, batchGetItems, multiTableQuery, getRecentItems
Stat Analysis: rankByStat, compareOnStat, getStatSummary, getTopItems, getCategoryAverages, getStatDistribution, getStatTrend, formatAsTable
Cross-ref: compareTwoItems, findSimilarItems, getTableComparison, getItemNeighbors, findUpgrades, searchByExample, getRelatedItems
Math: evaluateMath

ALWAYS use tools to get real data. NEVER invent numbers, stats, or counts.`;

export const CORE_RULES_MODULE = `RULES:
1. Always use tools to get real data. Never invent numbers, stats, or counts.
2. Extract key terms for search. Search for "espada noturna", not "como obter a espada noturna".
3. If a tool returns empty or null, say the info is not available. Do not hallucinate.
4. Be thorough: if search returns nothing, try variations before giving up.
5. Respond in natural Portuguese (PT-BR) unless the user asks otherwise.`;

// ─── FORMAT MODULES (one per display mode, no cross-references) ───

function buildAcordeaoFormat(responseStyle?: string): string {
  const style = responseStyle ? responseFormatStyles[responseStyle] : null;
  const sections = style?.sections ?? responseFormatStyles.detalhado.sections;
  const sectionExamples = sections.map(s => {
    const meta = SECTION_META[s] ?? { icon: '📌', label: s.charAt(0).toUpperCase() + s.slice(1) };
    return `@@@SECTION@@@\n{"sectionType":"${s}","title":"${meta.label}","content":"..."}`;
  }).join('\n');

  return `MODO DE EXIBIÇÃO: Acordeão
Forneça sua resposta em seções separadas. Cada seção deve começar com @@@SECTION@@@ na própria linha, seguido de um JSON na linha seguinte.

Seções obrigatórias: ${sections.join(', ')}

Exemplo:
${sectionExamples}

REGRAS:
- sectionType deve ser um dos: ${sections.join(', ')}
- O campo "resumo" deve ser a primeira seção (se presente), enxuta e direta
- Use Name@path@ para referenciar itens e páginas
- Responda em português brasileiro
- sectionType "tabela" pode incluir "headers" (string[]) e "rows" (string[][])`;
}

function buildTextoPuroFormat(): string {
  return `MODO DE EXIBIÇÃO: Texto Puro
Escreva a resposta como um documento Markdown contínuo. Use ## para títulos de seção, listas, tabelas e negrito normalmente. Use Name@path@ para referenciar itens e páginas da wiki.`;
}

function buildTabelaFormat(): string {
  return `MODO DE EXIBIÇÃO: Tabela
Estruture a resposta como uma única seção com headers (string[]) e rows (string[][]). A primeira linha pode conter o título geral. Use Name@path@ para referenciar itens.`;
}

function buildCardsFormat(responseStyle?: string): string {
  const style = responseStyle ? responseFormatStyles[responseStyle] : null;
  const sections = style?.sections ?? responseFormatStyles.detalhado.sections;

  return `MODO DE EXIBIÇÃO: Cards
Forneça sua resposta em seções separadas com @@@SECTION@@@. Cada seção vira um card visual.

Seções obrigatórias: ${sections.join(', ')}

Exemplo:
@@@SECTION@@@
{"sectionType":"${sections[0]}","title":"...","content":"..."}

Use Name@path@ para referenciar itens e páginas.`;
}

function buildHibridoFormat(responseStyle?: string): string {
  const style = responseStyle ? responseFormatStyles[responseStyle] : null;
  const sections = style?.sections ?? responseFormatStyles.detalhado.sections;

  return `MODO DE EXIBIÇÃO: Híbrido
Forneça sua resposta em seções separadas com @@@SECTION@@@. O sectionType define como cada seção é renderizada.

Seções obrigatórias: ${sections.join(', ')}

Dica: Use o sectionType mais adequado para cada parte do conteúdo.
Use Name@path@ para referenciar itens e páginas.`;
}

function buildAutoFormat(): string {
  return `MODO DE EXIBIÇÃO: Automático
Escolha o melhor formato para cada resposta:
- @@@SECTION@@@ com seções para respostas complexas
- Markdown contínuo para respostas simples
- sectionType "tabela" com headers/rows para dados comparáveis
Use Name@path@ para referenciar itens e páginas.`;
}

function buildFormatModule(displayMode?: string, responseStyle?: string): string {
  switch (displayMode) {
    case 'texto_puro': return buildTextoPuroFormat();
    case 'tabela': return buildTabelaFormat();
    case 'cards': return buildCardsFormat(responseStyle);
    case 'hibrido': return buildHibridoFormat(responseStyle);
    case 'auto': return buildAutoFormat();
    default: return buildAcordeaoFormat(responseStyle);
  }
}

// ─── BUILDER ───

export interface TextChatPromptConfig {
  userPrompt?: string;
  schemaPrompt?: string;
  responseStyle?: string;
  displayMode?: string;
}

export function buildTextSystemPrompt(config: TextChatPromptConfig): string {
  const parts: string[] = [];

  if (config.userPrompt) {
    parts.push(config.userPrompt);
  }

  parts.push(IDENTITY_MODULE);
  parts.push(TOOL_LIST_MODULE);

  if (config.schemaPrompt) {
    parts.push(`# DATABASE SCHEMA\n\n${config.schemaPrompt}`);
  }

  parts.push(CORE_RULES_MODULE);
  parts.push(buildFormatModule(config.displayMode, config.responseStyle));

  return parts.join('\n\n');
}

// ─── CACHE ───

interface CacheEntry {
  prompt: string;
  hash: string;
}

const promptCache = new Map<string, CacheEntry>();

function getConfigHash(config: TextChatPromptConfig): string {
  return JSON.stringify(config);
}

function getCacheKey(tenantSlug: string, userId?: string): string {
  return `${tenantSlug}:${userId || ''}`;
}

export function getOrBuildPrompt(
  config: TextChatPromptConfig,
  tenantSlug: string,
  userId?: string
): string {
  const key = getCacheKey(tenantSlug, userId);
  const hash = getConfigHash(config);
  const cached = promptCache.get(key);

  if (cached && cached.hash === hash) {
    return cached.prompt;
  }

  const prompt = buildTextSystemPrompt(config);
  promptCache.set(key, { prompt, hash });
  return prompt;
}

export function clearPromptCache(tenantSlug?: string, userId?: string): void {
  if (tenantSlug) {
    const key = getCacheKey(tenantSlug, userId);
    promptCache.delete(key);
  } else {
    promptCache.clear();
  }
}
