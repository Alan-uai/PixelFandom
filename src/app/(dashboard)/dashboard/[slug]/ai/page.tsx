'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send, Bot, Headphones, Volume2 } from 'lucide-react';
import type { Tenant } from '@/supabase/client';
import type { VoiceName } from '@/lib/voice/geminilive';

export default function WikiAIConfigPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [voiceName, setVoiceName] = useState<VoiceName>('Kore');
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordText, setWakeWordText] = useState('Psycho');
  const [chatName, setChatName] = useState('Assistente');
  const [publicMode, setPublicMode] = useState(false);

  useEffect(() => {
    supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setTenant(data);
          setEnabled(data.ai_enabled);
          const config = data.ai_config as Record<string, unknown> || {};
          setModel((config.model as string) || 'openai/gpt-4o-mini');
          setSystemPrompt((config.system_prompt as string) || '');
          setVoiceName((config.voice_name as VoiceName) || 'Kore');
          setVoiceVolume((config.voice_volume as number) || 80);
          setWakeWordEnabled((config.wake_word as boolean) || false);
          setWakeWordText((config.wake_word_text as string) || 'Psycho');
          setChatName((config.chat_name as string) || 'Assistente');
          setPublicMode((config.public_mode as boolean) || false);
        }
        setLoading(false);
      });
  }, [slug]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({
        ai_enabled: enabled,
        ai_config: {
          model,
          system_prompt: systemPrompt,
          voice_name: voiceName,
          voice_volume: voiceVolume,
          wake_word: wakeWordEnabled,
          wake_word_text: wakeWordText,
          chat_name: chatName,
          public_mode: publicMode,
        },
      })
      .eq('id', tenant.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Configuração de IA salva!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assistente IA</h1>
        <p className="text-muted-foreground mt-1">
          Configure o assistente inteligente da sua wiki.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ativação</CardTitle>
          <CardDescription>Ligue ou desligue o assistente IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Assistente IA</p>
              <p className="text-sm text-muted-foreground">
                Quando ativo, usuários podem conversar com a IA sobre o conteúdo da wiki.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Modelo</CardTitle>
          <CardDescription>Escolha o modelo de IA e personalize o comportamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="openai/gpt-4o-mini"
            />
            <p className="text-xs text-muted-foreground">
              Modelo OpenRouter (ex: openai/gpt-4o-mini, anthropic/claude-3-haiku)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chatName">Nome do Chat</Label>
            <Input
              id="chatName"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Assistente"
            />
            <p className="text-xs text-muted-foreground">
              Nome exibido na interface do chat (texto e voz).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">System Prompt</Label>
            <Textarea
              id="prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Você é um assistente especializado em..."
            />
            <p className="text-xs text-muted-foreground">
              Instruções que definem o comportamento e conhecimento do assistente.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Agente de Voz
          </CardTitle>
          <CardDescription>Configure o assistente de voz para a wiki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voiceName">Voz do Assistente</Label>
            <select
              id="voiceName"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value as VoiceName)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Puck">Puck — Equilibrada</option>
              <option value="Kore">Kore — Brilhante e clara</option>
              <option value="Charon">Charon — Grave e acolhedora</option>
              <option value="Fenrir">Fenrir — Forte e assertiva</option>
              <option value="Aoede">Aoede — Suave e melódica</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Volume ({voiceVolume}%)
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              value={voiceVolume}
              onChange={(e) => setVoiceVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Wake Word</p>
              <p className="text-xs text-muted-foreground">Ativar assistente por comando de voz</p>
            </div>
            <input
              type="checkbox"
              checked={wakeWordEnabled}
              onChange={(e) => setWakeWordEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wakeWordText">Palavra de Ativação</Label>
            <Input
              id="wakeWordText"
              value={wakeWordText}
              onChange={(e) => setWakeWordText(e.target.value)}
              placeholder="Psycho"
            />
            <p className="text-xs text-muted-foreground">
              Palavra dita para ativar o assistente de voz.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Modo Público</p>
              <p className="text-xs text-muted-foreground">Menos sensível a ruídos</p>
            </div>
            <input
              type="checkbox"
              checked={publicMode}
              onChange={(e) => setPublicMode(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Testar Assistente</CardTitle>
            <CardDescription>Faça uma pergunta para testar a configuração.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChatTest slug={slug} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChatTest({ slug }: { slug: string }) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
        body: JSON.stringify({ message }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResponse(text);
      }
    } catch {
      setResponse('Erro ao testar o assistente.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem de teste..."
          onKeyDown={(e) => e.key === 'Enter' && handleTest()}
        />
        <Button onClick={handleTest} disabled={loading || !message.trim()} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {response && (
        <div className="flex gap-2 rounded-lg bg-muted p-3">
          <Bot className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
          <p className="text-sm whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
