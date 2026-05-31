'use client';

import { Plus, Trash2 } from 'lucide-react';

interface TableEditorProps {
  label: string;
  headers: string[];
  rows: string[][];
  onHeadersChange: (headers: string[]) => void;
  onRowsChange: (rows: string[][]) => void;
  maxRows?: number;
  maxCols?: number;
}

export function TableEditor({ label, headers, rows, onHeadersChange, onRowsChange, maxRows = 500, maxCols = 20 }: TableEditorProps) {
  const numCols = Math.max(headers.length, 1);

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onRowsChange([...rows, Array(numCols).fill('')]);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const next = rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row
    );
    onRowsChange(next);
  };

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, value: string) => {
    const next = headers.map((h, i) => (i === index ? value : h));
    onHeadersChange(next);
  };

  const addColumn = () => {
    if (numCols >= maxCols) return;
    onHeadersChange([...headers, '']);
    onRowsChange(rows.map((row) => [...row, '']));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{rows.length}/{maxRows}</span>
          <button onClick={addColumn} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Adicionar coluna">
            +Col
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border p-1">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    placeholder={`Coluna ${i + 1}`}
                    className="w-full bg-transparent outline-none text-center text-[10px]"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border p-1">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-full bg-transparent outline-none text-[10px]"
                    />
                  </td>
                ))}
                <td className="w-6 border p-1">
                  <button onClick={() => removeRow(ri)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length < maxRows && (
        <button onClick={addRow} className="flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center">
          <Plus className="w-3 h-3" />
          Adicionar linha
        </button>
      )}
    </div>
  );
}
