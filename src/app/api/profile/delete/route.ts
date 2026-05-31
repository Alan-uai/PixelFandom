import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const body = await request.json().catch(() => ({}));
  const successors: Record<string, string> = body.successors || {};

  const { data: ownedTenants } = await supabase
    .from('tenant_members')
    .select('tenant_id, tenants!inner(name)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .returns<{ tenant_id: string; tenants: { name: string } }[]>();

  if (ownedTenants && ownedTenants.length > 0) {
    for (const membership of ownedTenants) {
      const tenantId = membership.tenant_id;
      const successorId = successors[tenantId];

      if (successorId) {
        await transferOwnership(supabase, tenantId, userId, successorId);
      } else {
        const { data: admins } = await supabase
          .from('tenant_members')
          .select('user_id')
          .eq('tenant_id', tenantId)
          .eq('role', 'admin')
          .neq('user_id', userId);

        if (admins && admins.length > 0) {
          const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
          await transferOwnership(supabase, tenantId, userId, randomAdmin.user_id);
        } else {
          const { data: editors } = await supabase
            .from('tenant_members')
            .select('user_id')
            .eq('tenant_id', tenantId)
            .neq('user_id', userId)
            .limit(1);

          if (editors && editors.length > 0) {
            await transferOwnership(supabase, tenantId, userId, editors[0].user_id);
          }
        }
      }
    }
  }

  await supabase.from('notifications').delete().eq('user_id', userId);
  await supabase.from('user_preferences').delete().eq('user_id', userId);
  await supabase.from('tenant_members').delete().eq('user_id', userId);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
    }
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set — auth user not deleted');
  }

  return NextResponse.json({ success: true });
}

async function transferOwnership(
  supabase: any,
  tenantId: string,
  oldOwnerId: string,
  newOwnerId: string,
) {
  await supabase
    .from('tenant_members')
    .update({ role: 'admin' })
    .eq('tenant_id', tenantId)
    .eq('user_id', oldOwnerId);

  await supabase
    .from('tenant_members')
    .update({ role: 'owner' })
    .eq('tenant_id', tenantId)
    .eq('user_id', newOwnerId);
}
