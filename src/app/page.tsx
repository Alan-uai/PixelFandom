'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatContainer } from '@/components/chat/chat-container';
import ChatBubble from '@/components/chat/chat-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { ChatInput } from '@/components/chat/chat-input';
import { QuickSuggestions } from '@/components/chat/quick-suggestions';
import { MessageFeedback } from '@/components/chat/message-feedback';
import { CitationBlock } from '@/components/chat/citation-block';
import { useChatStore } from '@/lib/store';
import { useTenantHeader } from '@/hooks/use-tenant';
import type { Message } from '@/lib/types';

// ChatHistory imported directly since it's a default export now
import ChatHistory from '@/components/chat/chat-history';

const QUICK_SUGGESTIONS = [
  'How do I get started with Pixel Blade?',
  'What are the best weapons for beginners?',
  'Where can I find raid timers?',
  'How to redeem promo codes?',
];

export default function Home() {
  const tenantHeaders = useTenantHeader();
  const {
    sessions,
    activeSessionId,
    isHistoryOpen,
    addSession,
    updateSession,
    deleteSession,
    setActiveSession,
    addMessage,
    toggleHistory,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const generateSessionTitle = (firstMessage: string) => {
    return firstMessage.length > 30 ? `${firstMessage.slice(0, 30)}...` : firstMessage;
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      const newSession = {
        id: crypto.randomUUID(),
        title: generateSessionTitle(input.trim()),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addSession(newSession);
      currentSessionId = newSession.id;
    } else {
      addMessage(currentSessionId, userMessage);
    }

    setInput('');
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    addMessage(currentSessionId, initialAssistantMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        updateSession(currentSessionId, {
          messages: sessions
            .find(s => s.id === currentSessionId)
            ?.messages.map(m =>
              m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
            ) || [],
        });
      }

      if (activeSession?.messages.length === 0) {
        updateSession(currentSessionId, {
          title: generateSessionTitle(userMessage.content),
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateSession(currentSessionId, {
        messages: sessions
          .find(s => s.id === currentSessionId)
          ?.messages.map(m =>
            m.id === assistantMessageId
              ? { ...m, content: 'An error occurred. Please try again.' }
              : m
          ) || [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeSessionId, activeSession, addSession, addMessage, updateSession, sessions]);

  const handleNewSession = () => {
    const newSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addSession(newSession);
  };

  const handleSelectSession = (id: string) => setActiveSession(id);
  const handleDeleteSession = (id: string) => deleteSession(id);
  const handleRenameSession = (id: string, title: string) => updateSession(id, { title });

  const handleFeedback = (messageId: string, type: 'positive' | 'negative', category?: string) => {
    console.log('Feedback:', messageId, type, category);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ChatHistory
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpen={isHistoryOpen}
        onToggle={toggleHistory}
      />
      <div className="flex-1 flex flex-col pt-14 max-w-4xl mx-auto w-full">
        <ChatContainer>
          <AnimatePresence>
            {messages.map((message) => (
              <div key={message.id}>
                <ChatBubble message={message} />
                {message.role === 'assistant' && (
                  <>
                    <MessageFeedback
                      messageId={message.id}
                      currentFeedback={message.feedback}
                      onFeedback={handleFeedback}
                    />
                    <CitationBlock
                      citations={message.citations || []}
                      isVisible={!!message.citations?.length}
                    />
                  </>
                )}
              </div>
            ))}
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </ChatContainer>
        <QuickSuggestions
          suggestions={QUICK_SUGGESTIONS}
          onSelect={handleSuggestionSelect}
          isVisible={messages.length === 0 && !isLoading}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          isLoading={isLoading}
          placeholder="Ask about Pixel Blade..."
        />
      </div>
    </div>
  );
}
