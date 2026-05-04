import { create } from 'zustand';
import type { ChatSession, Message } from '@/lib/types';

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isHistoryOpen: boolean;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setHistoryOpen: (open: boolean) => void;
  toggleHistory: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  isHistoryOpen: false,
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: session.id })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  deleteSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
  setActiveSession: (id) => set({ activeSessionId: id }),
  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message], updatedAt: new Date() } : s
      ),
    })),
  setHistoryOpen: (open) => set({ isHistoryOpen: open }),
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
}));
