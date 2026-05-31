'use client';

import Link from 'next/link';
import { Headphones } from 'lucide-react';

type Props = {
  tenantSlug: string;
  isActive?: boolean;
};

export default function VoiceChat({ tenantSlug, isActive }: Props) {
  return (
    <Link
      href={`/w/${tenantSlug}/voice`}
      className={`rounded-md p-2 transition-colors ${
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
      title="Configurações de IA"
    >
      <Headphones className="h-4 w-4" />
    </Link>
  );
}
