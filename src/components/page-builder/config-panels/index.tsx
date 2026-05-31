import type { ReactNode } from 'react';

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

// Helpers
function TextField({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type={type === 'url' ? 'url' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
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
