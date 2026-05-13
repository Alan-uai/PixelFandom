'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Columns3, Database } from 'lucide-react';
import type { CustomCollection } from '@/supabase/client';

export default function CollectionsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!tenant) { setLoading(false); return; }

      const { data } = await supabase
        .from('custom_collections')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('name');

      if (data) setCollections(data);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coleções</h1>
          <p className="text-muted-foreground mt-1">
            Dados estruturados customizados para sua wiki.
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${slug}/collections/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Coleção
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma coleção ainda. Crie sua primeira coleção de dados estruturados.
            </p>
            <Button asChild>
              <Link href={`/dashboard/${slug}/collections/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Coleção
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => {
            const fields = (col.schema as any)?.fields || [];
            return (
              <Link key={col.id} href={`/dashboard/${slug}/collections/${col.id}`}>
                <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Columns3 className="h-4 w-4 text-primary" />
                      {col.name}
                    </CardTitle>
                    <CardDescription>
                      {col.item_count || 0} itens
                      {fields.length > 0 && ` · ${fields.length} campos`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {col.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {col.description}
                      </p>
                    )}
                    {fields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {fields.slice(0, 4).map((f: any) => (
                          <span
                            key={f.name}
                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {f.name}
                          </span>
                        ))}
                        {fields.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{fields.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
