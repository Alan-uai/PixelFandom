'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Columns3 } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coleções</h1>
          <p className="text-muted-foreground mt-1">
            Coleções de dados customizados para sua wiki.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Columns3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma coleção ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((col) => (
            <Card key={col.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {col.name}
                </CardTitle>
                <CardDescription>
                  {col.item_count || 0} itens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {col.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {col.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
