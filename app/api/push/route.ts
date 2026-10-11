import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { getRenames, applyRename } from '@/app/lib/renames';
import { isClosed, closedResponse } from '@/app/lib/closed';

// POST /api/push?code=XXX  — save or delete subscription
export async function POST(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const rawUser = req.nextUrl.searchParams.get('user');
  if (!code || !rawUser) return NextResponse.json({ error: 'missing params' }, { status: 400 });
  if (await isClosed(code)) return closedResponse();

  const userName = applyRename(await getRenames(code), rawUser);

  const body = await req.json();
  const { action, subscription } = body as { action: 'subscribe' | 'unsubscribe'; subscription: PushSubscriptionJSON };

  if (action === 'subscribe') {
    const id = (subscription.endpoint ?? '').slice(-40);
    await sql`
      INSERT INTO push_subscriptions (id, household_code, user_name, subscription, created_at)
      VALUES (${id}, ${code}, ${userName}, ${JSON.stringify(subscription)}, ${Date.now()})
      ON CONFLICT (id) DO UPDATE SET subscription = EXCLUDED.subscription, user_name = EXCLUDED.user_name
    `;
  } else {
    const id = (subscription.endpoint ?? '').slice(-40);
    await sql`DELETE FROM push_subscriptions WHERE id = ${id}`;
  }

  return NextResponse.json({ ok: true });
}

