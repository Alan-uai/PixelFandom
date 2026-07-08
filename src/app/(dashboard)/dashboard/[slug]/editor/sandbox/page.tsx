'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('sandbox');
  const tc = useTranslations('common');

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
      toast({ title: t('saved'), description: t('saved_desc') });
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: t('save_failed') });
    } finally {
      setSaving(false);
    }
  }, [slug, title, content, draftId, toast, t, tc]);

  const handleDiscard = useCallback(() => {
    setTitle('');
    setContent('');
    setDraftId(null);
    setIsDirty(false);
    toast({ title: t('discarded'), description: t('discarded_desc') });
  }, [toast, t]);

  const handlePromoteToArticle = useCallback(async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: tc('error'), description: t('title_required') });
      return;
    }
    try {
      const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      if (!tenant) throw new Error('Tenant not found');

      const articleSlug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: article } = await supabase.from('wiki_articles').insert({
        tenant_id: tenant.id,
        title: title.trim(),
        slug: articleSlug,
        content,
        status: 'draft',
      }).select('id').single();

      if (article) {
        toast({ title: t('article_created'), description: t('article_created_desc') });
        router.push(`/dashboard/${slug}/editor/${article.id}`);
      }
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: t('article_create_failed') });
    }
  }, [slug, title, content, router, toast, t, tc]);

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
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDiscard} className="gap-1.5 text-destructive">
            <Trash2 className="h-4 w-4" />
            {t('discard')}
          </Button>
          <Button size="sm" onClick={handlePromoteToArticle} className="gap-1.5">
            <Send className="h-4 w-4" />
            {t('promote')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit" className="flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4" />
            {t('edit_tab')}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {t('preview_tab')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-4 space-y-4">
          <div>
            <Label>{t('title_label')}</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
              placeholder={t('title_placeholder')}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('content_label')}</Label>
            <FloatingLabelTextarea
              label={t('content_placeholder')}
              value={content}
              onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
              className="min-h-[400px] mt-1 text-sm font-mono"
            />
          </div>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <WeldingCard>
            <CardHeader>
              <CardTitle>{title || t('untitled')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none" ref={previewRef}>
                {content ? renderPreview(content) : t('no_content')}
              </div>
            </CardContent>
          </WeldingCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
