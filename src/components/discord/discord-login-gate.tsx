'use client';

import { useEffect } from 'react';
import { Select3D } from '@/components/ui/select3d';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, LogOut, RefreshCw, Server } from 'lucide-react';
import { useGuildData } from './guild-data-context';

export function DiscordLoginGate() {
  const {
    connected, user, guilds, selectedGuild,
    channels, roles, loading, error,
    connect, disconnect, selectGuild, refreshGuilds,
  } = useGuildData();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('discord') === 'connected') {
      const url = new URL(window.location.pathname, window.location.origin);
      window.history.replaceState({}, '', url.toString());
      refreshGuilds();
    }
  }, [refreshGuilds]);

  if (!connected) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            Conectar Discord
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Discord para gerenciar o bot e acessar canais, cargos e servidores.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
          <Button onClick={connect} size="lg" className="gap-2">
            <LogIn className="h-5 w-5" />
            Conectar com Discord
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Discord Conectado
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshGuilds} disabled={loading} className="h-8 w-8 p-0">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={disconnect} className="h-8 text-xs gap-1">
              <LogOut className="h-3 w-3" /> Desconectar
            </Button>
          </div>
        </CardTitle>
        {user && (
          <CardDescription>
            Conectado como <strong>{user.username}</strong>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium">Servidor</label>
          <Select3D
            value={selectedGuild?.id ?? ''}
            options={[
              { value: '', label: 'Selecione um servidor...' },
              ...guilds.map((g: { id: string; name: string }) => ({ value: g.id, label: g.name })),
            ]}
            onChange={(v) => v && selectGuild(v)}
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados do servidor...
          </div>
        )}

        {selectedGuild && !loading && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Canais de Texto ({channels.filter((c) => c.type === 0).length})</label>
              <div className="max-h-32 overflow-y-auto rounded border p-1 space-y-0.5">
                {channels.filter((c) => c.type === 0).map((ch) => (
                  <p key={ch.id} className="text-[11px] px-1 py-0.5 text-muted-foreground truncate">
                    # {ch.name}
                  </p>
                ))}
                {channels.filter((c) => c.type === 0).length === 0 && (
                  <p className="text-[10px] text-muted-foreground p-1">Nenhum canal de texto</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Cargos ({roles.length})</label>
              <div className="max-h-32 overflow-y-auto rounded border p-1 space-y-0.5">
                {roles.map((r) => (
                  <p key={r.id} className="text-[11px] px-1 py-0.5 truncate" style={{ color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : undefined }}>
                    {r.name}
                  </p>
                ))}
                {roles.length === 0 && (
                  <p className="text-[10px] text-muted-foreground p-1">Nenhum cargo</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
