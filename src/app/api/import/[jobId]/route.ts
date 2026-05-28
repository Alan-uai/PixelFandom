import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const { data: job, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 });
    }

    const { data: logs } = await supabase
      .from('import_log')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      ...job,
      logs: logs || [],
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Falha ao buscar job' }, { status: 500 });
  }
}
