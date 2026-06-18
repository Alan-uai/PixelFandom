'use client';

import { useState } from 'react';
import { MessageSquare, Heart, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommentForm } from './comment-form';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type CommentUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  reputation_points: number;
};

type Comment = {
  id: string;
  content: string;
  depth: number;
  edited_at: string | null;
  created_at: string;
  user: CommentUser;
  replies: Comment[];
};

type Props = {
  comments: Comment[];
  articleId: string;
  tenantId: string;
  tenantSlug: string;
  onRefresh: () => void;
};

export function CommentThread({ comments, articleId, tenantId, tenantSlug, onRefresh }: Props) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { toast } = useToast();

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      setEditingId(null);
      toast({ title: 'Comentário editado' });
      onRefresh();
    } else {
      toast({ variant: 'destructive', title: 'Erro ao editar' });
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    await fetch(`/api/comments/${commentId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });
    onRefresh();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 pl-4 border-l-2 border-muted' : ''}`}>
      <div className="group flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
        <Link href={`/profile/${comment.user.id}`} className="shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
            {comment.user.avatar_url ? (
              <img src={comment.user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (comment.user.display_name || comment.user.username || '?')[0].toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.user.id}`} className="text-sm font-medium hover:text-primary">
              {comment.user.display_name || comment.user.username || 'Usuário'}
            </Link>
            <span className="text-[10px] text-muted-foreground">
              {comment.user.reputation_points} pts
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            {comment.edited_at && (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground italic">editado</span>
              </>
            )}
          </div>

          {editingId === comment.id ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[60px] rounded-md border bg-background p-2 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
          )}

          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReaction(comment.id, '👍')} title="Gostei">
              <Heart className="h-3.5 w-3.5" />
            </Button>
            {!isReply && comment.depth < 3 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} title="Responder">
                <Reply className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                articleId={articleId}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                parentId={comment.id}
                onCreated={() => { setReplyingTo(null); onRefresh(); }}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum comentário ainda. Seja o primeiro!</p>
      </div>
    );
  }

  return <div className="space-y-2">{comments.map((c) => renderComment(c))}</div>;
}
