'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OldWikiEditRedirect() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.articleId as string;

  useEffect(() => {
    router.replace(`/dashboard?editor=${articleId}`);
  }, [router, articleId]);

  return null;
}
