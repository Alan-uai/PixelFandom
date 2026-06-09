'use client';

import {
  SliderTabs,
  SliderTabsList,
  SliderTabsTrigger,
  SliderTabsContent,
  SliderTabsContentGroup,
} from '@/components/ui/slider-tabs';
import {
  Gamepad2,
  Sword,
  Sparkles,
  Users,
  MessageCircle,
  Trophy,
  Palette,
  Music,
  Tv,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

const demoCard =
  'rounded-xl border border-border/50 bg-card p-6 backdrop-blur-sm';

export default function SliderDemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-24">
      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          <span className="text-gradient-cyan">Slider</span>{' '}
          <span className="text-muted-foreground">Tabs</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Transição 3D com spring physics — direção baseada na posição da aba
        </p>
      </div>

      {/* ── Example 1: Wiki Game Sections ── */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">
          Seções do Game
        </h2>
        <SliderTabs defaultValue="overview">
          <SliderTabsList>
            <SliderTabsTrigger value="overview" icon={Sparkles}>
              Visão Geral
            </SliderTabsTrigger>
            <SliderTabsTrigger value="characters" icon={Sword}>
              Personagens
            </SliderTabsTrigger>
            <SliderTabsTrigger value="community" icon={Users}>
              Comunidade
            </SliderTabsTrigger>
            <SliderTabsTrigger value="rankings" icon={Trophy}>
              Rankings
            </SliderTabsTrigger>
            <SliderTabsTrigger value="media" icon={Tv}>
              Mídia
            </SliderTabsTrigger>
          </SliderTabsList>

          <SliderTabsContentGroup>
            <SliderTabsContent value="overview">
              <div className={demoCard}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Visão Geral
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Bem-vindo ao universo do jogo
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Jogadores', value: '12,847' },
                    { label: 'Mundos', value: '342' },
                    { label: 'Online', value: '1,203' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg bg-muted/50 p-4 text-center"
                    >
                      <div className="text-2xl font-bold text-primary">
                        {s.value}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="characters">
              <div className={demoCard}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <Sword className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Personagens
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Conheça os heróis e vilões
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Luna Starlight', 'Kael Shadowblade', 'Nova Phoenix', 'Oberon Ironfist'].map(
                    (name) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            Classe lendária
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="community">
              <div className={demoCard}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Comunidade
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Conecte-se com outros jogadores
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { user: 'DragonSlayer', msg: 'Alguém para upar juntos?', time: '2min' },
                    { user: 'PixelQueen', msg: 'Novo evento de crafting!', time: '8min' },
                    { user: 'CyberKnight', msg: 'Patch 4.2 chegou!', time: '15min' },
                  ].map((c) => (
                    <div
                      key={c.user}
                      className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-xs font-bold text-white">
                        {c.user.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.user}</span>
                          <span className="text-xs text-muted-foreground">{c.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="rankings">
              <div className={demoCard}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Rankings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Os melhores jogadores da temporada
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { pos: 1, name: 'ShadowMaster', pts: 15420 },
                    { pos: 2, name: 'ArcaneWizard', pts: 13280 },
                    { pos: 3, name: 'BlazeFury', pts: 11950 },
                  ].map((r) => (
                    <div
                      key={r.pos}
                      className="flex items-center gap-4 rounded-lg bg-muted/40 p-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                          r.pos === 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : r.pos === 2
                              ? 'bg-gray-400/20 text-gray-300'
                              : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {r.pos}
                      </div>
                      <span className="flex-1 font-medium">{r.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {r.pts.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="media">
              <div className={demoCard}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Tv className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Mídia</h3>
                    <p className="text-sm text-muted-foreground">
                      Vídeos, capturas e arte
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['Trailer Oficial', 'Gameplay S4', 'Behind the Scenes'].map(
                    (title) => (
                      <div
                        key={title}
                        className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                      >
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-sm font-medium">{title}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </SliderTabsContent>
          </SliderTabsContentGroup>
        </SliderTabs>
      </section>

      {/* ── Example 2: Config tabs ── */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">
          Configurações
        </h2>
        <SliderTabs defaultValue="appearance">
          <SliderTabsList className="max-w-md">
            <SliderTabsTrigger value="appearance" icon={Palette}>
              Aparência
            </SliderTabsTrigger>
            <SliderTabsTrigger value="audio" icon={Music}>
              Áudio
            </SliderTabsTrigger>
            <SliderTabsTrigger value="gameplay" icon={Gamepad2}>
              Jogabilidade
            </SliderTabsTrigger>
          </SliderTabsList>

          <SliderTabsContentGroup>
            <SliderTabsContent value="appearance">
              <div className={demoCard}>
                <h3 className="mb-3 font-display text-lg font-semibold">
                  Aparência
                </h3>
                <div className="space-y-4">
                  {['Modo escuro', 'Reduzir brilho', 'Alta performance'].map(
                    (label) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                      >
                        <span className="text-sm">{label}</span>
                        <div className="h-5 w-9 rounded-full bg-primary/30 p-0.5">
                          <div className="h-4 w-4 rounded-full bg-primary shadow-sm" />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="audio">
              <div className={demoCard}>
                <h3 className="mb-3 font-display text-lg font-semibold">
                  Áudio
                </h3>
                <div className="space-y-4">
                  {['Música ambiente', 'Efeitos sonoros', 'Voz do narrador'].map(
                    (label) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                      >
                        <span className="text-sm">{label}</span>
                        <div className="h-5 w-9 rounded-full bg-primary/30 p-0.5">
                          <div className="h-4 w-4 rounded-full bg-primary shadow-sm" />
                        </div>
                      </div>
                    ),
                  )}
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">
                      Volume
                    </label>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-secondary" />
                    </div>
                  </div>
                </div>
              </div>
            </SliderTabsContent>

            <SliderTabsContent value="gameplay">
              <div className={demoCard}>
                <h3 className="mb-3 font-display text-lg font-semibold">
                  Jogabilidade
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'Dificuldade', value: 'Normal' },
                    { key: 'Auto-save', value: 'A cada 5 min' },
                    { key: 'Modo PvP', value: 'Desativado' },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                    >
                      <span className="text-sm">{s.key}</span>
                      <span className="text-sm text-muted-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SliderTabsContent>
          </SliderTabsContentGroup>
        </SliderTabs>
      </section>

      {/* ── Example 4: Diagonal directions ── */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">
          Direções <span className="text-gradient-cyan">Diagonais</span>
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Todas as 8 direções — a aba ativa determina o slide, cada transição
          usa <code className="rounded bg-muted px-1.5 py-0.5 text-xs">transition=&quot;...&quot;</code>
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* ↖️ Top-Left */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpLeft className="h-4 w-4" />
              <code>transition=&quot;top-left&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="top-left">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowUpLeft}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowDownRight}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">↖️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">↘️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>

          {/* ↗️ Top-Right */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpRight className="h-4 w-4" />
              <code>transition=&quot;top-right&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="top-right">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowUpRight}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowDownLeft}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">↗️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">↙️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>

          {/* ↙️ Bottom-Left */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownLeft className="h-4 w-4" />
              <code>transition=&quot;bottom-left&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="bottom-left">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowDownLeft}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowUpRight}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">↙️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">↗️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>

          {/* ↘️ Bottom-Right */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownRight className="h-4 w-4" />
              <code>transition=&quot;bottom-right&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="bottom-right">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowDownRight}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowUpLeft}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">↘️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">↖️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>

          {/* ⬅️ Left (cardinal) */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <code>transition=&quot;left&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="left">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowUpLeft}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowUpRight}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">⬅️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">➡️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>

          {/* ⬇️ Down (cardinal) */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDown className="h-4 w-4" />
              <code>transition=&quot;down&quot;</code>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3">
              <SliderTabs defaultValue="a" transition="down">
                <SliderTabsList>
                  <SliderTabsTrigger value="a" icon={ArrowUpLeft}>A</SliderTabsTrigger>
                  <SliderTabsTrigger value="b" icon={ArrowDownLeft}>B</SliderTabsTrigger>
                </SliderTabsList>
                <SliderTabsContentGroup>
                  <SliderTabsContent value="a">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-primary">⬆️ A</span>
                    </div>
                  </SliderTabsContent>
                  <SliderTabsContent value="b">
                    <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/10 to-transparent">
                      <span className="font-display text-2xl font-bold text-secondary">⬇️ B</span>
                    </div>
                  </SliderTabsContent>
                </SliderTabsContentGroup>
              </SliderTabs>
            </div>
          </div>
        </div>
      </section>

      {/* ── Example 3: Chat tabs ── */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Chat</h2>
        <SliderTabs defaultValue="global">
          <SliderTabsList className="max-w-lg">
            <SliderTabsTrigger value="global" icon={MessageCircle}>
              Global
            </SliderTabsTrigger>
            <SliderTabsTrigger value="party" icon={Users}>
              Grupo
            </SliderTabsTrigger>
            <SliderTabsTrigger value="whisper" icon={Sparkles}>
              Sussurros
            </SliderTabsTrigger>
          </SliderTabsList>

          <SliderTabsContentGroup>
            <SliderTabsContent value="global">
              <div className={demoCard}>
                <p className="text-sm text-muted-foreground">
                  Canal de chat global — todos os jogadores conectados.
                </p>
              </div>
            </SliderTabsContent>
            <SliderTabsContent value="party">
              <div className={demoCard}>
                <p className="text-sm text-muted-foreground">
                  Chat do grupo — apenas membros do seu grupo.
                </p>
              </div>
            </SliderTabsContent>
            <SliderTabsContent value="whisper">
              <div className={demoCard}>
                <p className="text-sm text-muted-foreground">
                  Mensagens privadas entre jogadores.
                </p>
              </div>
            </SliderTabsContent>
          </SliderTabsContentGroup>
        </SliderTabs>
      </section>
    </div>
  );
}
