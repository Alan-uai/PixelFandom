import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = request.headers.get('origin') || 'https://pixelfandom.vercel.app';
  const inviteUrl = `${origin}/invite/${token}`;

  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteUrl)}`;
    const response = await fetch(qrApiUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 502 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 502 });
  }
}
