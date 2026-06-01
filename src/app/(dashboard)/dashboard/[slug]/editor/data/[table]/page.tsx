'use client';

import { useParams } from 'next/navigation';
import DataTableContent from '@/components/editor/data-table-content';

export default function DataTablePage() {
  const params = useParams();
  const slug = params.slug as string;
  const table = params.table as string;

  return <DataTableContent slug={slug} table={table} />;
}
