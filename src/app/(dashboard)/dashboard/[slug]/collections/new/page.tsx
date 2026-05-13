'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

type FieldDef = {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'json';
  required: boolean;
  options?: string;
};

export default function NewCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [colSlug, setColSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([
    { name: '', type: 'text', required: false },
  ]);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!colSlug || colSlug === name.toLowerCase().replace(/[^a-z0-9-]/g, '-')) {
      setColSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    }
  };

  const addField = () => {
    setFields([...fields, { name: '', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FieldDef, value: any) => {
    const updated = [...fields];
    (updated[index] as any)[key] = value;
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !colSlug) return;
    setSaving(true);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!tenant) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Wiki não encontrada.' });
      setSaving(false);
      return;
    }

    const schema = {
      fields: fields
        .filter((f) => f.name.trim())
        .map((f) => ({
          name: f.name.trim(),
          type: f.type,
          required: f.required,
          options: f.options
            ? f.options.split(',').map((o) => o.trim()).filter(Boolean)
            : undefined,
        })),
    };

    const { error } = await supabase.from('custom_collections').insert({
      tenant_id: tenant.id,
      name,
      slug: colSlug,
      description: description || null,
      schema,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Coleção criada!' });
      router.push(`/dashboard/${slug}/collections`);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nova Coleção</CardTitle>
          <CardDescription>
            Crie uma coleção de dados estruturados para sua wiki.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Coleção</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Armas, Personagens, Itens..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Identificador (slug)</Label>
              <Input
                id="slug"
                value={colSlug}
                onChange={(e) => setColSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="armas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da coleção"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Campos do Schema</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Campo
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                      placeholder="nome_do_campo"
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="boolean">Sim/Não</option>
                        <option value="select">Opções</option>
                        <option value="json">JSON</option>
                      </select>
                      {field.type === 'select' && (
                        <Input
                          value={field.options || ''}
                          onChange={(e) => updateField(index, 'options', e.target.value)}
                          placeholder="op1, op2, op3"
                          className="h-8 text-xs flex-1"
                        />
                      )}
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, 'required', e.target.checked)}
                        />
                        Obrigatório
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={saving || !name || !colSlug} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Criar Coleção
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
