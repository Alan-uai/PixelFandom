import type { PanelProps } from './types';
import { ItemsListEditor } from './shared/items-list-editor';
import { StringListEditor } from './shared/string-list-editor';
import {
  SelectField, CheckboxField, TextField, UrlField,
} from './shared/fields';

export function ErrorDisplayPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Número" value={(config.number as string) || '404'} onChange={(v) => onChange('number', v)} />
      <SelectField label="Tamanho" value={(config.size as string) || 'xl'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }, { label: 'Extra Grande', value: 'xl' },
      ]} onChange={(v) => onChange('size', v)} />
      <SelectField label="Fonte" value={(config.font as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Mono', value: 'mono' }, { label: 'Display', value: 'display' }, { label: 'Contorno', value: 'outline' },
      ]} onChange={(v) => onChange('font', v)} />
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <CheckboxField label="Efeito glitch" checked={!!config.glitchEnabled} onChange={(v) => onChange('glitchEnabled', v)} id="ed-glitch" />
      <CheckboxField label="Decorações de fundo" checked={!!config.showDecoration} onChange={(v) => onChange('showDecoration', v)} id="ed-decor" />
    </>
  );
}

export function ErrorSearchPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Placeholder" value={(config.placeholder as string) || 'Buscar na wiki...'} onChange={(v) => onChange('placeholder', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'default'} options={[
        { label: 'Padrão', value: 'default' }, { label: 'Minimal', value: 'minimal' }, { label: 'Largura Total', value: 'full-width' },
      ]} onChange={(v) => onChange('variant', v)} />
      <CheckboxField label="Sugestões automáticas" checked={!!config.showSuggestions} onChange={(v) => onChange('showSuggestions', v)} id="es-suggest" />
      <CheckboxField label="Auto foco" checked={!!config.autoFocus} onChange={(v) => onChange('autoFocus', v)} id="es-focus" />
    </>
  );
}

export function ErrorSuggestionsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || 'Você pode estar procurando:'} onChange={(v) => onChange('title', v)} />
      <SelectField label="Máx. Itens" value={String((config.maxItems as number) || 4)} options={[
        { label: '2', value: '2' }, { label: '4', value: '4' }, { label: '6', value: '6' }, { label: '8', value: '8' },
      ]} onChange={(v) => onChange('maxItems', Number(v))} />
      <SelectField label="Modo" value={(config.mode as string) || 'manual'} options={[
        { label: 'Manual', value: 'manual' }, { label: 'Automático', value: 'auto' },
      ]} onChange={(v) => onChange('mode', v)} />
      {config.mode !== 'auto' && (
        <ItemsListEditor
          label="Sugestões"
          fields={[
            { key: 'title', label: 'Título', type: 'text' },
            { key: 'slug', label: 'Slug', type: 'text' },
          ]}
          items={(config.items as Record<string, unknown>[]) || []}
          onChange={(v) => onChange('items', v)}
        />
      )}
    </>
  );
}

export function ErrorActionsPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Layout" value={(config.layout as string) || 'row'} options={[
        { label: 'Linha', value: 'row' }, { label: 'Coluna', value: 'column' }, { label: 'Grade', value: 'grid' },
      ]} onChange={(v) => onChange('layout', v)} />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('size', v)} />
      <ItemsListEditor
        label="Botões"
        fields={[
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'url', label: 'URL', type: 'url' },
          { key: 'variant', label: 'Variante', type: 'select', options: [
            { label: 'Primário', value: 'primary' }, { label: 'Outline', value: 'outline' },
            { label: 'Ghost', value: 'ghost' }, { label: 'Secundário', value: 'secondary' },
          ]},
        ]}
        items={(config.buttons as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('buttons', v)}
      />
    </>
  );
}

export function ErrorFunPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Tipo de Jogo" value={(config.gameType as string) || 'clicker'} options={[
        { label: 'Clique', value: 'clicker' }, { label: 'Trivia', value: 'trivia' },
      ]} onChange={(v) => onChange('gameType', v)} />
      {(!config.gameType || config.gameType === 'clicker') && (
        <UrlField label="URL de Redirecionamento" value={(config.redirectUrl as string) || ''} onChange={(v) => onChange('redirectUrl', v)} />
      )}
      {config.gameType === 'trivia' && (
        <>
          <TextField label="Pergunta" value={(config.triviaQuestion as string) || ''} onChange={(v) => onChange('triviaQuestion', v)} />
          <StringListEditor
            label="Opções"
            values={(config.triviaOptions as string[]) || []}
            onChange={(v) => onChange('triviaOptions', v)}
            placeholder="Digite uma opção..."
          />
          <TextField label="Resposta" value={(config.triviaAnswer as string) || ''} onChange={(v) => onChange('triviaAnswer', v)} />
        </>
      )}
    </>
  );
}

export function ErrorImagePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <UrlField label="URL da Imagem" value={(config.src as string) || ''} onChange={(v) => onChange('src', v)} />
      <TextField label="Alt" value={(config.alt as string) || ''} onChange={(v) => onChange('alt', v)} />
      <SelectField label="Arredondamento" value={(config.rounded as string) || 'md'} options={[
        { label: 'Nenhum', value: 'none' }, { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' }, { label: 'Total', value: 'full' },
      ]} onChange={(v) => onChange('rounded', v)} />
      <CheckboxField label="Overlay com texto" checked={!!config.overlay} onChange={(v) => onChange('overlay', v)} id="ei-overlay" />
      {config.overlay && <TextField label="Texto do Overlay" value={(config.overlayText as string) || ''} onChange={(v) => onChange('overlayText', v)} />}
    </>
  );
}

export function ErrorMapPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || 'Mapa do Site'} onChange={(v) => onChange('title', v)} />
      <CheckboxField label="Mostrar seções" checked={!!config.showSections} onChange={(v) => onChange('showSections', v)} id="em-sections" />
    </>
  );
}

export function ErrorQuotePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Rotação" value={(config.rotation as string) || 'random'} options={[
        { label: 'Aleatória', value: 'random' }, { label: 'Sequencial', value: 'sequential' },
      ]} onChange={(v) => onChange('rotation', v)} />
      <CheckboxField label="Mostrar autor" checked={!!config.showAuthor} onChange={(v) => onChange('showAuthor', v)} id="eq-author" />
      <ItemsListEditor
        label="Citações"
        fields={[
          { key: 'text', label: 'Texto', type: 'textarea' },
          { key: 'author', label: 'Autor', type: 'text' },
        ]}
        items={(config.quotes as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('quotes', v)}
      />
    </>
  );
}

export function ErrorFeedbackPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || 'Reportar Problema'} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Placeholder" value={(config.placeholder as string) || ''} onChange={(v) => onChange('placeholder', v)} />
      <TextField label="Texto do Botão" value={(config.submitText as string) || 'Enviar'} onChange={(v) => onChange('submitText', v)} />
      <TextField label="Mensagem de Sucesso" value={(config.successMessage as string) || ''} onChange={(v) => onChange('successMessage', v)} />
      <CheckboxField label="Mostrar campo de email" checked={!!config.showEmail} onChange={(v) => onChange('showEmail', v)} id="ef-email" />
    </>
  );
}

export function ErrorCountdownPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <UrlField label="URL de Redirecionamento" value={(config.redirectUrl as string) || '/'} onChange={(v) => onChange('redirectUrl', v)} />
      <SelectField label="Segundos" value={String((config.seconds as number) || 10)} options={[
        { label: '5s', value: '5' }, { label: '10s', value: '10' }, { label: '15s', value: '15' }, { label: '30s', value: '30' }, { label: '60s', value: '60' },
      ]} onChange={(v) => onChange('seconds', Number(v))} />
      <TextField label="Mensagem" value={(config.message as string) || ''} onChange={(v) => onChange('message', v)} />
      <CheckboxField label="Barra de progresso" checked={!!config.showProgress} onChange={(v) => onChange('showProgress', v)} id="ec-progress" />
      <CheckboxField label="Mostrar segundos" checked={!!config.showSeconds} onChange={(v) => onChange('showSeconds', v)} id="ec-seconds" />
    </>
  );
}

export function ErrorParticlePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Quantidade" value={String((config.count as number) || 50)} options={[
        { label: '20', value: '20' }, { label: '50', value: '50' }, { label: '100', value: '100' }, { label: '200', value: '200' },
      ]} onChange={(v) => onChange('count', Number(v))} />
      <TextField label="Cor (HEX)" value={(config.color as string) || '#4BC5FF'} onChange={(v) => onChange('color', v)} />
      <SelectField label="Opacidade" value={String((config.opacity as number) ?? 0.6)} options={[
        { label: '0.2', value: '0.2' }, { label: '0.4', value: '0.4' }, { label: '0.6', value: '0.6' }, { label: '0.8', value: '0.8' }, { label: '1.0', value: '1' },
      ]} onChange={(v) => onChange('opacity', Number(v))} />
      <SelectField label="Tipo" value={(config.type as string) || 'stars'} options={[
        { label: 'Estrelas', value: 'stars' }, { label: 'Neve', value: 'snow' }, { label: 'Vaga-lumes', value: 'firefly' }, { label: 'Bolhas', value: 'bubbles' },
      ]} onChange={(v) => onChange('type', v)} />
    </>
  );
}

export function ErrorMazePanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Tamanho" value={String((config.size as number) || 8)} options={[
        { label: '4', value: '4' }, { label: '6', value: '6' }, { label: '8', value: '8' }, { label: '10', value: '10' }, { label: '15', value: '15' },
      ]} onChange={(v) => onChange('size', Number(v))} />
      <CheckboxField label="Mostrar timer" checked={!!config.showTimer} onChange={(v) => onChange('showTimer', v)} id="emz-timer" />
      <SelectField label="Dificuldade" value={(config.difficulty as string) || 'medium'} options={[
        { label: 'Fácil', value: 'easy' }, { label: 'Médio', value: 'medium' }, { label: 'Difícil', value: 'hard' },
      ]} onChange={(v) => onChange('difficulty', v)} />
    </>
  );
}

export function ErrorPollPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Pergunta" value={(config.question as string) || ''} onChange={(v) => onChange('question', v)} />
      <CheckboxField label="Mostrar resultados" checked={!!config.showResults} onChange={(v) => onChange('showResults', v)} id="ep-results" />
      <CheckboxField label="Múltipla escolha" checked={!!config.allowMultiple} onChange={(v) => onChange('allowMultiple', v)} id="ep-multi" />
      <ItemsListEditor
        label="Opções"
        fields={[
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'votes', label: 'Votos', type: 'number' },
        ]}
        items={(config.options as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('options', v)}
      />
    </>
  );
}

export function ErrorFactPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Rotação" value={(config.rotation as string) || 'random'} options={[
        { label: 'Aleatória', value: 'random' }, { label: 'Sequencial', value: 'sequential' },
      ]} onChange={(v) => onChange('rotation', v)} />
      <CheckboxField label="Mostrar fonte" checked={!!config.showSource} onChange={(v) => onChange('showSource', v)} id="efct-source" />
      <ItemsListEditor
        label="Fatos"
        fields={[
          { key: 'text', label: 'Texto', type: 'textarea' },
          { key: 'source', label: 'Fonte', type: 'text' },
        ]}
        items={(config.facts as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('facts', v)}
      />
    </>
  );
}

export function ErrorSocialPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || 'Não vá ainda!'} onChange={(v) => onChange('title', v)} />
      <TextField label="Mensagem" value={(config.message as string) || ''} onChange={(v) => onChange('message', v)} />
      <SelectField label="Layout" value={(config.layout as string) || 'row'} options={[
        { label: 'Linha', value: 'row' }, { label: 'Coluna', value: 'column' },
      ]} onChange={(v) => onChange('layout', v)} />
      <CheckboxField label="Compartilhar" checked={!!config.showShare} onChange={(v) => onChange('showShare', v)} id="es-share" />
      <CheckboxField label="Seguir" checked={!!config.showFollow} onChange={(v) => onChange('showFollow', v)} id="es-follow" />
    </>
  );
}

export function ErrorCharacterPanel({ config, onChange }: PanelProps) {
  return (
    <>
      <SelectField label="Personagem" value={(config.character as string) || 'sad-robot'} options={[
        { label: 'Robô Triste', value: 'sad-robot' }, { label: 'Fantasma', value: 'ghost' },
        { label: 'Alienígena', value: 'alien' }, { label: 'Gato', value: 'cat' },
        { label: 'Cachorro', value: 'dog' }, { label: 'Coruja', value: 'owl' },
      ]} onChange={(v) => onChange('character', v)} />
      <SelectField label="Humor" value={(config.mood as string) || 'sad'} options={[
        { label: 'Triste', value: 'sad' }, { label: 'Feliz', value: 'happy' },
        { label: 'Confuso', value: 'confused' }, { label: 'Piscada', value: 'wink' },
      ]} onChange={(v) => onChange('mood', v)} />
      <TextField label="Fala" value={(config.speech as string) || ''} onChange={(v) => onChange('speech', v)} />
      <CheckboxField label="Mostrar balão de fala" checked={!!config.showBubble} onChange={(v) => onChange('showBubble', v)} id="ec-bubble" />
    </>
  );
}
