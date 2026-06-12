'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
}

export function FileUploader({ onFilesSelected, loading }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.md') || f.name.endsWith('.zip')
    );
    if (dropped.length > 0) onFilesSelected(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) onFilesSelected(selected);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors inset-shadow ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,.zip"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {loading ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : (
        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
      )}

      <p className="text-sm font-medium">
        {loading ? 'Processando...' : 'Arraste arquivos .md ou clique para selecionar'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Suporta arquivos Markdown (.md) com frontmatter YAML
      </p>
    </div>
  );
}
