'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { resolveTableIcon, isCustomIcon, TABLE_ICONS } from '@/lib/table-icons';
import { ImagePicker } from '@/components/ui/image-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid3X3, Star, ImageIcon } from 'lucide-react';
import { ICON_CATEGORIES } from '@/data/icons';

interface TableIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  slug: string;
  tenantId?: string;
  size?: 'sm' | 'md';
}

type IconTab = 'lucide' | 'iconify' | 'image';

function isIconify(value: string): boolean {
  return !!value && value.includes(':') && !value.startsWith('http');
}

function IconifyIcon({ icon, className, size = 16 }: { icon: string; className?: string; size?: number }) {
  return <Icon icon={icon} width={size} height={size} className={className} />;
}

function IconRender({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  if (isCustomIcon(name)) {
    return <Image src={name} alt="" width={14} height={14} className={`shrink-0 rounded object-cover ${className || ''}`} />;
  }
  if (isIconify(name)) {
    return <IconifyIcon icon={name} className={className} size={14} />;
  }
  return React.createElement(resolveTableIcon(name), { className } as React.Attributes);
}

export function TableIconPicker({ value, onChange, slug, tenantId, size = 'md' }: TableIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<IconTab>(value ? (isCustomIcon(value) ? 'image' : isIconify(value) ? 'iconify' : 'lucide') : 'lucide');
  const [search, setSearch] = useState('');
  const [iconifyCategory, setIconifyCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? TABLE_ICONS.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : TABLE_ICONS;

  const iconifyFiltered = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return ICON_CATEGORIES.flatMap(c => c.icons).filter(id => id.toLowerCase().includes(q));
    }
    if (iconifyCategory === 'all') {
      return ICON_CATEGORIES.flatMap(c => c.icons);
    }
    return ICON_CATEGORIES.find(c => c.id === iconifyCategory)?.icons || [];
  }, [search, iconifyCategory]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {size === 'sm' ? (
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-lg border bg-background hover:bg-muted transition-colors px-2 py-1.5 text-xs ${
              value ? 'border-primary/30' : 'border-dashed'
            }`}
            title={value || 'Selecionar ícone'}
          >
            {value?.startsWith('http') ? (
              <Image src={value} alt="" width={14} height={14} className="shrink-0 rounded object-cover" />
            ) : value ? (
              <IconRender name={value} className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground truncate max-w-[80px]">
              {value ? (value.startsWith('http') ? 'Imagem' : value.split(':').pop() || value) : 'Ícone'}
            </span>
          </button>
        ) : (
          <Button variant="outline" className="w-full justify-start gap-2 h-10">
            {value?.startsWith('http') ? (
              <Image src={value} alt="" width={16} height={16} className="shrink-0 rounded object-cover" />
            ) : value ? (
              <IconRender name={value} className="h-4 w-4 shrink-0" />
            ) : null}
            <span className="text-sm truncate">
              {value ? (value.startsWith('http') ? 'Imagem personalizada' : value.split(':').pop() || value) : 'Selecionar ícone'}
            </span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex gap-1 mb-3">
          {([
            { id: 'image' as const, label: 'Imagem', icon: ImageIcon },
            { id: 'lucide' as const, label: 'Simples', icon: Star },
            { id: 'iconify' as const, label: 'Iconify', icon: Grid3X3 },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setSearch(''); }}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'image' && (
          <ImagePicker
            bucket="game-items"
            pathPrefix={`${slug}/table-icons/`}
            value={isCustomIcon(value) ? value : ''}
            onChange={(url) => {
              if (url) {
                onChange(url);
              } else {
                onChange('Database');
              }
              setOpen(false);
            }}
            previewSize="w-full h-20"
            tenantId={tenantId}
          />
        )}

        {tab === 'lucide' && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {filtered.map((name) => {
                  const IconComp = resolveTableIcon(name);
                  const selected = value === name || value === 'lucide:' + name.toLowerCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { onChange('lucide:' + name.toLowerCase()); setOpen(false); }}
                      title={name}
                      className={`flex items-center justify-center rounded-md p-1.5 transition-all text-muted-foreground hover:text-foreground hover:bg-muted ${
                        selected ? 'ring-2 ring-primary bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum ícone encontrado
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'iconify' && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            {!search.trim() && (
              <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setIconifyCategory('all')}
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    iconifyCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas
                </button>
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setIconifyCategory(cat.id)}
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      iconifyCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {iconifyFiltered.map((iconId) => {
                  const selected = value === iconId;
                  return (
                    <button
                      key={iconId}
                      type="button"
                      onClick={() => { onChange(iconId); setOpen(false); }}
                      title={iconId}
                      className={`flex items-center justify-center rounded-md p-1.5 transition-all text-muted-foreground hover:text-foreground hover:bg-muted ${
                        selected ? 'ring-2 ring-primary bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <IconifyIcon icon={iconId} size={16} />
                    </button>
                  );
                })}
              </div>
              {iconifyFiltered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum ícone encontrado
                </p>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
