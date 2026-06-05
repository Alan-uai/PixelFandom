# Plano: Discord Bot — Configuração e Sincronia com PixelFandom

## Contexto

O bot do Discord está desatualizado e desconectado do sistema atual do site.
O bot **não fica neste repositório** — fica em repositório separado. Este plano
serve como referência de implementação para o outro repo.

## Stack recomendada

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Runtime | Node.js 20+ (LTS) | `discord.js` v14, ecossistema maduro |
| Discord lib | `discord.js` v14 | Suporte completo a guilds, threads, eventos, webhooks, embeds, componentes |
| DB client | `@supabase/supabase-js` | Mesmo cliente do site, RLS respeitado |
| Realtime | Supabase Realtime | Ouvir mudanças em `tenants.discord_config` sem polling |
| Deploy | Railway / Fly.io / Render | Long-running process, barato, suporte a WebSocket |
| Logging | `pino` | JSON estruturado, baixo overhead |

## Estrutura do repositório sugerida

```
pixelfandom-discord-bot/
├── src/
│   ├── index.ts              # Entrypoint: login + Realtime subscription
│   ├── supabase.ts           # Supabase client singleton
│   ├── config.ts             # ENV vars + defaults
│   ├── commands/
│   │   └── executor.ts       # Engine: trigger matching + action execution
│   ├── actions/
│   │   ├── index.ts          # Action router
│   │   ├── messages.ts       # send_message, edit_message, delete_message, etc
│   │   ├── reactions.ts      # add_reaction, remove_reaction, clear_reactions
│   │   ├── channels.ts       # create/delete/edit channel
│   │   ├── members.ts        # kick/ban/timeout/move/mute/deafen/disconnect
│   │   ├── roles.ts          # add/remove/create/delete/edit role
│   │   ├── threads.ts        # create/delete/archive/lock/unlock thread + members
│   │   ├── webhooks.ts       # create/execute/delete webhook
│   │   ├── events.ts         # create/edit/delete guild event
│   │   ├── emojis.ts         # create/delete emoji
│   │   ├── stickers.ts       # create/delete sticker
│   │   ├── invites.ts        # create_invite
│   │   └── misc.ts           # send_dm, crosspost_message, pin_message, etc
│   ├── variables/
│   │   └── resolver.ts       # {{var.name}} interpolation engine
│   ├── embeds/
│   │   └── builder.ts        # EmbedPayload → discord.js EmbedBuilder
│   ├── triggers/
│   │   └── matcher.ts        # exact / startsWith / includes / regex / mention
│   ├── cooldowns/
│   │   └── manager.ts        # Per-user per-command cooldown (Map + cleanup)
│   ├── permissions/
│   │   └── checker.ts        # allowedRoles + allowedChannels filtering
│   └── utils/
│       ├── logger.ts         # pino logger
│       └── retry.ts          # Exponential backoff for API calls
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Conexão com Supabase

```env
SUPABASE_URL=               # NEXT_PUBLIC_SUPABASE_URL (mesmo do site)
SUPABASE_SERVICE_KEY=       # service_role key (precisa de permissão total)
DISCORD_BOT_TOKEN=          # Bot token do Discord Developer Portal
DISCORD_CLIENT_ID=          # App ID
GUILD_ID=                   # Opcional: guild fixa de desenvolvimento
```

O bot usa **service_role** para ler `tenants.discord_config` e `discord_guilds`
sem depender de sessão de usuário.

## Fluxo de inicialização

1. Login do bot no Discord com `GatewayIntentBits.Guilds`,
   `MessageContent`, `GuildMessages`, `GuildMembers`, `GuildModeration`,
   `GuildVoiceStates`, `DirectMessages`, `GuildEmojisAndStickers`,
   `GuildMessageReactions`, `GuildWebhooks`, `GuildScheduledEvents`,
   `MessageContent` (privileged).

2. Buscar todas as linhas de `discord_guilds` onde `bot_enabled = true`.

3. Para cada guild com `tenant_id` não nulo, ler `tenants.discord_config`
   (JOIN ou query separada) e carregar a config na memória.

4. Inscrever-se no Realtime canal `tenants` com filtro por coluna
   `discord_config` — quando qualquer tenant alterar `discord_config`,
   recarregar a config daquele tenant.

5. Iniciar listener de mensagens (`client.on('messageCreate')`).

## Processamento de mensagens

```
messageCreate(event)
  ├─ ignorar se bot ou se DM sem config de tenant
  ├─ determinar tenant via discord_guilds.guild_id
  ├─ se tenant não encontrado → ignorar
  ├─ carregar config (bot_name, prefix, commands[])
  ├─ se !config.enabled → ignorar
  ├─ para cada cmd em config.custom_commands:
  │   ├─ se !cmd.enabled → próximo
  │   ├─ if cmd.allowedChannels.length && !channelId in list → próximo
  │   ├─ if cmd.allowedRoles.length && user sem nenhum role → próximo
  │   ├─ if cooldown ativo para (userId, cmd.id) → próximo
  │   ├─ match trigger:
  │   │   ├─ exact:     message.content === trigger
  │   │   ├─ startsWith: message.content.startsWith(prefix + trigger)
  │   │   ├─ includes:   message.content.includes(trigger)
  │   │   ├─ regex:      new RegExp(trigger).test(message.content)
  │   │   └─ mention:    message.mentions.has(client.user) &&
  │   │                  (trigger vazio || message.content.includes(trigger))
  │   ├─ se match:
  │   │   ├─ registrar cooldown
  │   │   ├─ executar ações (sequential ou parallel)
  │   │   └─ break (primeiro match vence)
  └─ fim
```

## Executor de Ações

Cada ação tem `type`, `payload`, `delay`.

### Sequencial
```ts
for (const action of actions) {
  await executeAction(action, context);  // message, guild, member, etc
  if (action.delay) await sleep(action.delay);
}
```

### Paralelo
```ts
await Promise.all(actions.map(a =>
  (async () => {
    await executeAction(a, context);
  })()
));
```

### Roteamento por tipo (`src/actions/index.ts`)

Cada action type mapeia para uma função específica. Exemplos:

#### send_message
```ts
// payload: { content, embeds: EmbedPayload[] }
const reply = await message.channel.send({
  content: resolveVariables(payload.content, context),
  embeds: payload.embeds?.map(buildEmbed) ?? [],
});
```

#### embed
```ts
// EmbedPayload → discord.js EmbedBuilder
new EmbedBuilder()
  .setTitle(resolveVars(e.title, ctx))
  .setDescription(resolveVars(e.description, ctx))
  .setColor(e.color ? parseInt(e.color.replace('#', ''), 16) : undefined)
  .setURL(e.url)
  .setTimestamp(e.timestamp ? new Date() : undefined)
  .setFooter(e.footer ? { text: resolveVars(e.footer.text, ctx), iconURL: e.footer.icon_url } : null)
  .setImage(e.image?.url)
  .setThumbnail(e.thumbnail?.url)
  .setAuthor(e.author ? { name: resolveVars(e.author.name, ctx), iconURL: e.author.icon_url, url: e.author.url } : null)
  .addFields(e.fields?.map(f => ({
    name: resolveVars(f.name, ctx),
    value: resolveVars(f.value, ctx),
    inline: f.inline,
  })) ?? []);
```

#### add_reaction / remove_reaction
```ts
// payload: { emoji }
if (type === 'add_reaction') await message.react(payload.emoji);
if (type === 'remove_reaction') await message.reactions.cache.get(payload.emoji)?.remove();
```

#### kick_member / ban_member / timeout_member
```ts
const member = await message.guild.members.fetch(context.targetUserId);
// kick:   member.kick(payload.reason)
// ban:    member.ban({ reason: payload.reason, deleteMessageDays: payload.deleteMessageDays })
// timeout: member.timeout(payload.duration * 1000, payload.reason)
```

#### add_role / remove_role
```ts
const member = await message.guild.members.fetch(context.targetUserId);
const role = message.guild.roles.cache.get(payload.roleId);
if (role) {
  if (type === 'add_role') await member.roles.add(role);
  if (type === 'remove_role') await member.roles.remove(role);
}
```

#### create_channel
```ts
await message.guild.channels.create({
  name: payload.name,
  type: channelTypeMap[payload.type],  // text/voice/forum/announcement
  parent: payload.parentId || undefined,
});
```

#### create_thread
```ts
const channel = message.guild.channels.cache.get(payload.channelId);
if (channel?.isTextBased()) {
  await channel.threads.create({
    name: payload.name,
    type: payload.type === 'private_thread' ? ChannelType.PrivateThread : ChannelType.PublicThread,
  });
}
```

#### execute_webhook
```ts
const webhook = new WebhookClient({ id: payload.webhookId, token: payload.webhookToken });
await webhook.send({ content: resolveVariables(payload.content, context) });
```

#### create_event
```ts
await message.guild.scheduledEvents.create({
  name: payload.name,
  description: payload.description,
  scheduledStartTime: new Date(payload.scheduledStart),
  scheduledEndTime: payload.scheduledEnd ? new Date(payload.scheduledEnd) : undefined,
  privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
  entityType: eventTypeMap[payload.entityType],
  channel: payload.channelId ? message.guild.channels.cache.get(payload.channelId) : undefined,
});
```

#### create_invite
```ts
const channel = message.guild.channels.cache.get(payload.channelId);
if (channel) {
  await channel.createInvite({
    maxAge: payload.maxAge,
    maxUses: payload.maxUses || undefined,
    reason: 'Comando personalizado',
  });
}
```

## Variáveis (Template Engine)

Arquivo: `src/variables/resolver.ts`

Função `resolveVariables(text: string, ctx: VariableContext): string`

Substitui `{{var.name}}` com base no contexto:

```ts
interface VariableContext {
  // user
  user: { id, username, displayName, discriminator, avatarURL, mention, tag, createdAt, joinedAt, bot, roles }
  // server
  guild: { id, name, iconURL, memberCount, ownerId, createdAt, description, premiumTier }
  // channel
  channel: { id, name, type, topic, parentId, createdAt }
  // message
  message: { id, content, cleanContent, url, createdAt, editedAt, attachments, hasImage }
  // command
  command: { name, trigger, prefix, args, argsRaw }
  // timestamp
  timestamp: { now, date, time, datetime, timestamp, unix, relative }
  // bot
  bot: { id, username, avatarURL, mention, uptime, ping }
  // wiki (metadata do tenant)
  wiki: { name, description, url, slug, logoURL, memberCount, articleCount }
  // codes (game codes — do tenant data ou tabela codes)
  codes: { active, expired, total, latest }
  // update
  update: { date, author, type, notes }
  // stats
  stats: { users, articles, pageViews, members }
}
```

Variáveis wiki/codes/update/stats vêm do banco (consultas ao Supabase)
e são cacheadas por TTL (ex: 5 minutos).

## Cooldown Manager

```ts
class CooldownManager {
  private map = new Map<string, number>();  // key: `${guildId}:${userId}:${cmdId}`
  set(guildId, userId, cmdId, seconds: number): void
  has(guildId, userId, cmdId): boolean
  cleanup(): void  // roda a cada 60s, remove expired
}
```

## Permission Checker

```ts
function canExecute(cmd: CustomCommand, message: Message): boolean {
  // allowedChannels: if non-empty, message.channelId must be in list
  // allowedRoles: if non-empty, member must have at least one role in list
  return true;
}
```

## Realtime Config Sync

```ts
const channel = supabase.channel('discord-config-changes');
channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'tenants', filter: `discord_config=neq.${JSON.stringify(null)}` },
  (payload) => {
    const tenantId = payload.new.id;
    const config = payload.new.discord_config as DiscordConfig;
    const guilds = await supabase.from('discord_guilds').select('guild_id').eq('tenant_id', tenantId);
    // Atualizar cache em memória para cada guild_id
    for (const g of guilds.data ?? []) {
      guildConfigCache.set(g.guild_id, config);
    }
  }
).subscribe();
```

## Variáveis de Ambiente (`.env.example`)

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=         # usado apenas para OAuth2 (opcional no bot)
LOG_LEVEL=info                 # trace | debug | info | warn | error
NODE_ENV=development
```

## Tratamento de Erros

- Cada ação é envolvida em try/catch individual — falha em uma não quebra as seguintes.
- Se `executionMode === 'parallel'`, usar `Promise.allSettled` em vez de `Promise.all`.
- Log estruturado com `pino`: `logger.info({ guildId, cmd: command.name, action: type }, 'Action executed')`.
- Erros de permissão do Discord são logados mas não interrompem o fluxo.
- Rate limits: `discord.js` já faz retry automático com `REST` queue.

## Checklist de Implementação

### Fase 1 — Base
- [ ] Criar repo, package.json, tsconfig, ESLint
- [ ] Configurar Supabase client com service_role
- [ ] Login do bot + gateway intents
- [ ] Carregar configs iniciais do banco (JOIN discord_guilds → tenants)
- [ ] Listener messageCreate com roteamento básico
- [ ] Trigger matcher (exact, startsWith, includes)
- [ ] Variáveis resolver (user, server, channel, message, timestamp, bot)
- [ ] Cooldown manager
- [ ] Permission checker
- [ ] Executor sequencial e paralelo

### Fase 2 — Ações
- [ ] send_message + embeds completos
- [ ] edit_message, delete_message
- [ ] add_reaction, remove_reaction, clear_reactions
- [ ] pin_message, unpin_message, crosspost_message
- [ ] create_channel, delete_channel, edit_channel
- [ ] kick_member, ban_member, unban_member
- [ ] timeout_member
- [ ] move_member, mute_member, deafen_member, disconnect_member
- [ ] add_role, remove_role
- [ ] create_role, delete_role, edit_role
- [ ] create_thread, delete_thread, archive_thread, unarchive_thread, lock_thread, unlock_thread
- [ ] add_thread_member, remove_thread_member
- [ ] create_emoji, delete_emoji
- [ ] create_sticker, delete_sticker
- [ ] create_event, delete_event, edit_event
- [ ] create_webhook, execute_webhook, delete_webhook
- [ ] send_dm
- [ ] create_invite
- [ ] set_bot_status

### Fase 3 — Avançado
- [ ] Trigger type: regex
- [ ] Trigger type: mention
- [ ] Realtime config sync (Supabase Realtime)
- [ ] Variáveis: wiki, codes, update, stats (consultas ao banco)
- [ ] Migração de comandos legados (resposta única → actions[])
- [ ] Healthcheck endpoint (ex: `/health` HTTP para monitoria)
- [ ] Graceful shutdown (SIGTERM → destroy client + fechar conexões)

### Fase 4 — Produção
- [ ] Dockerfile (Node.js 20 Alpine)
- [ ] Deploy config (Railway / Fly.io / Render)
- [ ] Logging estruturado com pino
- [ ] Rate limit handling (discord.js já gerencia)
- [ ] Testes unitários para trigger matcher e variable resolver
- [ ] Testes de integração com Supabase local

## Estrutura de Dados (referência)

```ts
// tenants.discord_config (JSONB)
interface DiscordConfig {
  bot_name?: string;
  bot_avatar?: string | null;
  prefix?: string;              // default '!'
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  enabled?: boolean;
  custom_commands?: CustomCommand[];
}

// discord_guilds table
interface DiscordGuild {
  guild_id: string;             // PK
  tenant_id: string | null;     // FK → tenants(id)
  channel_id: string | null;
  bot_enabled: boolean;
}
```

## Comportamento do Bot por Guild

O bot pode estar em múltiplos servidores ao mesmo tempo, cada um vinculado
a um tenant diferente (ou a nenhum). O comportamento é:

1. Mensagem recebida → lookup `discord_guilds` por `guild_id`
2. Se `tenant_id` nulo ou `bot_enabled = false` → ignorar
3. Se `tenant_id` existe → carregar `tenants.discord_config` daquele tenant
4. Se `config.enabled = false` → ignorar
5. Processar comandos com a config daquele tenant

Isso significa que um único processo de bot atende N tenants simultaneamente,
cada um com sua própria config, prefix, comandos, embeds.

## Dependências (package.json)

```json
{
  "dependencies": {
    "discord.js": "^14.16",
    "@supabase/supabase-js": "^2.45",
    "pino": "^9.4",
    "pino-pretty": "^11.2",
    "dotenv": "^16.4"
  },
  "devDependencies": {
    "typescript": "^5.6",
    "@types/node": "^20",
    "tsx": "^4.19",
    "vitest": "^2.1"
  }
}
```

## Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```
