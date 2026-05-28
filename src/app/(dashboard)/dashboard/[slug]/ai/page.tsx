'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Headphones, Mic, MicOff } from 'lucide-react';
import { WakeWordDetector } from '@/lib/voice/wakeWord';

export default function WikiAIConfigPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [wakeWordText, setWakeWordText] = useState('Psycho');
  const [chatName, setChatName] = useState('Assistente');
  const [botLogo, setBotLogo] = useState('');

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
          setWakeWordText((config.wake_word_text as string) || 'Psycho');
          setChatName((config.chat_name as string) || 'Assistente');
          setBotLogo((config.bot_logo as string) || '');
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
          ...(tenant.ai_config as Record<string, unknown> || {}),
          model,
          wake_word_text: wakeWordText,
          chat_name: chatName,
          bot_logo: botLogo,
          wake_word: true,
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
            <Label>Logo do Bot</Label>
            <ImageUpload
              bucket="wiki-images"
              pathPrefix={`bot-logos/${slug}`}
              value={botLogo}
              onChange={setBotLogo}
              previewSize="w-16 h-16 rounded-full"
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG ou GIF. Recomendado: 256x256.</p>
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
          <CardDescription>Configure a palavra de ativação do assistente de voz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wakeWordText">Nome do Agente (Palavra de Ativação)</Label>
            <Input
              id="wakeWordText"
              value={wakeWordText}
              onChange={(e) => setWakeWordText(e.target.value)}
              placeholder="Psycho"
            />
            <p className="text-xs text-muted-foreground">
              Nome usado para ativar o assistente de voz por comando de voz.
            </p>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Testar Assistente de Voz
            </CardTitle>
            <CardDescription>Teste a palavra de ativação do agente de voz.</CardDescription>
          </CardHeader>
          <CardContent>
            <WakeWordTest wakeWordText={wakeWordText} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WakeWordTest({ wakeWordText }: { wakeWordText: string }) {
  const [state, setState] = useState<'idle' | 'requesting' | 'listening' | 'detected'>('idle');
  const detectorRef = useRef<WakeWordDetector | null>(null);

  const cleanup = () => {
    detectorRef.current?.stop();
    detectorRef.current = null;
  };

  const startTest = async () => {
    cleanup();
    setState('requesting');
    try {
      const detector = new WakeWordDetector([wakeWordText]);
      detector.onWakeDetected(() => setState('detected'));
      await detector.start();
      detectorRef.current = detector;
      setState('listening');
    } catch {
      cleanup();
      setState('idle');
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Button onClick={startTest} className="gap-2">
            <Mic className="h-4 w-4" />
            Iniciar Teste
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Clique para testar a palavra de ativação. Será solicitada permissão para usar o microfone.
          </p>
        </div>
      )}

      {state === 'requesting' && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Solicitando permissão do microfone...</span>
        </div>
      )}

      {state === 'listening' && (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2">
            <Mic className="h-8 w-8 text-primary animate-pulse" />
            <p className="text-sm font-medium">Ouvindo...</p>
            <p className="text-sm text-muted-foreground">
              Diga: <span className="font-semibold text-foreground">&ldquo;{wakeWordText}&rdquo;</span>
            </p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={cleanup} className="gap-2">
              <MicOff className="h-4 w-4" />
              Parar
            </Button>
          </div>
        </div>
      )}

      {state === 'detected' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-green-500">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Palavra de ativação detectada!</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            O assistente de voz está funcionando corretamente.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cleanup} className="gap-2">
              <MicOff className="h-4 w-4" />
              Parar
            </Button>
            <Button size="sm" onClick={startTest} className="gap-2">
              <Mic className="h-4 w-4" />
              Testar Novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
