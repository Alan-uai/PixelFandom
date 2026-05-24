export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative";
  citations?: Citation[];
  question?: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  tables?: any;
  tenant_id?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedAnswer {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  excerpt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type Theme = "light" | "dark" | "system";
