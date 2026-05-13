'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminManageContentRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/admin/manage-content'); }, [router]);
  return null;
}
