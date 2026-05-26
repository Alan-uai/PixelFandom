import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('q');

    if (!slug || !query) {
      return NextResponse.json(
        { error: 'slug and q query parameters required' },
        { status: 400 }
      );
    }

    const result = await searchAll(slug, query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', wiki: [], collection: [] },
      { status: 500 }
    );
  }
}
