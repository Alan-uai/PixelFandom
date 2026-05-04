
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  fromCache?: boolean;
  question?: string; // The original user question that prompted this assistant message
}

export interface SavedAnswer {
    id: string;
    userId: string;
    question: string;
    answer: string;
    createdAt: any; // Firestore Timestamp
    content: string;
}

export interface WikiArticleTable {
  headers: string[];
  rows: Record<string, string | number>[];
}

export interface WikiArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  imageUrl: string;
  tables?: Record<string, WikiArticleTable>;
  createdAt: any; // Firestore Timestamp
}

export type BonusCategory = 'damage' | 'energy' | 'coins' | 'exp' | 'movespeed' | 'luck';

export interface Bonus {
  type: BonusCategory;
  value: number;
}
