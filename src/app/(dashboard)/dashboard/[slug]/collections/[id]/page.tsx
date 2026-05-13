'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Database } from 'lucide-react';
import type { CustomCollection, CollectionItem } from '@/supabase/client';

export default function CollectionItemsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const collectionId = params.id as string;
  const { toast } = useToast();

  const [collection, setCollection] = useState<CustomCollection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: col } = await supabase
      .from('custom_collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (col) {
      setCollection(col);
      const { data: itemsData } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });
      if (itemsData) setItems(itemsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [collectionId]);

  const handleDelete = async (itemId: string) => {
    setDeleting(itemId);
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast({ title: 'Item removido.' });
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!collection) {
    return <p className="text-muted-foreground">Coleção não encontrada.</p>;
  }

  const fields = (collection.schema as any)?.fields || [];
  const titleField = fields.find((f: any) => f.name === 'name' || f.name === 'title' || f.name === 'nome') || fields[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/dashboard/${slug}/collections`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para coleções
          </Link>
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground mt-1">{collection.description}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/dashboard/${slug}/collections/${collectionId}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
          <div className="col-span-8">Item</div>
          <div className="col-span-2 text-center">Criado em</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Database className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum item nesta coleção.</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href={`/dashboard/${slug}/collections/${collectionId}/new`}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar Primeiro Item
              </Link>
            </Button>
          </div>
        ) : (
          items.map((item) => {
            const titleValue = titleField
              ? (item.data as any)[titleField.name]
              : item.id.slice(0, 8);
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-t hover:bg-muted/30 transition-colors"
              >
                <div className="col-span-8">
                  <Link
                    href={`/dashboard/${slug}/collections/${collectionId}/edit/${item.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {titleValue || item.id.slice(0, 8)}
                  </Link>
                </div>
                <div className="col-span-2 text-center text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/${slug}/collections/${collectionId}/edit/${item.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
