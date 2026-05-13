'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import WikiChat from '@/components/wiki/wiki-chat';
import { ArrowLeft } from 'lucide-react';

export default function WikiChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div>
      <Link
        href={`/w/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para wiki
      </Link>
      <WikiChat tenantSlug={slug} />
    </div>
  );
}
