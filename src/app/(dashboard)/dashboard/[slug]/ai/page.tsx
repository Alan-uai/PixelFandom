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
import { Loader2, Save, Send, Bot } from 'lucide-react';
import type { Tenant } from '@/supabase/client';

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
        ai_config: { model, system_prompt: systemPrompt },
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
