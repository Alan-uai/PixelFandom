'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface GuildDataState {
  connected: boolean;
  user: DiscordUser | null;
  guilds: DiscordGuild[];
  selectedGuild: DiscordGuild | null;
  channels: DiscordChannel[];
  roles: DiscordRole[];
  loading: boolean;
  error: string | null;
}

interface GuildDataContextType extends GuildDataState {
  connect: () => void;
  disconnect: () => void;
  selectGuild: (guildId: string) => Promise<void>;
  refreshGuilds: () => Promise<void>;
}

const GuildDataContext = createContext<GuildDataContextType | null>(null);

export function GuildDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuildDataState>({
    connected: false,
    user: null,
    guilds: [],
    selectedGuild: null,
    channels: [],
    roles: [],
    loading: false,
    error: null,
  });

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const checkConnection = useCallback(() => {
    const userName = getCookie('discord_user_name');
    const userId = getCookie('discord_user_id');
    const avatar = getCookie('discord_user_avatar');
    if (userName && userId) {
      setState((prev) => ({
        ...prev,
        connected: true,
        user: { id: userId, username: userName, avatar: avatar || null },
      }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    document.cookie = `discord_return_to=${encodeURIComponent(returnTo)}; path=/; max-age=300; SameSite=Lax`;
    fetch(`/api/discord/authorize?return_to=${encodeURIComponent(returnTo)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
      })
      .catch(() => {
        setState((prev) => ({ ...prev, error: 'Falha ao iniciar conexão com Discord' }));
      });
  }, []);

  const disconnect = useCallback(() => {
    document.cookie = 'discord_access_token=; max-age=0; path=/';
    document.cookie = 'discord_refresh_token=; max-age=0; path=/';
    document.cookie = 'discord_user_id=; max-age=0; path=/';
    document.cookie = 'discord_user_name=; max-age=0; path=/';
    document.cookie = 'discord_user_avatar=; max-age=0; path=/';
    setState({
      connected: false,
      user: null,
      guilds: [],
      selectedGuild: null,
      channels: [],
      roles: [],
      loading: false,
      error: null,
    });
  }, []);

  const refreshGuilds = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/discord/guilds');
      if (!res.ok) throw new Error('Failed to fetch guilds');
      const guilds = await res.json();
      setState((prev) => ({ ...prev, guilds, loading: false }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: 'Erro ao buscar servidores', loading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.connected && state.guilds.length === 0) {
      refreshGuilds();
    }
  }, [state.connected, state.guilds.length, refreshGuilds]);

  const selectGuild = useCallback(async (guildId: string) => {
    const guild = state.guilds.find((g) => g.id === guildId);
    if (!guild) return;
    setState((prev) => ({ ...prev, selectedGuild: guild, loading: true }));

    try {
      const [channelsRes, rolesRes] = await Promise.all([
        fetch(`/api/discord/guilds/${guildId}/channels`),
        fetch(`/api/discord/guilds/${guildId}/roles`),
      ]);

      const channels: DiscordChannel[] = channelsRes.ok ? await channelsRes.json() : [];
      const roles: DiscordRole[] = rolesRes.ok ? await rolesRes.json() : [];

      setState((prev) => ({
        ...prev,
        channels: channels.filter((c: any) => [0, 2, 5, 13, 15].includes(c.type)),
        roles: roles.filter((r: any) => r.name !== '@everyone'),
        selectedGuild: guild,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, error: 'Erro ao buscar dados do servidor', loading: false }));
    }
  }, [state.guilds]);

  return (
    <GuildDataContext.Provider value={{ ...state, connect, disconnect, selectGuild, refreshGuilds }}>
      {children}
    </GuildDataContext.Provider>
  );
}

export function useGuildData() {
  const ctx = useContext(GuildDataContext);
  if (!ctx) throw new Error('useGuildData must be used within GuildDataProvider');
  return ctx;
}
