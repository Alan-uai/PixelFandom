'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGuildData } from './guild-data-context';
import { Shield, Check } from 'lucide-react';

interface RoleSelectProps {
  roleId: string;
  roleName: string;
  onChange: (roleId: string, roleName: string) => void;
  label: string;
  description?: string;
}

export function RoleSelect({ roleId, roleName, onChange, label, description }: RoleSelectProps) {
  const { roles, selectedGuild, loading } = useGuildData();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentName = roleId
    ? roles.find((r) => r.id === roleId)?.name ?? ''
    : roleName;

  useEffect(() => {
    setInputValue(currentName);
  }, [currentName]);

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectById = useCallback((id: string) => {
    const role = roles.find((r) => r.id === id);
    if (role) {
      onChange(id, '');
      setInputValue(role.name);
    }
    setIsOpen(false);
  }, [roles, onChange]);

  const commitText = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      onChange('', '');
      return;
    }
    const match = roles.find((r) => r.name === trimmed);
    if (match) {
      onChange(match.id, '');
    } else {
      onChange('', trimmed);
    }
  }, [roles, inputValue, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {!selectedGuild ? (
        <p className="text-xs text-muted-foreground">Selecione um servidor primeiro.</p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Carregando cargos...</p>
      ) : (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
                setHighlightIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(commitText, 160)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (highlightIndex >= 0 && filtered[highlightIndex]) {
                    selectById(filtered[highlightIndex].id);
                  } else {
                    commitText();
                    (e.target as HTMLInputElement).blur();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder="@ cargo ou digite para criar"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {inputValue.trim()
                    ? 'Nenhum cargo existente. O bot criará um novo com esse nome.'
                    : 'Digite para buscar ou criar um cargo.'}
                </div>
              ) : (
                filtered.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={() => selectById(r.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      i === highlightIndex ? 'bg-accent text-accent-foreground' : ''
                    } ${r.id === roleId ? 'bg-primary/10' : ''}`}
                  >
                    <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{r.name}</span>
                    {r.id === roleId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
