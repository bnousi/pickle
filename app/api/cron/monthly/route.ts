import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { CAT } from '@/app/lib/products';
import { getWebPush } from '@/app/lib/push';

const LEGACY_EMOJI: Record<string, string> = {
  supermarket: '🛒', restaurant: '🍽️', home: '🏠', personal: '💊', other: '📦',
};
function catEmoji(cat: string) {
  if (cat in CAT) return CAT[cat as keyof typeof CAT].emoji;
  return LEGACY_EMOJI[cat] ?? '📦';
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
  const auth = req.headers.get('authorization');
  const isPreview = req.nextUrl.searchParams.get('preview') === '1';
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // preview=1 uses current month, otherwise last month
  const monthOffset = isPreview ? 0 : 1;
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
  const from = firstOfLastMonth.getTime();
  const to = firstOfThisMonth.getTime();
  const monthName = firstOfLastMonth.toLocaleString('en', { month: 'long', year: 'numeric' });

  const households = await sql`SELECT DISTINCT household_code FROM push_subscriptions`;

  for (const { household_code } of households) {
    const expenses = await sql`
      SELECT amount, category FROM expenses
      WHERE household_code = ${household_code}
        AND created_at >= ${from} AND created_at < ${to}
    `;
    if (expenses.length === 0) continue;

    const total = expenses.reduce((s: number, e: Record<string, unknown>) => s + Number(e.amount), 0);

    // Per-category totals, sorted descending
    const bycat: Record<string, number> = {};
    for (const e of expenses) {
      const cat = (e.category as string) || 'other';
      bycat[cat] = (bycat[cat] || 0) + Number(e.amount);
    }
    const breakdown = Object.entries(bycat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${catEmoji(cat)} €${amt.toFixed(0)}`)
      .join('  ');

    const subs = await sql`SELECT subscription FROM push_subscriptions WHERE household_code = ${household_code}`;
    const webpush = getWebPush();

    await Promise.allSettled(
      subs.map((row: Record<string, unknown>) =>
        webpush.sendNotification(
          row.subscription as import('web-push').PushSubscription,
          JSON.stringify({
            title: `📊 ${monthName} — €${total.toFixed(2)}`,
            body: breakdown,
            url: '/?open=recap',
          })
        ).catch(() => {})
      )
    );
  }

  return NextResponse.json({ ok: true, processed: households.length });
}
