import type { LucideIcon } from 'lucide-react';

export const SECTION_META: Record<string, { icon: string; label: string }> = {
  resumo:          { icon: '📋', label: 'Resumo' },
  detalhes:        { icon: '📖', label: 'Detalhes' },
  dicas:           { icon: '💡', label: 'Dicas' },
  topicos:         { icon: '📌', label: 'Tópicos' },
  passos:          { icon: '👣', label: 'Passo a Passo' },
  exemplos:        { icon: '🎯', label: 'Exemplos' },
  comparacao:      { icon: '⚖️', label: 'Comparação' },
  analise:         { icon: '🔬', label: 'Análise' },
  conclusao:       { icon: '✅', label: 'Conclusão' },
  recomendacao:    { icon: '⭐', label: 'Recomendação' },
  contexto:        { icon: '📚', label: 'Contexto' },
  desenvolvimento: { icon: '🔨', label: 'Desenvolvimento' },
  reflexao:        { icon: '🤔', label: 'Reflexão' },
  sumario:         { icon: '📄', label: 'Sumário Executivo' },
  resultados:      { icon: '📊', label: 'Resultados' },
  pros:            { icon: '👍', label: 'Prós' },
  contras:         { icon: '👎', label: 'Contras' },
  veredito:        { icon: '⚖️', label: 'Veredito' },
  objetivo:        { icon: '🎯', label: 'Objetivo' },
  conteudo:        { icon: '📝', label: 'Conteúdo' },
  exercicios:      { icon: '✏️', label: 'Exercícios' },
  especificacoes:  { icon: '⚙️', label: 'Especificações' },
  implementacao:   { icon: '💻', label: 'Implementação' },
  observacoes:     { icon: '👁️', label: 'Observações' },
  tabela:          { icon: '📊', label: 'Tabela' },
};

export type SectionType = keyof typeof SECTION_META;

export const responseFormatStyles: Record<string, { label: string; description: string; sections: string[]; tone: string; icon: string }> = {
  curto: {
    label: 'Curto',
    description: 'Resposta direta e objetiva',
    sections: ['resumo'],
    tone: 'Responda de forma curta e objetiva, indo direto ao ponto.',
    icon: '⚡',
  },
  topicos: {
    label: 'Tópicos',
    description: 'Resposta organizada em tópicos',
    sections: ['resumo', 'topicos', 'dicas'],
    tone: 'Responda em tópicos organizados, facilitando a leitura.',
    icon: '📋',
  },
  detalhado: {
    label: 'Detalhado',
    description: 'Resposta completa e abrangente',
    sections: ['resumo', 'detalhes', 'dicas'],
    tone: 'Responda de forma detalhada e completa, cobrindo todos os aspectos.',
    icon: '📖',
  },
  tutorial: {
    label: 'Tutorial',
    description: 'Passo a passo didático',
    sections: ['resumo', 'passos', 'exemplos', 'dicas'],
    tone: 'Explique como se fosse um tutorial passo a passo, com exemplos práticos.',
    icon: '🎓',
  },
  tecnico: {
    label: 'Técnico',
    description: 'Especificações e implementação',
    sections: ['resumo', 'especificacoes', 'implementacao', 'observacoes'],
    tone: 'Use linguagem técnica precisa com exemplos de código e especificações.',
    icon: '⚙️',
  },
  analise: {
    label: 'Análise',
    description: 'Análise aprofundada',
    sections: ['resumo', 'analise', 'conclusao'],
    tone: 'Faça uma análise aprofundada com dados, evidências e conclusão.',
    icon: '🔬',
  },
  comparativo: {
    label: 'Comparativo',
    description: 'Comparação entre opções',
    sections: ['resumo', 'comparacao', 'recomendacao'],
    tone: 'Compare as opções de forma objetiva e recomende a melhor.',
    icon: '⚖️',
  },
  debate: {
    label: 'Debate',
    description: 'Prós e contras',
    sections: ['resumo', 'pros', 'contras', 'veredito'],
    tone: 'Apresente ambos os lados de forma equilibrada com um veredito final.',
    icon: '🗣️',
  },
  relatorio: {
    label: 'Relatório',
    description: 'Formato executivo',
    sections: ['sumario', 'resultados', 'recomendacoes'],
    tone: 'Estruture a resposta como um relatório executivo com dados concretos.',
    icon: '📊',
  },
  narrativa: {
    label: 'Narrativa',
    description: 'Resposta em formato narrativo',
    sections: ['contexto', 'desenvolvimento', 'conclusao', 'reflexao'],
    tone: 'Responda em formato de história envolvente com contexto e reflexão.',
    icon: '📝',
  },
  aprendizado: {
    label: 'Aprendizado',
    description: 'Conteúdo didático com exercícios',
    sections: ['objetivo', 'conteudo', 'exemplos', 'exercicios'],
    tone: 'Ensine o conteúdo de forma progressiva com exemplos e exercícios.',
    icon: '🧠',
  },
};

export const responseStyleGroups = [
  { label: '⚡ Rápidas', keys: ['curto', 'topicos'] },
  { label: '📚 Completas', keys: ['detalhado', 'tutorial', 'tecnico'] },
  { label: '🧠 Análise', keys: ['analise', 'comparativo', 'debate', 'relatorio'] },
  { label: '🎨 Criativas', keys: ['narrativa', 'aprendizado'] },
];

export type DisplayMode = 'acordeao' | 'texto_puro' | 'tabela' | 'cards' | 'hibrido' | 'auto';

export interface DisplayModeConfig {
  label: string;
  description: string;
  icon: string;
}

export const displayModes: Record<DisplayMode, DisplayModeConfig> = {
  acordeao:   { label: 'Acordeão',   description: 'Blocos expansíveis com seções', icon: '📋' },
  texto_puro: { label: 'Texto Puro', description: 'Documento markdown contínuo', icon: '📝' },
  tabela:     { label: 'Tabela',     description: 'Dados em formato de tabela',  icon: '📊' },
  cards:      { label: 'Cards',      description: 'Seções em cards visuais',     icon: '🃏' },
  hibrido:    { label: 'Híbrido',    description: 'Mix de formatos por seção',   icon: '🔀' },
  auto:       { label: 'Automático', description: 'IA escolhe o melhor formato', icon: '🤖' },
};

export const displayModeGroups = [
  { label: '🎨 Visual', keys: ['acordeao', 'texto_puro', 'cards'] },
  { label: '📊 Dados', keys: ['tabela', 'hibrido', 'auto'] },
];

export const responseStyles = {
  detailed: { instruction: responseFormatStyles.detalhado.tone },
  short: { instruction: responseFormatStyles.curto.tone },
  topicos: { instruction: responseFormatStyles.topicos.tone },
};
