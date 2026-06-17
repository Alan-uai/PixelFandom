import { NextResponse } from 'next/server';

export async function POST() {
  // This is a webhook endpoint called by a cron job (e.g., Vercel Cron or pg_cron)
  // It sends weekly/daily email digests of unread notifications to users
  // For now, this is a placeholder that marks the structure
  return NextResponse.json({ message: 'Digest endpoint ready. Configure cron to call this.' });
}
