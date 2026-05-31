'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Search, X, ChevronLeft, Grid3X3 } from 'lucide-react';
import { ICON_CATEGORIES, searchIcons } from '@/data/icons';
import { IconRenderer, type AnimationStyle } from './icon-renderer';

const ANIMATIONS: { value: AnimationStyle; label: string }[] = [
  { value: 'none', label: 'Estático' },
  { value: 'pulse', label: 'Pulsar' },
  { value: 'spin', label: 'Girar' },
  { value: 'bounce', label: 'Quicar' },
  { value: 'shake', label: 'Agitar' },
  { value: 'wiggle', label: 'Balançar' },
  { value: 'float', label: 'Flutuar' },
  { value: 'glow', label: 'Brilhar' },
];

interface IconPickerProps {
  value?: string;
  animation?: AnimationStyle;
  onChange: (iconId: string, animation: AnimationStyle) => void;
  onClose: () => void;
}

export function IconPicker({ value: currentValue, animation: currentAnim, onChange, onClose }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [anim, setAnim] = useState<AnimationStyle>(currentAnim || 'none');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      const results = searchIcons(search);
      return results.map(r => r.iconId);
    }
    if (category === 'all') {
      const cats = ICON_CATEGORIES;
      return cats.flatMap(c => c.icons);
    }
    return ICON_CATEGORIES.find(c => c.id === category)?.icons || [];
  }, [search, category]);

  const handleSelect = useCallback((iconId: string) => {
    onChange(iconId, anim);
  }, [onChange, anim]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-card border rounded-xl shadow-2xl w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Selecionar Ícone</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícones (ex: home, heart, star)..."
              className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b shrink-0">
          <button
            onClick={() => setCategory('all')}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
              category === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="h-3 w-3 inline-block mr-1" />
            Todas
          </button>
          {ICON_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium capitalize transition-colors ${
                category === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredIcons.length > 0 ? (
            <div className="grid grid-cols-10 sm:grid-cols-12 gap-1">
              {filteredIcons.map((iconId) => (
                <button
                  key={iconId}
                  onClick={() => handleSelect(iconId)}
                  title={iconId}
                  className={`flex items-center justify-center rounded-lg p-2 transition-all hover:bg-muted hover:scale-110 ${
                    currentValue === iconId ? 'ring-2 ring-primary bg-primary/10' : ''
                  }`}
                >
                  <Icon icon={iconId} width={18} height={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon icon="mdi:search-off" width={40} height={40} className="mb-2 opacity-40" />
              <p className="text-xs">Nenhum ícone encontrado</p>
              <p className="text-[10px] mt-1">Tente outros termos de busca</p>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2.5 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            {(ANIMATIONS).map((a) => (
              <button
                key={a.value}
                onClick={() => setAnim(a.value)}
                className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                  anim === a.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {currentValue && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Preview:</span>
                <IconRenderer icon={currentValue} animation={anim} size="md" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface IconPickerTriggerProps {
  value?: string;
  animation?: AnimationStyle;
  onChange: (iconId: string, animation: AnimationStyle) => void;
  size?: 'sm' | 'md';
}

export function IconPickerTrigger({ value, animation, onChange, size = 'md' }: IconPickerTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-lg border bg-background hover:bg-muted transition-colors ${
          size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        } ${value ? 'border-primary/30' : 'border-dashed'}`}
        title={value || 'Selecionar ícone'}
      >
        {value ? (
          <IconRenderer icon={value} animation={animation} size="sm" />
        ) : (
          <Icon icon="lucide:star" width={16} height={16} className="text-muted-foreground" />
        )}
        <span className="text-muted-foreground text-xs truncate max-w-[100px]">
          {value ? value.split(':').pop() : 'Ícone'}
        </span>
        <ChevronLeft className="h-3 w-3 text-muted-foreground -rotate-90 shrink-0" />
      </button>
      {open && (
        <IconPicker
          value={value}
          animation={animation}
          onChange={(iconId, anim) => {
            onChange(iconId, anim);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
