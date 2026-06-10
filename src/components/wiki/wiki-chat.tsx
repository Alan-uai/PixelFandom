'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Send, Bot, User, AlertCircle, MessageSquare, Trash2, Clock, Settings } from 'lucide-react';
import StreamingAccordion from './streaming-accordion';
import RenderTextoPuro from './render-texto-puro';
import RenderTabela from './render-tabela';
import RenderCards from './render-cards';
import RenderHibrido from './render-hibrido';
import TypingAnimation from './typing-animation';
import { MessageFeedback } from '@/components/chat/message-feedback';
import { useUserPreferences } from '@/context/user-preferences-context';
import { supabase, useUser } from '@/supabase';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
};

type DBSession = {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
};

type WikiChatProps = {
  tenantSlug: string;
  compact?: boolean;
  onClose?: () => void;
};

function useDisplayMode(tenantSlug: string): string {
  const ctx = useUserPreferences();
  const wikiPrefs = ctx.preferences.wiki_preferences?.[tenantSlug];
  return wikiPrefs?.display_mode || ctx.preferences.chat_settings.display_mode || 'acordeao';
}

function useElapsedTime(startTime: number | null, timeoutMs: number): string {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 200);
    return () => clearInterval(interval);
  }, [startTime]);

  const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
  if (elapsed === 0) return '';

  const secs = Math.floor(elapsed / 1000);
  const mins = Math.floor(secs / 60);
  const displaySecs = secs % 60;
  const timeStr = mins > 0 ? `${mins}m${displaySecs}s` : `${displaySecs}s`;

  if (elapsed > timeoutMs * 0.75) {
    return `${timeStr} · ainda processando`;
  }
  return remaining > 10 ? '' : `${timeStr} · ${remaining}s restantes`;
}

const TIMEOUT_MS = 120_000;

export default function WikiChat({ tenantSlug, compact, onClose }: WikiChatProps) {
  const { user } = useUser();
  const displayMode = useDisplayMode(tenantSlug);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [inlineItem, setInlineItem] = useState<{ table: string; slug: string } | null>(null);
  const [inlineCompare, setInlineCompare] = useState<{ table: string; slug: string; column: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionsCache = useRef<DBSession[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedStr = useElapsedTime(streamStartTime, TIMEOUT_MS);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user) loadSessions();
  }, [user, tenantSlug]);

  useEffect(() => {
    (window as any).__onItemClick = (table: string, slug: string) => {
      setInlineItem({ table, slug });
    };
    (window as any).__onCompareClick = (table: string, slug: string, column: string) => {
      setInlineCompare({ table, slug, column });
    };
    return () => {
      delete (window as any).__onItemClick;
      delete (window as any).__onCompareClick;
    };
  }, []);

  const loadSessions = async () => {
    if (sessionsCache.current) {
      setSessions(sessionsCache.current);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/sessions?tenant_slug=${tenantSlug}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        sessionsCache.current = data;
        setSessions(data);
      }
    } catch {} finally {
      setLoadingHistory(false);
    }
  };

  const createSession = async (): Promise<string | null> => {
    if (!user) return null;
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();
    if (!tenant) return null;
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant.id }),
      });
      if (res.ok) {
        const session = await res.json();
        setSessionId(session.id);
        setSessions((prev) => [session, ...prev]);
        return session.id;
      }
    } catch {}
    return null;
  };

  const loadSessionMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sid}/messages`);
      if (res.ok) {
        const dbMessages = await res.json();
        const chatMessages: ChatMessage[] = dbMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          feedback: m.feedback ?? undefined,
        }));
        setMessages(chatMessages);
        setSessionId(sid);
        setShowHistory(false);
      }
    } catch {}
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    setInlineItem(null);
    setInlineCompare(null);
  };

  const deleteSession = useCallback(async (sid: string) => {
    try {
      await fetch(`/api/chat/sessions/${sid}`, { method: 'DELETE' });
      sessionsCache.current = null;
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setMessages([]);
      }
    } catch {}
  }, [sessionId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    let currentSessionId = sessionId;
    if (!currentSessionId && user) {
      currentSessionId = await createSession();
    }

    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortRef.current?.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('/api/chat', {
        signal: abortRef.current.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: currentSessionId,
        }),
      });

      if (!response.body) throw new Error('Sem resposta');

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);
      setStreamStartTime(Date.now());

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setStreamStartTime(null);

      if (currentSessionId) {
        await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'assistant', content: accumulated, provider: 'text' }],
          }),
        });
        sessionsCache.current = null;
        loadSessions();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('A requisição excedeu o tempo limite. Tente novamente com uma pergunta mais específica.');
      } else {
        setError('Erro ao conectar com o assistente.');
      }
      setStreamStartTime(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, tenantSlug, sessionId, user]);

  const handleFeedback = async (messageId: string, type: 'positive' | 'negative') => {
    const message = messages.find((m) => m.id === messageId);
    const newFeedback = message?.feedback === type ? undefined : type;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: newFeedback } : m
      )
    );
    try {
      await fetch(`/api/chat/messages/${messageId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newFeedback || null }),
      });
    } catch {}
  };

  const renderAssistantContent = (msg: ChatMessage) => {
    const isStreaming = !!msg.isStreaming;
    const content = msg.content;

    if (!content && isStreaming) {
      return (
        <div className="flex items-center gap-3 py-2">
          <TypingAnimation size="sm" />
          {elapsedStr && (
            <span className="text-xs text-muted-foreground animate-pulse">{elapsedStr}</span>
          )}
        </div>
      );
    }

    switch (displayMode) {
      case 'texto_puro':
        return <RenderTextoPuro content={content} isStreaming={isStreaming} tenantSlug={tenantSlug} />;
      case 'tabela':
        return <RenderTabela content={content} isStreaming={isStreaming} tenantSlug={tenantSlug} />;
      case 'cards':
        return <RenderCards content={content} isStreaming={isStreaming} tenantSlug={tenantSlug} />;
      case 'hibrido':
        return <RenderHibrido content={content} isStreaming={isStreaming} tenantSlug={tenantSlug} />;
      default:
        return <StreamingAccordion streamContent={content} isStreaming={isStreaming} tenantSlug={tenantSlug} />;
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        {showHistory ? (
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
            ← Voltar
          </Button>
        ) : (
          <>
            {sessionId && (
              <Button variant="outline" size="sm" onClick={newChat}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Nova
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" onClick={() => { setShowHistory(!showHistory); if (!showHistory) { sessionsCache.current = null; loadSessions(); } }}>
                <Clock className="h-3.5 w-3.5 mr-1" />
                Histórico
              </Button>
            )}
          </>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
        <a href="/settings"><Settings className="h-3.5 w-3.5" /></a>
      </Button>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-none space-y-1 p-1">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma conversa salva</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm ${
                s.id === sessionId ? 'bg-muted' : ''
              }`}
              onClick={() => loadSessionMessages(s.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.message_count} mensagens</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const chatContent = (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 px-2 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[85%]">
              <div className={`rounded-xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'assistant' ? (
                  renderAssistantContent(msg)
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'assistant' && !msg.isStreaming && (
                <MessageFeedback
                  messageId={msg.id}
                  currentFeedback={msg.feedback}
                  onFeedback={handleFeedback}
                />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {error && (
          <div className="flex items-center justify-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3 mt-4 shrink-0">
        <div className="flex-1">
          <FloatingLabelInput
            ref={inputRef}
            label="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !input.trim()} className="h-12 px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </>
  );

  const emptyState = (
    <div className="flex-1 flex flex-col items-center justify-center text-center min-h-0">
      <Bot className="h-16 w-16 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Faça uma pergunta sobre o conteúdo da wiki.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {['O que tem nesta wiki?', 'Quais são os artigos recentes?', 'Me ajude a encontrar...'].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); inputRef.current?.focus(); }}
            className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );

  if (inlineItem || inlineCompare) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b shrink-0">
          <Button variant="ghost" size="sm" onClick={() => { setInlineItem(null); setInlineCompare(null); }}>
            ← Voltar ao chat
          </Button>
          <span className="text-sm text-muted-foreground">
            {inlineItem ? `${inlineItem.table}/${inlineItem.slug}` : `${inlineCompare?.table}/${inlineCompare?.slug}/${inlineCompare?.column}`}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">
              {inlineItem ? `Item: ${inlineItem.slug}` : `Comparação: ${inlineCompare?.slug}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Dados carregados inline para consulta rápida.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    if (showHistory) return renderHistory();

    return (
      <div className="flex flex-col h-full min-h-0">
        {renderHeader()}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground min-h-0">
            <Bot className="h-8 w-8 mb-2" />
            <p className="text-sm">Pergunte algo sobre esta wiki.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-3 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && <Bot className="h-6 w-6 shrink-0 mt-1 text-primary" />}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className={`rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.role === 'assistant' ? (
                      renderAssistantContent(msg)
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'assistant' && !msg.isStreaming && (
                    <MessageFeedback
                      messageId={msg.id}
                      currentFeedback={msg.feedback}
                      onFeedback={handleFeedback}
                    />
                  )}
                </div>
                {msg.role === 'user' && <User className="h-6 w-6 shrink-0 mt-1 text-muted-foreground" />}
              </div>
            ))}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 p-3 border-t shrink-0">
          <div className="flex-1">
            <FloatingLabelInput
              ref={inputRef}
              label="Pergunte algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full h-full min-h-0">
      <div className="text-center mb-6 shrink-0">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Assistente da Wiki
          </h1>
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href="/settings"><Settings className="h-3.5 w-3.5" /></a>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Pergunte sobre o conteúdo desta wiki.</p>
      </div>

      {showHistory ? (
        <div className="flex-1 border rounded-lg p-4 min-h-0">
          <h2 className="text-lg font-semibold mb-4">Histórico de Conversas</h2>
          {renderHistory()}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 shrink-0">
            {sessionId && (
              <Button variant="outline" size="sm" onClick={newChat}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Nova conversa
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" onClick={() => { setShowHistory(true); sessionsCache.current = null; loadSessions(); }}>
                <Clock className="h-3.5 w-3.5 mr-1" />
                Histórico
              </Button>
            )}
          </div>
          {messages.length === 0 ? emptyState : chatContent}
        </>
      )}
    </div>
  );
}
