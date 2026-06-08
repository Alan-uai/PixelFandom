'use client';

export type BotActionType =
  | 'send_message'
  | 'edit_message'
  | 'delete_message'
  | 'add_reaction'
  | 'remove_reaction'
  | 'clear_reactions'
  | 'crosspost_message'
  | 'pin_message'
  | 'unpin_message'
  | 'create_channel'
  | 'delete_channel'
  | 'edit_channel'
  | 'kick_member'
  | 'ban_member'
  | 'unban_member'
  | 'timeout_member'
  | 'move_member'
  | 'mute_member'
  | 'deafen_member'
  | 'disconnect_member'
  | 'add_role'
  | 'remove_role'
  | 'create_role'
  | 'delete_role'
  | 'edit_role'
  | 'create_thread'
  | 'delete_thread'
  | 'archive_thread'
  | 'lock_thread'
  | 'unarchive_thread'
  | 'unlock_thread'
  | 'add_thread_member'
  | 'remove_thread_member'
  | 'create_emoji'
  | 'delete_emoji'
  | 'create_sticker'
  | 'delete_sticker'
  | 'create_event'
  | 'delete_event'
  | 'edit_event'
  | 'create_webhook'
  | 'execute_webhook'
  | 'delete_webhook'
  | 'send_dm'
  | 'create_invite'
  | 'set_bot_status';

export const ACTION_TYPE_CATEGORIES: Record<string, { label: string; types: BotActionType[] }> = {
  messages: {
    label: 'Mensagens',
    types: ['send_message', 'edit_message', 'delete_message', 'crosspost_message', 'pin_message', 'unpin_message'],
  },
  threads: {
    label: 'Threads',
    types: ['create_thread', 'delete_thread', 'archive_thread', 'unarchive_thread', 'lock_thread', 'unlock_thread', 'add_thread_member', 'remove_thread_member'],
  },
  reactions: {
    label: 'Reações & Emojis',
    types: ['add_reaction', 'remove_reaction', 'clear_reactions', 'create_emoji', 'delete_emoji'],
  },
  channels: {
    label: 'Canais',
    types: ['create_channel', 'delete_channel', 'edit_channel'],
  },
  members: {
    label: 'Membros',
    types: ['kick_member', 'ban_member', 'unban_member', 'timeout_member', 'move_member', 'mute_member', 'deafen_member', 'disconnect_member', 'add_role', 'remove_role'],
  },
  roles: {
    label: 'Cargos',
    types: ['create_role', 'delete_role', 'edit_role'],
  },
  webhooks: {
    label: 'Webhooks',
    types: ['create_webhook', 'execute_webhook', 'delete_webhook'],
  },
  events: {
    label: 'Eventos',
    types: ['create_event', 'delete_event', 'edit_event'],
  },
  misc: {
    label: 'Outros',
    types: ['send_dm', 'create_invite', 'set_bot_status', 'create_sticker', 'delete_sticker'],
  },
};

export const ACTION_LABELS: Record<BotActionType, string> = {
  send_message: 'Enviar Mensagem',
  edit_message: 'Editar Mensagem',
  delete_message: 'Excluir Mensagem',
  add_reaction: 'Adicionar Reação',
  remove_reaction: 'Remover Reação',
  clear_reactions: 'Limpar Reações',
  crosspost_message: 'Publicar em Anúncios',
  pin_message: 'Fixar Mensagem',
  unpin_message: 'Desafixar Mensagem',
  create_channel: 'Criar Canal',
  delete_channel: 'Excluir Canal',
  edit_channel: 'Editar Canal',
  kick_member: 'Expulsar Membro',
  ban_member: 'Banir Membro',
  unban_member: 'Desbanir Usuário',
  timeout_member: 'Silenciar Membro',
  move_member: 'Mover Membro',
  mute_member: 'Silenciar Voz',
  deafen_member: 'Ensurdecer Membro',
  disconnect_member: 'Desconectar da Voz',
  add_role: 'Atribuir Cargo',
  remove_role: 'Remover Cargo',
  create_role: 'Criar Cargo',
  delete_role: 'Excluir Cargo',
  edit_role: 'Editar Cargo',
  create_thread: 'Criar Thread',
  delete_thread: 'Excluir Thread',
  archive_thread: 'Arquivar Thread',
  unarchive_thread: 'Desarquivar Thread',
  lock_thread: 'Bloquear Thread',
  unlock_thread: 'Destrancar Thread',
  add_thread_member: 'Adicionar Membro na Thread',
  remove_thread_member: 'Remover Membro da Thread',
  create_emoji: 'Criar Emoji',
  delete_emoji: 'Excluir Emoji',
  create_sticker: 'Criar Sticker',
  delete_sticker: 'Excluir Sticker',
  create_event: 'Criar Evento',
  delete_event: 'Excluir Evento',
  edit_event: 'Editar Evento',
  create_webhook: 'Criar Webhook',
  execute_webhook: 'Executar Webhook',
  delete_webhook: 'Excluir Webhook',
  send_dm: 'Enviar DM',
  create_invite: 'Criar Convite',
  set_bot_status: 'Alterar Status do Bot',
};

export const ACTION_ICONS: Record<BotActionType, string> = {
  send_message: 'MessageSquare',
  edit_message: 'MessageSquare',
  delete_message: 'Trash2',
  add_reaction: 'SmilePlus',
  remove_reaction: 'SmilePlus',
  clear_reactions: 'Eraser',
  crosspost_message: 'Megaphone',
  pin_message: 'Pin',
  unpin_message: 'PinOff',
  create_channel: 'Hash',
  delete_channel: 'Trash2',
  edit_channel: 'Settings2',
  kick_member: 'DoorOpen',
  ban_member: 'Ban',
  unban_member: 'Undo2',
  timeout_member: 'Clock',
  move_member: 'ArrowRight',
  mute_member: 'VolumeX',
  deafen_member: 'EarOff',
  disconnect_member: 'WifiOff',
  add_role: 'ShieldPlus',
  remove_role: 'ShieldX',
  create_role: 'ShieldPlus',
  delete_role: 'ShieldX',
  edit_role: 'Shield',
  create_thread: 'MessagesSquare',
  delete_thread: 'Trash2',
  archive_thread: 'Archive',
  unarchive_thread: 'ArchiveRestore',
  lock_thread: 'Lock',
  unlock_thread: 'LockOpen',
  add_thread_member: 'UserPlus',
  remove_thread_member: 'UserX',
  create_emoji: 'SmilePlus',
  delete_emoji: 'Trash2',
  create_sticker: 'Sticker',
  delete_sticker: 'Trash2',
  create_event: 'CalendarPlus',
  delete_event: 'CalendarX',
  edit_event: 'Calendar',
  create_webhook: 'Webhook',
  execute_webhook: 'Webhook',
  delete_webhook: 'Trash2',
  send_dm: 'Mail',
  create_invite: 'Link',
  set_bot_status: 'Power',
};

export type CommandVariableCategory =
  | 'user' | 'server' | 'channel' | 'message'
  | 'command' | 'timestamp' | 'bot'
  | 'wiki' | 'codes' | 'update' | 'stats'
  | 'content' | 'game';

export interface CommandVariable {
  key: string;
  label: string;
  description: string;
  category: CommandVariableCategory;
  syntax: string;
}

export const COMMAND_VARIABLES: CommandVariable[] = [
  { key: 'user.name', label: 'Nome do Usuário', description: 'Nome do usuário no Discord', category: 'user', syntax: '{{user.name}}' },
  { key: 'user.mention', label: 'Menção do Usuário', description: '@menção do usuário', category: 'user', syntax: '{{user.mention}}' },
  { key: 'user.id', label: 'ID do Usuário', description: 'ID único do usuário', category: 'user', syntax: '{{user.id}}' },
  { key: 'user.tag', label: 'Tag do Usuário', description: 'Usuário#0000', category: 'user', syntax: '{{user.tag}}' },
  { key: 'user.displayname', label: 'Nome de Exibição', description: 'Apelido no servidor', category: 'user', syntax: '{{user.displayname}}' },
  { key: 'user.avatar', label: 'Avatar do Usuário', description: 'URL do avatar', category: 'user', syntax: '{{user.avatar}}' },
  { key: 'user.created_at', label: 'Data de Criação', description: 'Data de criação da conta', category: 'user', syntax: '{{user.created_at}}' },
  { key: 'user.joined_at', label: 'Data de Entrada', description: 'Quando entrou no servidor', category: 'user', syntax: '{{user.joined_at}}' },
  { key: 'user.roles', label: 'Cargos do Usuário', description: 'Lista de nomes dos cargos', category: 'user', syntax: '{{user.roles}}' },
  { key: 'user.role_ids', label: 'IDs dos Cargos', description: 'Lista de IDs dos cargos', category: 'user', syntax: '{{user.role_ids}}' },
  { key: 'user.is_owner', label: 'É Dono?', description: 'Se o usuário é dono do servidor (true/false)', category: 'user', syntax: '{{user.is_owner}}' },
  { key: 'user.is_booster', label: 'É Booster?', description: 'Se o usuário impulsiona o servidor (true/false)', category: 'user', syntax: '{{user.is_booster}}' },
  { key: 'user.mention_count', label: 'Menções Recebidas', description: 'Quantas vezes foi mencionado na mensagem', category: 'user', syntax: '{{user.mention_count}}' },
  { key: 'server.name', label: 'Nome do Servidor', description: 'Nome do servidor Discord', category: 'server', syntax: '{{server.name}}' },
  { key: 'server.id', label: 'ID do Servidor', description: 'ID único do servidor', category: 'server', syntax: '{{server.id}}' },
  { key: 'server.icon', label: 'Ícone do Servidor', description: 'URL do ícone do servidor', category: 'server', syntax: '{{server.icon}}' },
  { key: 'server.owner', label: 'Dono do Servidor', description: 'Menção do dono', category: 'server', syntax: '{{server.owner}}' },
  { key: 'server.membercount', label: 'Total de Membros', description: 'Quantidade total de membros', category: 'server', syntax: '{{server.membercount}}' },
  { key: 'server.humancount', label: 'Membros Humanos', description: 'Quantidade de membros humanos', category: 'server', syntax: '{{server.humancount}}' },
  { key: 'server.botcount', label: 'Bots no Servidor', description: 'Quantidade de bots', category: 'server', syntax: '{{server.botcount}}' },
  { key: 'server.boostcount', label: 'Total de Boosts', description: 'Quantidade de impulsionamentos', category: 'server', syntax: '{{server.boostcount}}' },
  { key: 'server.boostlevel', label: 'Nível de Boost', description: 'Nível do servidor (0-3)', category: 'server', syntax: '{{server.boostlevel}}' },
  { key: 'server.description', label: 'Descrição do Servidor', description: 'Descrição do servidor', category: 'server', syntax: '{{server.description}}' },
  { key: 'server.banner', label: 'Banner do Servidor', description: 'URL do banner do servidor', category: 'server', syntax: '{{server.banner}}' },
  { key: 'server.splash', label: 'Splash do Servidor', description: 'URL da tela de convite', category: 'server', syntax: '{{server.splash}}' },
  { key: 'server.afk_channel', label: 'Canal AFK', description: 'Nome do canal AFK', category: 'server', syntax: '{{server.afk_channel}}' },
  { key: 'server.verification_level', label: 'Nível de Verificação', description: 'Nível de verificação do servidor', category: 'server', syntax: '{{server.verification_level}}' },
  { key: 'server.features', label: 'Recursos do Servidor', description: 'Lista de recursos ativos', category: 'server', syntax: '{{server.features}}' },
  { key: 'server.rules_channel', label: 'Canal de Regras', description: 'Menção do canal de regras', category: 'server', syntax: '{{server.rules_channel}}' },
  { key: 'server.system_channel', label: 'Canal do Sistema', description: 'Menção do canal de sistema', category: 'server', syntax: '{{server.system_channel}}' },
  { key: 'channel.name', label: 'Nome do Canal', description: 'Nome do canal atual', category: 'channel', syntax: '{{channel.name}}' },
  { key: 'channel.mention', label: 'Menção do Canal', description: '#menção do canal', category: 'channel', syntax: '{{channel.mention}}' },
  { key: 'channel.id', label: 'ID do Canal', description: 'ID único do canal', category: 'channel', syntax: '{{channel.id}}' },
  { key: 'channel.topic', label: 'Tópico do Canal', description: 'Descrição/tópico do canal', category: 'channel', syntax: '{{channel.topic}}' },
  { key: 'channel.type', label: 'Tipo do Canal', description: 'Tipo (texto/voz/fórum/etc)', category: 'channel', syntax: '{{channel.type}}' },
  { key: 'channel.position', label: 'Posição do Canal', description: 'Posição na lista de canais', category: 'channel', syntax: '{{channel.position}}' },
  { key: 'channel.parent', label: 'Categoria', description: 'Nome da categoria pai', category: 'channel', syntax: '{{channel.parent}}' },
  { key: 'channel.slowmode', label: 'Modo Lento', description: 'Delay do modo lento em segundos', category: 'channel', syntax: '{{channel.slowmode}}' },
  { key: 'channel.nsfw', label: 'NSFW?', description: 'Se o canal é NSFW (true/false)', category: 'channel', syntax: '{{channel.nsfw}}' },
  { key: 'message.content', label: 'Conteúdo da Mensagem', description: 'Texto completo da mensagem', category: 'message', syntax: '{{message.content}}' },
  { key: 'message.id', label: 'ID da Mensagem', description: 'ID único da mensagem', category: 'message', syntax: '{{message.id}}' },
  { key: 'message.link', label: 'Link da Mensagem', description: 'URL para pular até a mensagem', category: 'message', syntax: '{{message.link}}' },
  { key: 'message.clean_content', label: 'Conteúdo Limpo', description: 'Texto sem formatação de menções', category: 'message', syntax: '{{message.clean_content}}' },
  { key: 'message.author', label: 'Autor da Mensagem', description: 'Nome do autor da mensagem', category: 'message', syntax: '{{message.author}}' },
  { key: 'message.author_id', label: 'ID do Autor', description: 'ID do autor da mensagem', category: 'message', syntax: '{{message.author_id}}' },
  { key: 'message.attachments', label: 'Anexos', description: 'Lista de URLs dos anexos', category: 'message', syntax: '{{message.attachments}}' },
  { key: 'message.has_embeds', label: 'Tem Embeds?', description: 'Se a mensagem tem embeds (true/false)', category: 'message', syntax: '{{message.has_embeds}}' },
  { key: 'message.mentions', label: 'Menções na Mensagem', description: 'Lista de usuários mencionados', category: 'message', syntax: '{{message.mentions}}' },
  { key: 'message.mention_roles', label: 'Cargos Mencionados', description: 'Lista de cargos mencionados', category: 'message', syntax: '{{message.mention_roles}}' },
  { key: 'command.name', label: 'Nome do Comando', description: 'Nome do comando executado', category: 'command', syntax: '{{command.name}}' },
  { key: 'command.trigger', label: 'Trigger Acionado', description: 'Texto do trigger que ativou', category: 'command', syntax: '{{command.trigger}}' },
  { key: 'command.trigger_type', label: 'Tipo de Trigger', description: 'Como o comando foi ativado', category: 'command', syntax: '{{command.trigger_type}}' },
  { key: 'args.full', label: 'Argumentos Completos', description: 'Texto completo após o trigger', category: 'command', syntax: '{{args.full}}' },
  { key: 'args.1', label: 'Argumento #1', description: 'Primeiro argumento', category: 'command', syntax: '{{args.1}}' },
  { key: 'args.2', label: 'Argumento #2', description: 'Segundo argumento', category: 'command', syntax: '{{args.2}}' },
  { key: 'args.3', label: 'Argumento #3', description: 'Terceiro argumento', category: 'command', syntax: '{{args.3}}' },
  { key: 'args.4', label: 'Argumento #4', description: 'Quarto argumento', category: 'command', syntax: '{{args.4}}' },
  { key: 'args.5', label: 'Argumento #5', description: 'Quinto argumento', category: 'command', syntax: '{{args.5}}' },
  { key: 'args.6', label: 'Argumento #6', description: 'Sexto argumento', category: 'command', syntax: '{{args.6}}' },
  { key: 'args.7', label: 'Argumento #7', description: 'Sétimo argumento', category: 'command', syntax: '{{args.7}}' },
  { key: 'args.8', label: 'Argumento #8', description: 'Oitavo argumento', category: 'command', syntax: '{{args.8}}' },
  { key: 'args.9', label: 'Argumento #9', description: 'Nono argumento', category: 'command', syntax: '{{args.9}}' },
  { key: 'args.count', label: 'Total de Argumentos', description: 'Quantidade de argumentos', category: 'command', syntax: '{{args.count}}' },
  { key: 'prefix', label: 'Prefixo do Bot', description: 'Prefixo configurado para comandos', category: 'command', syntax: '{{prefix}}' },
  { key: 'timestamp', label: 'Timestamp Unix', description: 'Timestamp atual em segundos', category: 'timestamp', syntax: '{{timestamp}}' },
  { key: 'timestamp.ms', label: 'Timestamp (ms)', description: 'Timestamp atual em milissegundos', category: 'timestamp', syntax: '{{timestamp.ms}}' },
  { key: 'date', label: 'Data Atual', description: 'Data no formato ISO (YYYY-MM-DD)', category: 'timestamp', syntax: '{{date}}' },
  { key: 'time', label: 'Hora Atual', description: 'Hora no formato HH:MM:SS', category: 'timestamp', syntax: '{{time}}' },
  { key: 'datetime', label: 'Data e Hora', description: 'Data e hora completas', category: 'timestamp', syntax: '{{datetime}}' },
  { key: 'timestamp.short', label: 'Data Curta', description: 'Data curta (DD/MM/AAAA)', category: 'timestamp', syntax: '{{timestamp.short}}' },
  { key: 'timestamp.long', label: 'Data Longa', description: 'Data completa por extenso', category: 'timestamp', syntax: '{{timestamp.long}}' },
  { key: 'timestamp.relative', label: 'Tempo Relativo', description: 'Tempo relativo (há 5 minutos)', category: 'timestamp', syntax: '{{timestamp.relative}}' },
  { key: 'bot.name', label: 'Nome do Bot', description: 'Nome do bot no Discord', category: 'bot', syntax: '{{bot.name}}' },
  { key: 'bot.id', label: 'ID do Bot', description: 'ID único do bot', category: 'bot', syntax: '{{bot.id}}' },
  { key: 'bot.avatar', label: 'Avatar do Bot', description: 'URL do avatar do bot', category: 'bot', syntax: '{{bot.avatar}}' },
  { key: 'bot.ping', label: 'Latência do Bot', description: 'Ping do bot em ms', category: 'bot', syntax: '{{bot.ping}}' },
  { key: 'bot.uptime', label: 'Tempo Ativo', description: 'Há quanto tempo o bot está online', category: 'bot', syntax: '{{bot.uptime}}' },
  { key: 'bot.servers', label: 'Servidores do Bot', description: 'Quantidade de servidores que o bot está', category: 'bot', syntax: '{{bot.servers}}' },
  { key: 'bot.commands_ran', label: 'Comandos Executados', description: 'Total de comandos executados', category: 'bot', syntax: '{{bot.commands_ran}}' },
  { key: 'wiki.name', label: 'Nome da Wiki', description: 'Nome da wiki/tenant', category: 'wiki', syntax: '{{wiki.name}}' },
  { key: 'wiki.slug', label: 'Slug da Wiki', description: 'Identificador único da wiki', category: 'wiki', syntax: '{{wiki.slug}}' },
  { key: 'wiki.url', label: 'URL da Wiki', description: 'Link para a wiki', category: 'wiki', syntax: '{{wiki.url}}' },
  { key: 'wiki.description', label: 'Descrição da Wiki', description: 'Descrição da wiki/tenant', category: 'wiki', syntax: '{{wiki.description}}' },
  { key: 'wiki.logo', label: 'Logo da Wiki', description: 'URL do logo da wiki', category: 'wiki', syntax: '{{wiki.logo}}' },
  { key: 'wiki.cover', label: 'Capa da Wiki', description: 'URL da imagem de capa', category: 'wiki', syntax: '{{wiki.cover}}' },
  { key: 'wiki.article_count', label: 'Artigos na Wiki', description: 'Quantidade de artigos publicados', category: 'wiki', syntax: '{{wiki.article_count}}' },
  { key: 'wiki.last_updated', label: 'Última Atualização', description: 'Data da última atualização da wiki', category: 'wiki', syntax: '{{wiki.last_updated}}' },
  { key: 'wiki.created_at', label: 'Criação da Wiki', description: 'Data de criação da wiki', category: 'wiki', syntax: '{{wiki.created_at}}' },
  { key: 'wiki.favicon', label: 'Favicon', description: 'URL do favicon da wiki', category: 'wiki', syntax: '{{wiki.favicon}}' },
  { key: 'wiki.custom_domain', label: 'Domínio Customizado', description: 'Domínio personalizado da wiki', category: 'wiki', syntax: '{{wiki.custom_domain}}' },
  { key: 'wiki.game_url', label: 'URL do Jogo', description: 'Link para o site oficial do jogo', category: 'wiki', syntax: '{{wiki.game_url}}' },
  { key: 'wiki.og_image', label: 'Imagem OG', description: 'URL da imagem para compartilhamento social', category: 'wiki', syntax: '{{wiki.og_image}}' },
  { key: 'wiki.is_public', label: 'É Pública?', description: 'Se a wiki está visível publicamente (true/false)', category: 'wiki', syntax: '{{wiki.is_public}}' },
  { key: 'wiki.updated_at', label: 'Modificação', description: 'Data da última modificação da configuração', category: 'wiki', syntax: '{{wiki.updated_at}}' },
  { key: 'wiki.member_count', label: 'Membros', description: 'Quantidade de membros cadastrados na wiki', category: 'wiki', syntax: '{{wiki.member_count}}' },
  { key: 'wiki.page_count', label: 'Páginas', description: 'Quantidade de landing pages da wiki', category: 'wiki', syntax: '{{wiki.page_count}}' },
  { key: 'wiki.comment_count', label: 'Comentários', description: 'Total de comentários em artigos', category: 'wiki', syntax: '{{wiki.comment_count}}' },
  { key: 'wiki.theme_preset', label: 'Tema', description: 'Nome do preset de tema ativo', category: 'wiki', syntax: '{{wiki.theme_preset}}' },
  { key: 'wiki.primary_color', label: 'Cor Primária', description: 'Cor primária do tema (HSL)', category: 'wiki', syntax: '{{wiki.primary_color}}' },
  { key: 'wiki.accent_color', label: 'Cor de Destaque', description: 'Cor de destaque do tema (HSL)', category: 'wiki', syntax: '{{wiki.accent_color}}' },
  { key: 'wiki.latest_article', label: 'Último Artigo', description: 'Título do artigo mais recente', category: 'wiki', syntax: '{{wiki.latest_article}}' },
  { key: 'wiki.latest_article_url', label: 'URL do Último Artigo', description: 'Link para o artigo mais recente', category: 'wiki', syntax: '{{wiki.latest_article_url}}' },
  { key: 'wiki.latest_article_author', label: 'Autor do Último Artigo', description: 'Nome do autor do artigo mais recente', category: 'wiki', syntax: '{{wiki.latest_article_author}}' },
  { key: 'wiki.latest_article_date', label: 'Data do Último Artigo', description: 'Data de publicação do artigo mais recente', category: 'wiki', syntax: '{{wiki.latest_article_date}}' },
  { key: 'codes.all', label: 'Todos os Códigos', description: 'Lista de todos os códigos do jogo', category: 'codes', syntax: '{{codes.all}}' },
  { key: 'codes.available', label: 'Códigos Disponíveis', description: 'Lista de códigos ativos', category: 'codes', syntax: '{{codes.available}}' },
  { key: 'codes.expired', label: 'Códigos Expirados', description: 'Lista de códigos expirados', category: 'codes', syntax: '{{codes.expired}}' },
  { key: 'codes.count', label: 'Total de Códigos', description: 'Quantidade total de códigos', category: 'codes', syntax: '{{codes.count}}' },
  { key: 'codes.redeemed_today', label: 'Resgatados Hoje', description: 'Códigos resgatados hoje', category: 'codes', syntax: '{{codes.redeemed_today}}' },
  { key: 'codes.total_redeemed', label: 'Total Resgatados', description: 'Total de resgates já feitos', category: 'codes', syntax: '{{codes.total_redeemed}}' },
  { key: 'codes.last_code', label: 'Último Código', description: 'O código mais recente adicionado', category: 'codes', syntax: '{{codes.last_code}}' },
  { key: 'update.title', label: 'Título do Update', description: 'Título da atualização mais recente', category: 'update', syntax: '{{update.title}}' },
  { key: 'update.context', label: 'Contexto do Update', description: 'Descrição da atualização', category: 'update', syntax: '{{update.context}}' },
  { key: 'update.version', label: 'Versão do Update', description: 'Número da versão mais recente', category: 'update', syntax: '{{update.version}}' },
  { key: 'update.date', label: 'Data do Update', description: 'Data da última atualização', category: 'update', syntax: '{{update.date}}' },
  { key: 'update.author', label: 'Autor do Update', description: 'Quem publicou a atualização', category: 'update', syntax: '{{update.author}}' },
  { key: 'update.type', label: 'Tipo de Update', description: 'Tipo (patch/major/hotfix)', category: 'update', syntax: '{{update.type}}' },
  { key: 'update.notes', label: 'Notas do Update', description: 'Notas de lançamento', category: 'update', syntax: '{{update.notes}}' },
  { key: 'stats.users', label: 'Total de Usuários', description: 'Quantidade de usuários da wiki', category: 'stats', syntax: '{{stats.users}}' },
  { key: 'stats.articles', label: 'Total de Artigos', description: 'Quantidade de artigos na wiki', category: 'stats', syntax: '{{stats.articles}}' },
  { key: 'stats.page_views', label: 'Visualizações', description: 'Total de visualizações de página', category: 'stats', syntax: '{{stats.page_views}}' },
  { key: 'stats.members', label: 'Membros da Wiki', description: 'Membros cadastrados na wiki', category: 'stats', syntax: '{{stats.members}}' },
  { key: 'content.total_articles', label: 'Total de Artigos', description: 'Quantidade total de artigos publicados', category: 'content', syntax: '{{content.total_articles}}' },
  { key: 'content.total_comments', label: 'Total de Comentários', description: 'Total de comentários em artigos', category: 'content', syntax: '{{content.total_comments}}' },
  { key: 'content.total_landing_pages', label: 'Landing Pages', description: 'Quantidade de landing pages publicadas', category: 'content', syntax: '{{content.total_landing_pages}}' },
  { key: 'content.total_page_views', label: 'Visualizações', description: 'Total de visualizações de páginas', category: 'content', syntax: '{{content.total_page_views}}' },
  { key: 'content.latest_article', label: 'Artigo Recente', description: 'Título do artigo mais recente', category: 'content', syntax: '{{content.latest_article}}' },
  { key: 'content.latest_article_url', label: 'URL do Artigo Recente', description: 'Link para o artigo mais recente', category: 'content', syntax: '{{content.latest_article_url}}' },
  { key: 'content.latest_article_author', label: 'Autor do Artigo Recente', description: 'Autor do artigo mais recente', category: 'content', syntax: '{{content.latest_article_author}}' },
  { key: 'content.latest_article_date', label: 'Data do Artigo Recente', description: 'Data de publicação do artigo mais recente', category: 'content', syntax: '{{content.latest_article_date}}' },
  { key: 'content.recent_articles', label: 'Artigos Recentes', description: 'Lista dos 5 artigos mais recentes', category: 'content', syntax: '{{content.recent_articles}}' },
  { key: 'content.top_article', label: 'Artigo Popular', description: 'Título do artigo mais visto', category: 'content', syntax: '{{content.top_article}}' },
  { key: 'content.top_article_url', label: 'URL do Artigo Popular', description: 'Link para o artigo mais visto', category: 'content', syntax: '{{content.top_article_url}}' },
  { key: 'content.articles_this_month', label: 'Artigos do Mês', description: 'Artigos criados neste mês', category: 'content', syntax: '{{content.articles_this_month}}' },
  { key: 'content.total_tags', label: 'Total de Tags', description: 'Quantidade de tags únicas na wiki', category: 'content', syntax: '{{content.total_tags}}' },
  { key: 'content.total_images', label: 'Total de Imagens', description: 'Quantidade de imagens nos artigos', category: 'content', syntax: '{{content.total_images}}' },
  { key: 'content.categories', label: 'Categorias', description: 'Lista de coleções/categorias disponíveis', category: 'content', syntax: '{{content.categories}}' },
  { key: 'game.total_weapons', label: 'Total de Armas', description: 'Quantidade total de armas no banco de dados', category: 'game', syntax: '{{game.total_weapons}}' },
  { key: 'game.total_armors', label: 'Total de Armaduras', description: 'Quantidade total de armaduras', category: 'game', syntax: '{{game.total_armors}}' },
  { key: 'game.total_rings', label: 'Total de Anéis', description: 'Quantidade total de anéis', category: 'game', syntax: '{{game.total_rings}}' },
  { key: 'game.total_bosses', label: 'Total de Chefes', description: 'Quantidade total de chefes', category: 'game', syntax: '{{game.total_bosses}}' },
  { key: 'game.total_enemies', label: 'Total de Inimigos', description: 'Quantidade total de inimigos', category: 'game', syntax: '{{game.total_enemies}}' },
  { key: 'game.total_worlds', label: 'Total de Mundos', description: 'Quantidade total de mundos', category: 'game', syntax: '{{game.total_worlds}}' },
  { key: 'game.total_potions', label: 'Total de Poções', description: 'Quantidade total de poções', category: 'game', syntax: '{{game.total_potions}}' },
  { key: 'game.total_upgrades', label: 'Total de Upgrades', description: 'Quantidade total de upgrades', category: 'game', syntax: '{{game.total_upgrades}}' },
  { key: 'game.total_codes', label: 'Total de Códigos', description: 'Quantidade total de códigos promocionais', category: 'game', syntax: '{{game.total_codes}}' },
  { key: 'game.total_crafting', label: 'Receitas de Crafting', description: 'Quantidade total de receitas de crafting', category: 'game', syntax: '{{game.total_crafting}}' },
  { key: 'game.total_items', label: 'Total de Itens', description: 'Total geral de itens cadastrados no jogo', category: 'game', syntax: '{{game.total_items}}' },
  { key: 'game.active_codes', label: 'Códigos Ativos', description: 'Quantidade de códigos promocionais ativos', category: 'game', syntax: '{{game.active_codes}}' },
  { key: 'game.weapon_list', label: 'Lista de Armas', description: 'Lista com nomes de todas as armas', category: 'game', syntax: '{{game.weapon_list}}' },
  { key: 'game.boss_list', label: 'Lista de Chefes', description: 'Lista com nomes de todos os chefes', category: 'game', syntax: '{{game.boss_list}}' },
  { key: 'game.enemy_list', label: 'Lista de Inimigos', description: 'Lista com nomes de todos os inimigos', category: 'game', syntax: '{{game.enemy_list}}' },
  { key: 'game.world_list', label: 'Lista de Mundos', description: 'Lista com nomes de todos os mundos', category: 'game', syntax: '{{game.world_list}}' },
  { key: 'game.latest_weapon', label: 'Arma Recente', description: 'Nome da arma adicionada mais recentemente', category: 'game', syntax: '{{game.latest_weapon}}' },
  { key: 'game.latest_boss', label: 'Chefe Recente', description: 'Nome do chefe adicionado mais recentemente', category: 'game', syntax: '{{game.latest_boss}}' },
  { key: 'game.rarest_weapon', label: 'Arma Mais Rara', description: 'Arma com a maior raridade', category: 'game', syntax: '{{game.rarest_weapon}}' },
  { key: 'game.highest_damage_weapon', label: 'Arma de Maior Dano', description: 'Arma com o maior dano base', category: 'game', syntax: '{{game.highest_damage_weapon}}' },
  { key: 'game.best_armor', label: 'Melhor Armadura', description: 'Armadura com a melhor defesa', category: 'game', syntax: '{{game.best_armor}}' },
  { key: 'game.version', label: 'Versão do Jogo', description: 'Versão atual do jogo', category: 'game', syntax: '{{game.version}}' },
  { key: 'game.last_update', label: 'Última Atualização', description: 'Data da última atualização do jogo', category: 'game', syntax: '{{game.last_update}}' },
  { key: 'game.resource_list', label: 'Lista de Recursos', description: 'Lista de recursos/materiais do jogo', category: 'game', syntax: '{{game.resource_list}}' },
  { key: 'game.build_presets', label: 'Presets de Build', description: 'Lista de presets de build disponíveis', category: 'game', syntax: '{{game.build_presets}}' },
];

export const VARIABLE_CATEGORY_LABELS: Record<CommandVariableCategory, string> = {
  user: 'Usuário',
  server: 'Servidor',
  channel: 'Canal',
  message: 'Mensagem',
  command: 'Comando',
  timestamp: 'Data/Hora',
  bot: 'Bot',
  wiki: 'Wiki',
  codes: 'Códigos',
  update: 'Atualizações',
  stats: 'Estatísticas',
  content: 'Conteúdo',
  game: 'Jogo',
};

export function getVariablesByCategory(): Record<CommandVariableCategory, CommandVariable[]> {
  const grouped: Record<string, CommandVariable[]> = {};
  for (const v of COMMAND_VARIABLES) {
    if (!grouped[v.category]) grouped[v.category] = [];
    grouped[v.category].push(v);
  }
  return grouped as Record<CommandVariableCategory, CommandVariable[]>;
}

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedPayload {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  timestamp?: boolean;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
  fields?: EmbedField[];
}

export interface BotAction {
  id: string;
  type: BotActionType;
  payload: Record<string, any>;
  delay: number;
}

export type TriggerType = 'exact' | 'startsWith' | 'includes' | 'regex' | 'mention';

export type ExecutionMode = 'sequential' | 'parallel';

export interface CustomCommand {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string[];
  triggerType: TriggerType;
  executionMode: ExecutionMode;
  cooldown: number;
  allowedRoles: string[];
  allowedChannels: string[];
  actions: BotAction[];
}

export interface IngestConfig {
  id: string;
  source_channel_id: string;
  source_channel_name: string;
  target_table: string;
  target_label: string;
  trigger_type: 'all' | 'command';
  command_prefix: string;
  enabled: boolean;
}

export interface DiscordConfig {
  bot_name?: string;
  bot_avatar?: string | null;
  prefix?: string;
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  custom_commands?: CustomCommand[];
  enabled?: boolean;

  text_chat_channel_id?: string;
  text_chat_channel_name?: string;
  curation_channel_id?: string;
  curation_channel_name?: string;

  support_role_id?: string;
  support_role_name?: string;
  member_role_id?: string;
  member_role_name?: string;
  editor_role_id?: string;
  editor_role_name?: string;
  admin_role_id?: string;
  admin_role_name?: string;

  auto_post_codes_enabled?: boolean;
  auto_post_codes_channel_id?: string;
  auto_post_codes_channel_name?: string;
  auto_post_articles_enabled?: boolean;
  auto_post_articles_channel_id?: string;
  auto_post_articles_channel_name?: string;
  auto_post_updates_enabled?: boolean;
  auto_post_updates_channel_id?: string;
  auto_post_updates_channel_name?: string;

  auto_ingest?: IngestConfig[];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createDefaultAction(type: BotActionType = 'send_message'): BotAction {
  const base: BotAction = { id: generateId(), type, payload: {}, delay: 0 };
  switch (type) {
    case 'send_message':
    case 'edit_message':
    case 'send_dm':
      base.payload = { content: '' };
      break;
    case 'add_reaction':
    case 'remove_reaction':
      base.payload = { emoji: '' };
      break;
    case 'create_channel':
      base.payload = { name: '', type: 'text' };
      break;
    case 'delete_message':
      base.payload = { messageId: '' };
      break;
    case 'kick_member':
      base.payload = { reason: '' };
      break;
    case 'ban_member':
      base.payload = { reason: '', deleteMessageDays: 0 };
      break;
    case 'timeout_member':
      base.payload = { duration: 60 };
      break;
    case 'move_member':
    case 'mute_member':
    case 'deafen_member':
    case 'disconnect_member':
      base.payload = { channelId: '' };
      break;
    case 'add_role':
    case 'remove_role':
      base.payload = { roleId: '' };
      break;
    case 'create_role':
      base.payload = { name: '', color: '#000000', hoist: false, mentionable: false };
      break;
    case 'delete_role':
      base.payload = { roleId: '' };
      break;
    case 'edit_role':
      base.payload = { roleId: '', name: '', color: '#000000' };
      break;
    case 'create_thread':
      base.payload = { name: '', channelId: '', type: 'public_thread' };
      break;
    case 'delete_thread':
    case 'archive_thread':
    case 'unarchive_thread':
    case 'lock_thread':
    case 'unlock_thread':
      base.payload = { channelId: '' };
      break;
    case 'add_thread_member':
    case 'remove_thread_member':
      base.payload = { channelId: '', userId: '' };
      break;
    case 'create_emoji':
      base.payload = { name: '', imageUrl: '' };
      break;
    case 'delete_emoji':
      base.payload = { emojiId: '' };
      break;
    case 'create_sticker':
      base.payload = { name: '', description: '', tags: '', imageUrl: '' };
      break;
    case 'delete_sticker':
      base.payload = { stickerId: '' };
      break;
    case 'create_event':
      base.payload = { name: '', channelId: '', description: '', scheduledStart: '', scheduledEnd: '', privacyLevel: 'guild_only', entityType: 'voice' };
      break;
    case 'delete_event':
    case 'edit_event':
      base.payload = { eventId: '' };
      break;
    case 'create_invite':
      base.payload = { channelId: '', maxAge: 86400, maxUses: 0 };
      break;
    case 'execute_webhook':
      base.payload = { webhookId: '', webhookToken: '', content: '' };
      break;
    case 'set_bot_status':
      base.payload = { status: 'online' };
      break;
    default:
      base.payload = {};
  }
  return base;
}

export function createDefaultCommand(): CustomCommand {
  return {
    id: generateId(),
    name: '',
    description: '',
    enabled: true,
    trigger: [],
    triggerType: 'exact',
    executionMode: 'sequential',
    cooldown: 0,
    allowedRoles: [],
    allowedChannels: [],
    actions: [createDefaultAction('send_message')],
  };
}

export function migrateOldCommand(old: { trigger: string; response: string }): CustomCommand {
  return {
    id: generateId(),
    name: old.trigger.replace('/', ''),
    description: '',
    enabled: true,
    trigger: [old.trigger],
    triggerType: 'exact',
    executionMode: 'sequential',
    cooldown: 0,
    allowedRoles: [],
    allowedChannels: [],
    actions: [
      {
        id: generateId(),
        type: 'send_message',
        payload: { content: old.response },
        delay: 0,
      },
    ],
  };
}
