'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase';

type Props = {
  articleId: string;
  tenantId: string;
  tenantSlug: string;
  parentId?: string;
  onCreated: () => void;
  onCancel?: () => void;
};

export function CommentForm({ articleId, tenantId, tenantSlug, parentId, onCreated, onCancel }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: 'destructive', title: 'Faça login para comentar' });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify({ article_id: articleId, tenant_id: tenantId, content: content.trim(), parent_id: parentId || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setContent('');
      toast({ title: parentId ? 'Resposta publicada!' : 'Comentário publicado!' });
      onCreated();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Escreva uma resposta...' : 'Compartilhe seus pensamentos...'}
        className="min-h-[80px] text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={sending || !content.trim()}>
          {sending ? 'Enviando...' : parentId ? 'Responder' : 'Comentar'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
