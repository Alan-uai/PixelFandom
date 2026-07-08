import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { validateFile, validateExtension, sanitizeFilename } from '@/lib/upload-validation';
import { virusScanner } from '@/lib/virus-scan';
import { stripImageMetadata } from '@/lib/metadata-strip';
import { checkRateLimit, getRateLimiterForPath } from '@/lib/rate-limiter';
import { getClientIp, getFingerprint, checkRequestForThreats, handleThreatDetection } from '@/lib/threat-detection';
import { getMediaCategory } from '@/lib/upload-validation';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const fingerprint = getFingerprint(request);
  const path = '/api/upload';

  const rl = checkRateLimit(`upload:${ip}`, getRateLimiterForPath(path));
  if (!rl.allowed) {
    await handleThreatDetection(
      { ip, fingerprint, path, method: 'POST' },
      { eventType: 'rate_limit', severity: 'medium', details: { remaining: rl.remaining } },
    );
    return NextResponse.json(
      { error: 'Too many uploads. Please wait before uploading again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenant_id') as string | null;
    const bucket = (formData.get('bucket') as string) || 'wiki-images';
    const pathPrefix = (formData.get('path_prefix') as string) || 'uploads';
    const altText = (formData.get('alt_text') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    const allowedBuckets = ['wiki-images', 'wiki-assets', 'game-items'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer);
    const validation = validateFile(buffer, file.name, file.type);

    if (!validation.valid) {
      await handleThreatDetection(
        { ip, fingerprint, userId: user.id, path, method: 'POST' },
        { eventType: 'invalid_file', severity: 'medium', details: { error: validation.error, filename: file.name } },
      );
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!validateExtension(file.name, validation.detectedMime!)) {
      await handleThreatDetection(
        { ip, fingerprint, userId: user.id, path, method: 'POST' },
        { eventType: 'invalid_file', severity: 'medium', details: { error: 'Extension/MIME mismatch', filename: file.name, detected: validation.detectedMime } },
      );
      return NextResponse.json({ error: 'File extension does not match file content' }, { status: 400 });
    }

    let cleanBuffer = buffer;
    let width: number | undefined;
    let height: number | undefined;
    let outputMime = validation.detectedMime!;

    const category = getMediaCategory(validation.detectedMime!);
    if (category === 'image') {
      try {
        const stripped = await stripImageMetadata(buffer, validation.detectedMime!);
        cleanBuffer = stripped.buffer;
        width = stripped.width;
        height = stripped.height;
        outputMime = `image/${stripped.format}`;
      } catch (err) {
        console.error('Metadata stripping failed:', err);
      }
    }

    const scanResult = await virusScanner.scanBuffer(cleanBuffer);

    if (!scanResult.clean) {
      if (scanResult.virusName) {
        await handleThreatDetection(
          { ip, fingerprint, userId: user.id, path, method: 'POST' },
          {
            eventType: 'malware_upload',
            severity: 'critical',
            details: { virusName: scanResult.virusName, filename: file.name },
          },
        );
        return NextResponse.json({
          error: 'File rejected: malware detected',
          virusName: scanResult.virusName,
        }, { status: 422 });
      }

      if (scanResult.error) {
        console.error('ClamAV scan error:', scanResult.error);
      }
    }

    const filename = validation.sanitizedFilename || sanitizeFilename(file.name);
    const filePath = `${pathPrefix}/${Date.now()}-${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, cleanBuffer, {
        contentType: outputMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const { data: mediaRecord, error: mediaError } = await supabase
      .from('wiki_media')
      .insert({
        tenant_id: tenantId,
        uploaded_by: user.id,
        file_name: filename,
        file_size: cleanBuffer.length,
        mime_type: outputMime,
        storage_path: filePath,
        public_url: publicUrl,
        alt_text: altText,
        width: width || null,
        height: height || null,
        scan_status: scanResult.clean ? 'clean' : scanResult.scanned ? 'clean' : 'pending',
        scan_result: scanResult.virusName
          ? { virus: scanResult.virusName } as Record<string, unknown>
          : {} as Record<string, unknown>,
        file_hash: validation.fileHash || null,
        original_filename: file.name,
        threat_detected: false,
      })
      .select('id, file_name, public_url, alt_text, created_at')
      .single();

    if (mediaError) {
      console.error('Failed to save media record:', mediaError);
    }

    return NextResponse.json({
      url: publicUrl,
      media: mediaRecord || null,
      scan_status: scanResult.clean ? 'clean' : 'pending',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
