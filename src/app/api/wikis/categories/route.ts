import { NextResponse } from 'next/server';
import { readdirSync, existsSync } from 'fs';
import path from 'path';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const categories: { slug: string; name: string }[] = [];

  if (existsSync(dataDir)) {
    for (const entry of readdirSync(dataDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        categories.push({
          slug: entry.name,
          name: entry.name
            .split(/[-_]/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        });
      }
    }
  }

  return NextResponse.json(categories.sort((a, b) => a.name.localeCompare(b.name)));
}
