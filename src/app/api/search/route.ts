import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/search';

function extractSearchTerms(rawQuery: string): string {
  const stopwords = /\b(como|obter|qual|onde|quais|tem|para|uma|um|dos|das|com|que|são|sao|este|esta|isso|isto|essa|esse|para|mais|muito|bem|vai|pode|fazer|acha|era|foi|seus|suas|seu|sua|pelo|pela|entre|num|numa|na|no|da|do|em|de|e|a|o|as|os|ao|aos|às|dum|duma|duns|dumas|daquele|daquela|naquele|naquela|naquilo|àquele|àquela|àquilo|neste|nesta|nisso|nesse|nessa|naquilo|ou|se|me|te|lhe|nos|vos|lhes|ele|ela|eles|elas|nós|vós|eu|tu|voce|você|nos|minha|meu|tua|teu|sua|seu|nossa|nosso|dela|dele|deles|delas|aqui|ali|lá|cá|sim|não|nao|ja|já|só|so|ainda|sempre|nunca|tambem|também|apenas|agora|depois|antes|hoje|ontem|amanhã|amanha|enquanto|durante|ate|até|sem|sob|sobre|trás|tras|detras|detrás|frente|atras|atrás|apos|após|contra|perante|segundo|conforme|consoante|mediante|salvo|exceto|menos|fora|afora|dentro|cerca|acerca|acima|abaixo|adiante|além|alem|ao_lado|em_volta|em_torno|através|atraves|apesar|conquanto|embora|posto|porquanto|pois|porque|por_que|porquê|ja_que|já_que|uma_vez|visto|dado|devido|graças|obrigado)\b/gi;
  return rawQuery.replace(stopwords, '').replace(/\s+/g, ' ').trim() || rawQuery.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const rawQuery = searchParams.get('q');

    if (!slug || !rawQuery) {
      return NextResponse.json(
        { error: 'slug and q query parameters required' },
        { status: 400 }
      );
    }

    const cleanedQuery = extractSearchTerms(rawQuery);
    const result = await searchAll(slug, cleanedQuery);
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', wiki: [], collection: [], game_items: [] },
      { status: 500 }
    );
  }
}
