# Supabase Database Setup - Pixel Fantasy

## Estrutura dos Arquivos

```
SQL/
├── 01-schema.sql    - Schema completo do banco
├── 02-policies.sql  - Políticas de segurança (RLS)
└── 03-seed-data.sql - Dados iniciais de exemplo
```

## Como Executar

### 1. Criar Projeto Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais do projeto

### 2. Executar os Scripts
No SQL Editor do Supabase, execute na seguinte ordem:

1. **01-schema.sql** - Cria todas as tabelas, enums, e funções
2. **02-policies.sql** - Configura as regras de segurança RLS
3. **03-seed-data.sql** - Insere dados iniciais de exemplo

### 3. Configurar Variáveis de Ambiente

No seu projeto Next.js, crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

## Tabelas Criadas

### Dados Públicos do Jogo
- `worlds` - Mundos do jogo
- `dungeons` - Masmorras
- `bosses` - Chefes
- `swords` - Espadas
- `armors` - Armaduras
- `potions` - Poções
- `rings` - Anéis
- `accessories` - Acessórios
- `auras` - Auras
- `pets` - Pets
- `fighters` - Lutadores (Titan, Stand, Shadow, Ghoul)
- `gamepasses` - Gamepasses
- `achievements` - Conquistas
- `quests` - Missões
- `chests` - Baús
- `obelisks` - Obeliscos
- `powers` - Poderes
- `power_stats` - Stats dos poderes
- `wiki_content` - Conteúdo Wiki
- `game_metadata` - Metadados do jogo

### Dados do Usuário (Privados)
- `profiles` - Perfil do usuário
- `user_weapons` - Armas equipadas
- `user_inventory` - Inventário
- `user_fighters` - Lutadores equipadas
- `user_jewelry` - Joias equipadas
- `user_rank` - Ranking do usuário
- `user_achievements` - Conquistas do usuário
- `user_obelisks` - Obeliscos do usuário
- `user_index` - Index/Tier do usuário
- `user_gamepasses` - Gamepasses do usuário
- `user_quests` - Missões ativas

## Regras de Segurança (RLS)

- **Dados de jogo**: Leitura pública, escrita apenas para admin
- **Dados de usuário**: Apenas o próprio usuário pode acessar
- **Wiki**: Leitura pública, escrita para usuários autenticados
- **Feedback**: Usuários podem criar, apenas próprio usuário e admin podem ler

## Autenticação

O Supabase Auth já está configurado com trigger automático para criar perfil ao registrar usuário.

## Próximos Passos

1. Executar os scripts no Supabase
2. Configurar variáveis de ambiente
3. Integrar o código do Firebase para Supabase (migração dos hooks)