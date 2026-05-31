import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import { StringListEditor } from './shared/string-list-editor';
import {
  SelectField, CheckboxField, TextField, UrlField,
} from './shared/fields';

export function FooterCreditsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Marca" value={(config.brandName as string) || ''} onChange={(v) => onChange('brandName', v)} />
      <SelectField label="Ano" value={String((config.year as string | number) || 'auto')} options={[
        { label: 'Automático', value: 'auto' }, { label: '2024', value: '2024' }, { label: '2025', value: '2025' }, { label: '2026', value: '2026' },
      ]} onChange={(v) => onChange('year', v === 'auto' ? 'auto' : Number(v))} />
      <CheckboxField label="Mostrar coração" checked={!!config.showHeart} onChange={(v) => onChange('showHeart', v)} id="fc-heart" />
      <CheckboxField label="Mostrar direitos" checked={!!config.showRights} onChange={(v) => onChange('showRights', v)} id="fc-rights" />
      <SelectField label="Tamanho" value={(config.size as string) || 'sm'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' },
      ]} onChange={(v) => onChange('size', v)} />
    </>
  );
}

export function NewsletterPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Placeholder" value={(config.placeholder as string) || 'Seu email'} onChange={(v) => onChange('placeholder', v)} />
      <TextField label="Texto do Botão" value={(config.buttonText as string) || 'Inscrever'} onChange={(v) => onChange('buttonText', v)} />
      <TextField label="Mensagem de Sucesso" value={(config.successMessage as string) || ''} onChange={(v) => onChange('successMessage', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Outline', value: 'outline' }, { label: 'Ghost', value: 'ghost' },
      ]} onChange={(v) => onChange('variant', v)} />
    </>
  );
}

export function AppBadgesPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <CheckboxField label="Apple App Store" checked={!!config.showApple} onChange={(v) => onChange('showApple', v)} id="ab-apple" />
      <CheckboxField label="Google Play" checked={!!config.showGoogle} onChange={(v) => onChange('showGoogle', v)} id="ab-google" />
      <UrlField label="Apple URL" value={(config.appleUrl as string) || ''} onChange={(v) => onChange('appleUrl', v)} />
      <UrlField label="Google URL" value={(config.googleUrl as string) || ''} onChange={(v) => onChange('googleUrl', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'black'} options={[
        { label: 'Preto', value: 'black' }, { label: 'Branco', value: 'white' }, { label: 'Colorido', value: 'color' },
      ]} onChange={(v) => onChange('variant', v)} />
    </>
  );
}

export function BackToTopPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Variante" value={(config.variant as string) || 'arrow'} options={[
        { label: 'Seta', value: 'arrow' }, { label: 'Chevron', value: 'chevron' }, { label: 'Texto', value: 'text' },
      ]} onChange={(v) => onChange('variant', v)} />
      <TextField label="Texto" value={(config.label as string) || ''} onChange={(v) => onChange('label', v)} />
      <SelectField label="Posição" value={(config.position as string) || 'right'} options={[
        { label: 'Direita', value: 'right' }, { label: 'Centro', value: 'center' },
      ]} onChange={(v) => onChange('position', v)} />
      <CheckboxField label="Mostrar após scroll" checked={!!config.showAfterScroll} onChange={(v) => onChange('showAfterScroll', v)} id="btt-scroll" />
      <SelectField label="Limite de Scroll (px)" value={String((config.scrollThreshold as number) || 300)} options={[
        { label: '100px', value: '100' }, { label: '300px', value: '300' }, { label: '500px', value: '500' }, { label: '1000px', value: '1000' },
      ]} onChange={(v) => onChange('scrollThreshold', Number(v))} />
    </>
  );
}

export function PaymentIconsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <StringListEditor
        label="Ícones"
        values={(config.icons as string[]) || []}
        onChange={(v) => onChange('icons', v)}
        placeholder="visa, mastercard, etc"
      />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('size', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'color'} options={[
        { label: 'Colorido', value: 'color' }, { label: 'Escala de Cinza', value: 'grayscale' },
      ]} onChange={(v) => onChange('variant', v)} />
    </>
  );
}

export function FooterBrandPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <UrlField label="Logo URL" value={(config.logo as string) || ''} onChange={(v) => onChange('logo', v)} />
      <TextField label="Slogan" value={(config.tagline as string) || ''} onChange={(v) => onChange('tagline', v)} />
      <TextField label="Descrição" value={(config.description as string) || ''} onChange={(v) => onChange('description', v)} multiline />
      <CheckboxField label="Mostrar redes sociais" checked={!!config.showSocialLinks} onChange={(v) => onChange('showSocialLinks', v)} id="fb-social" />
      {config.showSocialLinks && (
        <ItemsListEditor
          label="Redes Sociais"
          fields={[
            { key: 'platform', label: 'Plataforma', type: 'text', placeholder: 'Twitter' },
            { key: 'url', label: 'URL', type: 'url' },
          ]}
          items={(config.socialLinks as Record<string, unknown>[]) || []}
          onChange={(v) => onChange('socialLinks', v)}
        />
      )}
    </>
  );
}

export function LanguageSwitcherPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <ItemsListEditor
        label="Idiomas"
        fields={[
          { key: 'code', label: 'Código', type: 'text', placeholder: 'pt-BR' },
          { key: 'label', label: 'Nome', type: 'text', placeholder: 'Português' },
        ]}
        items={(config.languages as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('languages', v)}
      />
      <TextField label="Idioma Padrão" value={(config.defaultLanguage as string) || ''} onChange={(v) => onChange('defaultLanguage', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'dropdown'} options={[
        { label: 'Dropdown', value: 'dropdown' }, { label: 'Bandeiras', value: 'flags' },
      ]} onChange={(v) => onChange('variant', v)} />
      <CheckboxField label="Mostrar rótulo" checked={!!config.showLabel} onChange={(v) => onChange('showLabel', v)} id="ls-label" />
    </>
  );
}

export function FooterMenuPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'columns'} options={[
        { label: 'Colunas', value: 'columns' }, { label: 'Inline', value: 'inline' },
      ]} onChange={(v) => onChange('layout', v)} />
      <ItemsListEditor
        label="Colunas do Menu"
        fields={[
          { key: 'title', label: 'Título da Coluna', type: 'text' },
        ]}
        items={(config.columns as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('columns', v)}
      />
    </>
  );
}
