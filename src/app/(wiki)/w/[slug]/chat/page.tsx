'use client';

import { useParams } from 'next/navigation';
import WikiChat from '@/components/wiki/wiki-chat';

export default function WikiChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="flex flex-col flex-1">
      <WikiChat tenantSlug={slug} />
    </div>
  );
}
