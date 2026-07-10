'use client';

import { sanitizeUrl } from '@/lib/sanitize';
import { Checkbox3D } from '@/components/ui/checkbox-3d';

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox3D checked={checked} onChange={onChange} size="sm" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1 text-xs" />
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-md border bg-background px-2 py-1 text-xs resize-none" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
      )}
    </div>
  );
}

export function UrlField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="url" value={value} onChange={(e) => onChange(sanitizeUrl(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-xs" />
    </div>
  );
}
