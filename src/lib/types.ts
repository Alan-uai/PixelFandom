export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative";
  citations?: Citation[];
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
