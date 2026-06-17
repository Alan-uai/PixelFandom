'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { CommentForm } from './comment-form';
import { CommentThread } from './comment-thread';
import { supabase } from '@/supabase';

type Props = {
  articleId: string;
  tenantId: string;
  tenantSlug: string;
};

export function CommentsSection({ articleId, tenantId, tenantSlug }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const cacheRef = useRef<any[] | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchComments = useCallback(async () => {
    if (cacheRef.current) {
      setComments(cacheRef.current);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/comments?article_id=${articleId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        cacheRef.current = data;
        setComments(data);
      }
    } catch {/* noop */} finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    cacheRef.current = null;
    fetchComments();
  }, [fetchComments]);

  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        Comentários ({comments.length})
      </h2>

      <div className="mb-6">
        {user ? (
          <CommentForm
            articleId={articleId}
            tenantId={tenantId}
            tenantSlug={tenantSlug}
            onCreated={fetchComments}
          />
        ) : (
          <div className="text-center py-4 rounded-lg border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Faça <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="text-primary hover:underline">login</button> para comentar.
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Carregando comentários...</div>
      ) : (
        <CommentThread
          comments={comments}
          articleId={articleId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          onRefresh={fetchComments}
        />
      )}
    </div>
  );
}
