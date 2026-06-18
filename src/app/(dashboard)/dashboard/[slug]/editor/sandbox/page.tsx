'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { useToast } from '@/hooks/use-toast';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';
import { Loader2, Save, Trash2, Send, FlaskConical, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EditorSandboxPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      if (!tenant) throw new Error('Tenant not found');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      if (draftId) {
        await supabase.from('sandbox_drafts').update({
          title, content, updated_at: new Date().toISOString(),
        }).eq('id', draftId);
      } else {
        const { data } = await supabase.from('sandbox_drafts').insert({
          tenant_id: tenant.id,
          user_id: user.user.id,
          title, content,
        }).select('id').single();
        if (data) setDraftId(data.id);
      }
      setIsDirty(false);
      toast({ title: 'Salvo', description: 'Rascunho salvo no sandbox.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar rascunho.' });
    } finally {
      setSaving(false);
    }
  }, [slug, title, content, draftId, toast]);

  const handleDiscard = useCallback(() => {
    setTitle('');
    setContent('');
    setDraftId(null);
    setIsDirty(false);
    toast({ title: 'Descartado', description: 'Sandbox limpo.' });
  }, [toast]);

  const handlePromoteToArticle = useCallback(async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O título é obrigatório.' });
      return;
    }
    try {
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      if (!tenant) throw new Error('Tenant not found');

      const { data: article } = await supabase.from('wiki_articles').insert({
        tenant_id: tenant.id,
        title: title.trim(),
        content,
        status: 'draft',
      }).select('id').single();

      if (article) {
        toast({ title: 'Artigo criado', description: 'Rascunho promovido para artigo.' });
        router.push(`/dashboard/${slug}/editor/${article.id}`);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar artigo.' });
    }
  }, [slug, title, content, router, toast]);

  useRegisterUnsavedChanges({ isDirty, onSave: handleSave, onDiscard: handleDiscard });

  const renderPreview = useCallback((text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (bolded.includes('<strong>')) {
        return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: bolded }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-1">{line}</p>;
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold">Sandbox</h1>
            <p className="text-sm text-muted-foreground">
              Ambiente isolado para testar conteúdo sem afetar artigos reais.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDiscard} className="gap-1.5 text-destructive">
            <Trash2 className="h-4 w-4" />
            Descartar
          </Button>
          <Button size="sm" onClick={handlePromoteToArticle} className="gap-1.5">
            <Send className="h-4 w-4" />
            Promover para Artigo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit" className="flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4" />
            Editar
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Visualizar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-4 space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
              placeholder="Título do artigo..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Conteúdo (Markdown)</Label>
            <FloatingLabelTextarea
              label="Escreva seu conteúdo aqui..."
              value={content}
              onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
              className="min-h-[400px] mt-1 text-sm font-mono"
            />
          </div>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <WeldingCard>
            <CardHeader>
              <CardTitle>{title || 'Sem título'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none" ref={previewRef}>
                {content ? renderPreview(content) : 'Nenhum conteúdo para visualizar.'}
              </div>
            </CardContent>
          </WeldingCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
