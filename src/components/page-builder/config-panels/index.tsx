import { useState } from 'react';
import type { ReactNode } from 'react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { IconPicker } from '@/components/ui/icon-picker';

interface PanelProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

type PanelComponent = (props: PanelProps) => ReactNode;

export const configPanels: Record<string, PanelComponent | undefined> = {
  // Section panel
  section: ({ config, onChange }) => (
    <SectionPanel config={config} onChange={onChange} />
  ),
  // Hero panel
  hero: ({ config, onChange }) => (
    <HeroPanel config={config} onChange={onChange} />
  ),
  // Heading panel
  heading: ({ config, onChange }) => (
    <HeadingPanel config={config} onChange={onChange} />
  ),
  // Button panel
  button: ({ config, onChange }) => (
    <ButtonPanel config={config} onChange={onChange} />
  ),
  // Icon panel
  icon: ({ config, onChange }) => (
    <IconPanel config={config} onChange={onChange} />
  ),
  // Pricing table
  'pricing-table': ({ config, onChange }) => (
    <PricingPanel config={config} onChange={onChange} />
  ),
  // Countdown
  countdown: ({ config, onChange }) => (
    <CountdownPanel config={config} onChange={onChange} />
  ),
  // Contact form
  'contact-form': ({ config, onChange }) => (
    <ContactFormPanel config={config} onChange={onChange} />
  ),
  // Error / 404
  'error-display': ({ config, onChange }) => (
    <ErrorDisplayPanel config={config} onChange={onChange} />
  ),
  'error-search': ({ config, onChange }) => (
    <ErrorSearchPanel config={config} onChange={onChange} />
  ),
  'error-suggestions': ({ config, onChange }) => (
    <ErrorSuggestionsPanel config={config} onChange={onChange} />
  ),
  'error-actions': ({ config, onChange }) => (
    <ErrorActionsPanel config={config} onChange={onChange} />
  ),
  'error-fun': ({ config, onChange }) => (
    <ErrorFunPanel config={config} onChange={onChange} />
  ),
  'error-image': ({ config, onChange }) => (
    <ErrorImagePanel config={config} onChange={onChange} />
  ),
  'error-map': ({ config, onChange }) => (
    <ErrorMapPanel config={config} onChange={onChange} />
  ),
  'error-quote': ({ config, onChange }) => (
    <ErrorQuotePanel config={config} onChange={onChange} />
  ),
  'error-feedback': ({ config, onChange }) => (
    <ErrorFeedbackPanel config={config} onChange={onChange} />
  ),
  'error-countdown': ({ config, onChange }) => (
    <ErrorCountdownPanel config={config} onChange={onChange} />
  ),
  'error-particle': ({ config, onChange }) => (
    <ErrorParticlePanel config={config} onChange={onChange} />
  ),
  'error-maze': ({ config, onChange }) => (
    <ErrorMazePanel config={config} onChange={onChange} />
  ),
  'error-poll': ({ config, onChange }) => (
    <ErrorPollPanel config={config} onChange={onChange} />
  ),
  'error-fact': ({ config, onChange }) => (
    <ErrorFactPanel config={config} onChange={onChange} />
  ),
  'error-social': ({ config, onChange }) => (
    <ErrorSocialPanel config={config} onChange={onChange} />
  ),
  'error-character': ({ config, onChange }) => (
    <ErrorCharacterPanel config={config} onChange={onChange} />
  ),
};

// Section
function Select({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Colunas" value={String(config.columns || 1)} options={[{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }]} onChange={(v) => onChange('columns', Number(v))} />
      <Select label="Espaçamento" value={config.gap as string || 'md'} options={[{ label: 'Sem', value: 'none' }, { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }]} onChange={(v) => onChange('gap', v)} />
      <Select label="Alinhamento Vertical" value={config.verticalAlign as string || 'top'} options={[{ label: 'Topo', value: 'top' }, { label: 'Centro', value: 'center' }, { label: 'Fundo', value: 'bottom' }]} onChange={(v) => onChange('verticalAlign', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.equalHeight} onChange={(e) => onChange('equalHeight', e.target.checked)} id="eq-height" className="rounded" />
        <label htmlFor="eq-height" className="text-xs">Altura igual</label>
      </div>
    </>
  );
}

// Hero
function HeroPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Layout" value={config.layout as string || 'center'} onChange={(v) => onChange('layout', v)} />
      <TextField label="Título" value={config.title as string || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={config.subtitle as string || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Texto do CTA" value={config.ctaText as string || ''} onChange={(v) => onChange('ctaText', v)} />
      <TextField label="URL do CTA" value={config.ctaUrl as string || ''} onChange={(v) => onChange('ctaUrl', v)} type="url" />
      <TextField label="URL da Imagem" value={config.imageUrl as string || ''} onChange={(v) => onChange('imageUrl', v)} type="url" />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.overlay} onChange={(e) => onChange('overlay', e.target.checked)} id="hero-overlay" className="rounded" />
        <label htmlFor="hero-overlay" className="text-xs">Overlay escuro</label>
      </div>
    </>
  );
}

// Heading
function HeadingPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Conteúdo" value={config.content as string || ''} onChange={(v) => onChange('content', v)} />
      <Select label="Nível" value={config.level as string || 'h2'} options={[{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' }]} onChange={(v) => onChange('level', v)} />
      <Select label="Alinhamento" value={config.align as string || 'left'} options={[{ label: 'Esquerda', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Direita', value: 'right' }]} onChange={(v) => onChange('align', v)} />
    </>
  );
}

// Button
function ButtonPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Texto" value={config.text as string || ''} onChange={(v) => onChange('text', v)} />
      <TextField label="URL" value={config.url as string || ''} onChange={(v) => onChange('url', v)} type="url" />
      <Select label="Variante" value={config.variant as string || 'primary'} options={[{ label: 'Primário', value: 'primary' }, { label: 'Outline', value: 'outline' }, { label: 'Ghost', value: 'ghost' }, { label: 'Secundário', value: 'secondary' }]} onChange={(v) => onChange('variant', v)} />
      <Select label="Tamanho" value={config.size as string || 'md'} options={[{ label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }]} onChange={(v) => onChange('size', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.fullWidth} onChange={(e) => onChange('fullWidth', e.target.checked)} id="btn-full" className="rounded" />
        <label htmlFor="btn-full" className="text-xs">Largura total</label>
      </div>
    </>
  );
}

// Pricing
function PricingPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || ''} onChange={(v) => onChange('title', v)} />
      <Select label="Colunas" value={String(config.columns || 3)} options={[{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }]} onChange={(v) => onChange('columns', Number(v))} />
      <ArrayField label="Planos" value={config.plans as any[] || []} onChange={(v) => onChange('plans', v)} />
    </>
  );
}

// Countdown
function CountdownPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Data Alvo" value={config.targetDate as string || ''} onChange={(v) => onChange('targetDate', v)} />
      <TextField label="Hora Alvo" value={config.targetTime as string || ''} onChange={(v) => onChange('targetTime', v)} />
      {['showDays', 'showHours', 'showMinutes', 'showSeconds'].map((key) => (
        <div key={key} className="flex items-center gap-2">
          <input type="checkbox" checked={!!config[key]} onChange={(e) => onChange(key, e.target.checked)} id={`cd-${key}`} className="rounded" />
          <label htmlFor={`cd-${key}`} className="text-xs capitalize">{key.replace('show', 'Mostrar ')}</label>
        </div>
      ))}
    </>
  );
}

// Contact Form
function ContactFormPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={config.subtitle as string || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Texto do Botão" value={config.submitText as string || 'Enviar'} onChange={(v) => onChange('submitText', v)} />
      <TextField label="Mensagem de Sucesso" value={config.successMessage as string || ''} onChange={(v) => onChange('successMessage', v)} />
      <ArrayField label="Campos" value={config.fields as any[] || []} onChange={(v) => onChange('fields', v)} />
    </>
  );
}

function IconPanel({ config, onChange }: PanelProps) {
  const icon = config.icon as any || { icon: 'lucide:star', animation: 'none' };
  const iconId = typeof icon === 'string' ? icon : icon?.icon || 'lucide:star';
  const animation = typeof icon === 'object' ? icon?.animation || 'none' : 'none';
  const size = (config.size as string) || 'md';
  const color = (config.color as string) || 'hsl(var(--primary))';

  return (
    <>
      <IconField label="Ícone" value={icon} onChange={(v) => onChange('icon', v)} />
      <Select label="Animação" value={animation} options={[
        { label: 'Nenhuma', value: 'none' },
        { label: 'Pulso', value: 'pulse' },
        { label: 'Girar', value: 'spin' },
        { label: 'Pular', value: 'bounce' },
        { label: 'Chacoalhar', value: 'shake' },
        { label: 'Balançar', value: 'wiggle' },
        { label: 'Flutuar', value: 'float' },
        { label: 'Brilho', value: 'glow' },
      ]} onChange={(v) => onChange('icon', { icon: iconId, animation: v })} />
      <Select label="Tamanho" value={size} options={[
        { label: 'Pequeno', value: 'sm' },
        { label: 'Médio', value: 'md' },
        { label: 'Grande', value: 'lg' },
        { label: 'Extra Grande', value: 'xl' },
      ]} onChange={(v) => onChange('size', v)} />
      <TextField label="Cor (HSL/HEX)" value={color} onChange={(v) => onChange('color', v)} />
      <TextField label="Cor de Fundo (HSL/HEX)" value={config.backgroundColor as string || ''} onChange={(v) => onChange('backgroundColor', v)} />
      <Select label="Arredondamento" value={config.rounded as string || 'md'} options={[
        { label: 'Nenhum', value: 'none' },
        { label: 'Pequeno', value: 'sm' },
        { label: 'Médio', value: 'md' },
        { label: 'Total', value: 'full' },
      ]} onChange={(v) => onChange('rounded', v)} />
    </>
  );
}

// ── Error / 404 ──
function ErrorDisplayPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Número" value={config.number as string || '404'} onChange={(v) => onChange('number', v)} />
      <Select label="Tamanho" value={config.size as string || 'xl'} options={[{ label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }, { label: 'Extra Grande', value: 'xl' }]} onChange={(v) => onChange('size', v)} />
      <Select label="Fonte" value={config.font as string || 'default'} options={[{ label: 'Padrão', value: 'default' }, { label: 'Mono', value: 'mono' }, { label: 'Display', value: 'display' }, { label: 'Contorno', value: 'outline' }]} onChange={(v) => onChange('font', v)} />
      <TextField label="Título" value={config.title as string || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={config.subtitle as string || ''} onChange={(v) => onChange('subtitle', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.glitchEnabled} onChange={(e) => onChange('glitchEnabled', e.target.checked)} id="ed-glitch" className="rounded" />
        <label htmlFor="ed-glitch" className="text-xs">Efeito glitch</label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showDecoration} onChange={(e) => onChange('showDecoration', e.target.checked)} id="ed-decor" className="rounded" />
        <label htmlFor="ed-decor" className="text-xs">Decorações de fundo</label>
      </div>
    </>
  );
}

function ErrorSearchPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Placeholder" value={config.placeholder as string || 'Buscar na wiki...'} onChange={(v) => onChange('placeholder', v)} />
    </>
  );
}

function ErrorSuggestionsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || 'Você pode estar procurando:'} onChange={(v) => onChange('title', v)} />
      <TextField label="Máx. Itens" value={String(config.maxItems || 4)} onChange={(v) => onChange('maxItems', Number(v))} />
      <ArrayField label="Itens" value={config.items as any[] || []} onChange={(v) => onChange('items', v)} />
    </>
  );
}

function ErrorActionsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Layout" value={config.layout as string || 'row'} options={[{ label: 'Linha', value: 'row' }, { label: 'Coluna', value: 'column' }]} onChange={(v) => onChange('layout', v)} />
      <Select label="Tamanho" value={config.size as string || 'md'} options={[{ label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }]} onChange={(v) => onChange('size', v)} />
      <ArrayField label="Botões" value={config.buttons as any[] || []} onChange={(v) => onChange('buttons', v)} />
    </>
  );
}

function ErrorFunPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Tipo de Jogo" value={config.gameType as string || 'clicker'} options={[{ label: 'Clique', value: 'clicker' }, { label: 'Trivia', value: 'trivia' }]} onChange={(v) => onChange('gameType', v)} />
      {config.gameType !== 'trivia' && (
        <TextField label="URL de Redirecionamento" value={config.redirectUrl as string || ''} onChange={(v) => onChange('redirectUrl', v)} type="url" />
      )}
      {config.gameType === 'trivia' && (
        <>
          <TextField label="Pergunta" value={config.triviaQuestion as string || ''} onChange={(v) => onChange('triviaQuestion', v)} />
          <ArrayField label="Opções" value={config.triviaOptions as any[] || []} onChange={(v) => onChange('triviaOptions', v)} />
          <TextField label="Resposta" value={config.triviaAnswer as string || ''} onChange={(v) => onChange('triviaAnswer', v)} />
        </>
      )}
    </>
  );
}

function ErrorImagePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="URL da Imagem" value={config.src as string || ''} onChange={(v) => onChange('src', v)} type="url" />
      <TextField label="Alt" value={config.alt as string || ''} onChange={(v) => onChange('alt', v)} />
      <Select label="Arredondamento" value={config.rounded as string || 'md'} options={[{ label: 'Nenhum', value: 'none' }, { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }, { label: 'Total', value: 'full' }]} onChange={(v) => onChange('rounded', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.overlay} onChange={(e) => onChange('overlay', e.target.checked)} id="ei-overlay" className="rounded" />
        <label htmlFor="ei-overlay" className="text-xs">Overlay com texto</label>
      </div>
      {config.overlay && <TextField label="Texto do Overlay" value={config.overlayText as string || ''} onChange={(v) => onChange('overlayText', v)} />}
    </>
  );
}

function ErrorMapPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || 'Mapa do Site'} onChange={(v) => onChange('title', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showSections} onChange={(e) => onChange('showSections', e.target.checked)} id="em-sections" className="rounded" />
        <label htmlFor="em-sections" className="text-xs">Mostrar seções</label>
      </div>
    </>
  );
}

function ErrorQuotePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Rotação" value={config.rotation as string || 'random'} options={[{ label: 'Aleatória', value: 'random' }, { label: 'Sequencial', value: 'sequential' }]} onChange={(v) => onChange('rotation', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showAuthor} onChange={(e) => onChange('showAuthor', e.target.checked)} id="eq-author" className="rounded" />
        <label htmlFor="eq-author" className="text-xs">Mostrar autor</label>
      </div>
      <ArrayField label="Citações" value={config.quotes as any[] || []} onChange={(v) => onChange('quotes', v)} />
    </>
  );
}

function ErrorFeedbackPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || 'Reportar Problema'} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={config.subtitle as string || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Placeholder" value={config.placeholder as string || ''} onChange={(v) => onChange('placeholder', v)} />
      <TextField label="Texto do Botão" value={config.submitText as string || 'Enviar'} onChange={(v) => onChange('submitText', v)} />
      <TextField label="Mensagem de Sucesso" value={config.successMessage as string || ''} onChange={(v) => onChange('successMessage', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showEmail} onChange={(e) => onChange('showEmail', e.target.checked)} id="ef-email" className="rounded" />
        <label htmlFor="ef-email" className="text-xs">Mostrar campo de email</label>
      </div>
    </>
  );
}

function ErrorCountdownPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="URL de Redirecionamento" value={config.redirectUrl as string || '/'} onChange={(v) => onChange('redirectUrl', v)} type="url" />
      <TextField label="Segundos" value={String(config.seconds || 10)} onChange={(v) => onChange('seconds', Number(v))} />
      <TextField label="Mensagem" value={config.message as string || ''} onChange={(v) => onChange('message', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showProgress} onChange={(e) => onChange('showProgress', e.target.checked)} id="ec-progress" className="rounded" />
        <label htmlFor="ec-progress" className="text-xs">Barra de progresso</label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showSeconds} onChange={(e) => onChange('showSeconds', e.target.checked)} id="ec-seconds" className="rounded" />
        <label htmlFor="ec-seconds" className="text-xs">Mostrar segundos</label>
      </div>
    </>
  );
}

function ErrorParticlePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Quantidade" value={String(config.count || 50)} onChange={(v) => onChange('count', Number(v))} />
      <TextField label="Cor (HEX)" value={config.color as string || '#4BC5FF'} onChange={(v) => onChange('color', v)} />
      <TextField label="Opacidade" value={String(config.opacity ?? 0.6)} onChange={(v) => onChange('opacity', Number(v))} />
      <Select label="Tipo" value={config.type as string || 'stars'} options={[{ label: 'Estrelas', value: 'stars' }, { label: 'Ruído', value: 'noise' }]} onChange={(v) => onChange('type', v)} />
    </>
  );
}

function ErrorMazePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Tamanho do Grid" value={String(config.size || 8)} onChange={(v) => onChange('size', Number(v))} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showTimer} onChange={(e) => onChange('showTimer', e.target.checked)} id="emz-timer" className="rounded" />
        <label htmlFor="emz-timer" className="text-xs">Mostrar timer</label>
      </div>
    </>
  );
}

function ErrorPollPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Pergunta" value={config.question as string || ''} onChange={(v) => onChange('question', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showResults} onChange={(e) => onChange('showResults', e.target.checked)} id="ep-results" className="rounded" />
        <label htmlFor="ep-results" className="text-xs">Mostrar resultados</label>
      </div>
      <ArrayField label="Opções" value={config.options as any[] || []} onChange={(v) => onChange('options', v)} />
    </>
  );
}

function ErrorFactPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Rotação" value={config.rotation as string || 'random'} options={[{ label: 'Aleatória', value: 'random' }, { label: 'Sequencial', value: 'sequential' }]} onChange={(v) => onChange('rotation', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showSource} onChange={(e) => onChange('showSource', e.target.checked)} id="efct-source" className="rounded" />
        <label htmlFor="efct-source" className="text-xs">Mostrar fonte</label>
      </div>
      <ArrayField label="Fatos" value={config.facts as any[] || []} onChange={(v) => onChange('facts', v)} />
    </>
  );
}

function ErrorSocialPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={config.title as string || 'Não vá ainda!'} onChange={(v) => onChange('title', v)} />
      <TextField label="Mensagem" value={config.message as string || ''} onChange={(v) => onChange('message', v)} />
      <Select label="Layout" value={config.layout as string || 'row'} options={[{ label: 'Linha', value: 'row' }, { label: 'Coluna', value: 'column' }]} onChange={(v) => onChange('layout', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showShare} onChange={(e) => onChange('showShare', e.target.checked)} id="es-share" className="rounded" />
        <label htmlFor="es-share" className="text-xs">Mostrar compartilhar</label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showFollow} onChange={(e) => onChange('showFollow', e.target.checked)} id="es-follow" className="rounded" />
        <label htmlFor="es-follow" className="text-xs">Mostrar seguir</label>
      </div>
    </>
  );
}

function ErrorCharacterPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <Select label="Personagem" value={config.character as string || 'sad-robot'} options={[
        { label: 'Robô Triste', value: 'sad-robot' },
        { label: 'Fantasma', value: 'ghost' },
        { label: 'Alienígena', value: 'alien' },
        { label: 'Gato', value: 'cat' },
        { label: 'Cachorro', value: 'dog' },
        { label: 'Coruja', value: 'owl' },
      ]} onChange={(v) => onChange('character', v)} />
      <Select label="Humor" value={config.mood as string || 'sad'} options={[{ label: 'Triste', value: 'sad' }, { label: 'Feliz', value: 'happy' }, { label: 'Confuso', value: 'confused' }, { label: 'Piscada', value: 'wink' }]} onChange={(v) => onChange('mood', v)} />
      <TextField label="Fala" value={config.speech as string || ''} onChange={(v) => onChange('speech', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!config.showBubble} onChange={(e) => onChange('showBubble', e.target.checked)} id="ec-bubble" className="rounded" />
        <label htmlFor="ec-bubble" className="text-xs">Mostrar balão de fala</label>
      </div>
    </>
  );
}

// Helpers
function TextField({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type={type === 'url' ? 'url' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
    </div>
  );
}

function IconField({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const iconId = typeof value === 'string' ? value : value?.icon || 'lucide:star';
  const animation = typeof value === 'object' ? value?.animation || 'none' : 'none';

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <IconRenderer icon={iconId} size="sm" />
          <input
            type="text"
            value={iconId}
            onChange={(e) => {
              if (typeof value === 'string') onChange(e.target.value);
              else onChange({ icon: e.target.value, animation });
            }}
            placeholder="lucide:star"
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent"
        >
          Browse
        </button>
      </div>
      {pickerOpen && (
        <IconPicker
          value={iconId}
          animation={animation}
          onChange={(newIconId, newAnim) => {
            const newVal = typeof value === 'string' ? newIconId : { icon: newIconId, animation: newAnim };
            onChange(newVal);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ArrayField({ label, value, onChange }: { label: string; value: any[]; onChange: (v: any[]) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <textarea
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
        rows={4}
        className="w-full rounded-md border bg-background px-2 py-1 font-mono text-[10px] resize-none"
      />
    </div>
  );
}
