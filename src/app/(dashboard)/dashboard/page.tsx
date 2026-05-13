'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/supabase';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Settings, ExternalLink, Loader2 } from 'lucide-react';
import type { Tenant } from '@/supabase/client';

export default function DashboardPage() {
  const { user } = useUser();
  const [tenants, setTenants] = useState<(Tenant & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('tenant_members')
      .select('role, tenant:tenants(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setTenants(
            data
              .filter((d: any) => d.tenant)
              .map((d: any) => ({ ...d.tenant, role: d.role }))
          );
        }
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Minhas Wikis</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas wikis ou crie uma nova.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Wiki
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground mb-4">
              Você ainda não tem nenhuma wiki.
            </p>
            <Button asChild>
              <Link href="/dashboard/new">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Wiki
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tenant.logo_url && (
                    <img src={tenant.logo_url} alt="" className="h-5 w-5 rounded" />
                  )}
                  {tenant.name}
                </CardTitle>
                <CardDescription>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {tenant.role}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {tenant.description || 'Sem descrição'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/${tenant.slug}/settings`}>
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Gerenciar
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/w/${tenant.slug}`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Ver
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
