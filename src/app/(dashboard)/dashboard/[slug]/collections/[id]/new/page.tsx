'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CustomCollection } from '@/supabase/client';

export default function NewItemPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const collectionId = params.id as string;
  const { user } = useUser();
  const { toast } = useToast();

  const [collection, setCollection] = useState<CustomCollection | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('custom_collections')
      .select('*')
      .eq('id', collectionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCollection(data);
          const fields = (data.schema as any)?.fields || [];
          const defaults: Record<string, any> = {};
          fields.forEach((f: any) => {
            if (f.type === 'boolean') defaults[f.name] = false;
            else if (f.type === 'number') defaults[f.name] = 0;
            else defaults[f.name] = '';
          });
          setFormData(defaults);
        }
        setLoading(false);
      });
  }, [collectionId]);

  const setField = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from('collection_items').insert({
      collection_id: collectionId,
      data: formData,
      created_by: user.id,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Item criado!' });
      router.push(`/dashboard/${slug}/collections/${collectionId}`);
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

  if (!collection) {
    return <p className="text-muted-foreground">Coleção não encontrada.</p>;
  }

  const fields = (collection.schema as any)?.fields || [];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/${slug}/collections/${collectionId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para {collection.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Novo Item em {collection.name}</CardTitle>
          <CardDescription>
            Preencha os campos de acordo com o schema da coleção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.length === 0 ? (
              <div className="space-y-2">
                <Label>Dados (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData, null, 2)}
                  onChange={(e) => {
                    try { setFormData(JSON.parse(e.target.value)); } catch { }
                  }}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            ) : (
              fields.map((field: any) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={field.name}>
                    {field.name}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {field.type === 'text' && (
                    <Input
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => setField(field.name, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'number' && (
                    <Input
                      id={field.name}
                      type="number"
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setField(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                      required={field.required}
                    />
                  )}

                  {field.type === 'boolean' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!formData[field.name]}
                        onChange={(e) => setField(field.name, e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-muted-foreground">Ativo</span>
                    </label>
                  )}

                  {field.type === 'select' && (
                    <select
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => setField(field.name, e.target.value)}
                      className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required={field.required}
                    >
                      <option value="">Selecione...</option>
                      {(field.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'json' && (
                    <Textarea
                      id={field.name}
                      value={typeof formData[field.name] === 'object' ? JSON.stringify(formData[field.name], null, 2) : formData[field.name] || ''}
                      onChange={(e) => {
                        try { setField(field.name, JSON.parse(e.target.value)); }
                        catch { setField(field.name, e.target.value); }
                      }}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  )}
                </div>
              ))
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Item
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
