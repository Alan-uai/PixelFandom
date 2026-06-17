'use client';

import Link from 'next/link';
import { MAIN_URL } from '@/lib/constants';
import React from 'react'

interface HubLinkProps {
  children: React.ReactNode;
  className?: string;
  isExternal?: boolean;
}

export default function HubLink({ children, className, isExternal = false }: HubLinkProps) {
  if (isExternal) {
    return <a href={MAIN_URL} className={className}>{children}</a>;
  }
  return <Link href="/" className={className}>{children}</Link>;
}
