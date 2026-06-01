'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, Settings, ExternalLink, Loader2, Check, Save, Star, ArrowUpDown } from 'lucide-react';
import type { WidgetChatConfig, WidgetVoiceConfig, WidgetLayout, CardPositions } from './types';
import { CardPositionEditor } from './card-position-editor';

const POSITIONS = [
  { value: 'bottom-right', label: 'Inferior Direito' },
  { value: 'bottom-left', label: 'Inferior Esquerdo' },
  { value: 'bottom-center', label: 'Inferior Centro' },
] as const;

const SIZES = [
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
] as const;

const ANIMATIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'pulse', label: 'Pulsar' },
  { value: 'bounce', label: 'Quicar' },
  { value: 'float', label: 'Flutuar' },
  { value: 'glow', label: 'Brilhar' },
] as const;

const CHAT_ICONS = [
  { value: 'MessageCircle', label: 'Balão' },
  { value: 'Bot', label: 'Robô' },
  { value: 'MessageSquare', label: 'Mensagem' },
  { value: 'HelpCircle', label: 'Ajuda' },
] as const;

const DEFAULT_POSITIONS: CardPositions = {
  follow: { edge: 'top', offsetPct: 95 },
  vote: { edge: 'bottom', offsetPct: 95 },
};

const CARD_TABS = [
  { id: 'article_card', label: 'Cartão de Artigo', desc: 'Posição nos cards da wiki' },
  { id: 'marketing_card', label: 'Card Marketing', desc: 'Posição nos cards da página inicial' },
] as const;

interface WidgetsEditorProps {
  tenantId: string;
  slug: string;
}

export function WidgetsEditor({ tenantId, slug }: WidgetsEditorProps) {
  const [chat, setChat] = useState<WidgetChatConfig>({
    enabled: true,
    position: 'bottom-right',
    size: 'md',
    color: 'var(--primary)',
    animation: 'pulse',
    icon: 'MessageCircle',
  });
  const [voice, setVoice] = useState<WidgetVoiceConfig>({
    enabled: true,
    position: 'bottom-center',
    size: 'md',
    color: 'var(--primary)',
    animation: 'glow',
  });
  const [articleCard, setArticleCard] = useState<CardPositions>(DEFAULT_POSITIONS);
  const [marketingCard, setMarketingCard] = useState<CardPositions>(DEFAULT_POSITIONS);
  const [cardTab, setCardTab] = useState<'article_card' | 'marketing_card'>('article_card');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const cacheRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    if (cacheRef.current === tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/tenants/${tenantId}/widget-config`)
      .then((r) => r.json())
      .then((data: WidgetLayout) => {
        cacheRef.current = tenantId;
        if (data.chat) setChat((prev) => ({ ...prev, ...data.chat }));
        if (data.voice) setVoice((prev) => ({ ...prev, ...data.voice }));
        if (data.cardPositions) {
          if (data.cardPositions.article_card) setArticleCard(data.cardPositions.article_card);
          if (data.cardPositions.marketing_card) setMarketingCard(data.cardPositions.marketing_card);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/widget-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat,
          voice,
          cardPositions: {
            article_card: articleCard,
            marketing_card: marketingCard,
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Chat Widget Card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Chat Widget</h3>
              <p className="text-xs text-muted-foreground">Ícone flutuante do assistente de IA</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={chat.enabled}
              onChange={(e) => setChat((p) => ({ ...p, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>

        {chat.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Posição</label>
              <select
                value={chat.position}
                onChange={(e) => setChat((p) => ({ ...p, position: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {POSITIONS.filter((p) => p.value !== 'bottom-center').map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tamanho</label>
              <select
                value={chat.size}
                onChange={(e) => setChat((p) => ({ ...p, size: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ícone</label>
              <select
                value={chat.icon}
                onChange={(e) => setChat((p) => ({ ...p, icon: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {CHAT_ICONS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Animação</label>
              <select
                value={chat.animation}
                onChange={(e) => setChat((p) => ({ ...p, animation: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {ANIMATIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={chat.color || '#4BC5FF'}
                  onChange={(e) => setChat((p) => ({ ...p, color: e.target.value }))}
                  className="h-8 w-8 rounded border bg-background cursor-pointer"
                />
                <input
                  type="text"
                  value={chat.color || ''}
                  onChange={(e) => setChat((p) => ({ ...p, color: e.target.value }))}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary font-mono"
                  placeholder="var(--primary)"
                />
              </div>
            </div>

            <div className="space-y-1.5 flex items-end">
              <a
                href={`/dashboard/${slug}/ai`}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurar IA
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Voice Widget Card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Voz Widget</h3>
              <p className="text-xs text-muted-foreground">Ícone flutuante do assistente de voz</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voice.enabled}
              onChange={(e) => setVoice((p) => ({ ...p, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>

        {voice.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Posição</label>
              <select
                value={voice.position}
                onChange={(e) => setVoice((p) => ({ ...p, position: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tamanho</label>
              <select
                value={voice.size}
                onChange={(e) => setVoice((p) => ({ ...p, size: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Animação</label>
              <select
                value={voice.animation}
                onChange={(e) => setVoice((p) => ({ ...p, animation: e.target.value as any }))}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {ANIMATIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={voice.color || '#4BC5FF'}
                  onChange={(e) => setVoice((p) => ({ ...p, color: e.target.value }))}
                  className="h-8 w-8 rounded border bg-background cursor-pointer"
                />
                <input
                  type="text"
                  value={voice.color || ''}
                  onChange={(e) => setVoice((p) => ({ ...p, color: e.target.value }))}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary font-mono"
                  placeholder="var(--primary)"
                />
              </div>
            </div>

            <div className="space-y-1.5 flex items-end">
              <a
                href={`/dashboard/${slug}/ai`}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurar IA
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Vote & Follow Positions Card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ArrowUpDown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Posições de ★ Voto e Seguir</h3>
            <p className="text-xs text-muted-foreground">
              Arraste os símbolos ao redor da borda dos cards
            </p>
          </div>
        </div>

        <div className="flex gap-1 border-b pb-2">
          {CARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCardTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                cardTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          {cardTab === 'article_card' ? (
            <CardPositionEditor
              value={articleCard}
              onChange={setArticleCard}
            />
          ) : (
            <CardPositionEditor
              value={marketingCard}
              onChange={setMarketingCard}
            />
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Widgets'}
        </button>
      </div>
    </div>
  );
}
