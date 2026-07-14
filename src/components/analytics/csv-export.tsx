'use client';

import { Download } from 'lucide-react';
import { type AnalyticsData } from './types';

interface CsvExportProps {
  data: AnalyticsData;
  label: string;
}

export function CsvExport({ data, label }: CsvExportProps) {
  const handleExport = () => {
    const rows: string[][] = [
      ['metric', 'value', 'period'],
      ['Total Views', String(data.pageViews.total), data.period],
      ['Total Chats', String(data.chatUsage.total), data.period],
      ['Unique Visitors', String(data.pageViews.uniqueVisitors), data.period],
      [],
      ['day', 'views', 'unique_visitors'],
      ...data.pageViews.daily.map((d) => [d.day, String(d.views), String(d.unique_visitors)]),
      [],
      ['day', 'total_questions', 'unique_users', 'avg_latency_ms'],
      ...data.chatUsage.daily.map((d) => [d.day, String(d.total_questions), String(d.unique_users), String(d.avg_latency_ms)]),
      [],
      ['page', 'views', 'unique_visitors'],
      ...data.pageViews.topPages.map((p) => [p.page_title || p.page_path, String(p.views), String(p.unique_visitors)]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${data.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
