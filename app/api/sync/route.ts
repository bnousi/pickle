import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { sendPushToOthers } from '@/app/lib/push';
import { getRenames, applyRename } from '@/app/lib/renames';
import { isClosed, closedResponse } from '@/app/lib/closed';

function toItem(i: Record<string, unknown>) {
  return {
    ...i,
    bought: i.bought === true || i.bought === 't',
    createdAt: Number(i.createdAt),
    updatedAt: Number(i.updatedAt),
  };
}

function toExpense(e: Record<string, unknown>) {
  return {
    ...e,
    amount: Number(e.amount),
    createdAt: Number(e.createdAt),
    settledAt: e.settledAt ? Number(e.settledAt) : undefined,
    category: (e.category as string) || 'other',
  };
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });
  if (await isClosed(code)) return closedResponse();

  const [items, expenses, customProducts, members, renames] = await Promise.all([
    sql`SELECT id, name, quantity, notes, category, emoji, bought,
               added_by as "addedBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM items WHERE household_code = ${code} ORDER BY created_at DESC`,
    sql`SELECT id, paid_by as "paidBy", amount, note, category, created_at as "createdAt", settled_at as "settledAt"
        FROM expenses WHERE household_code = ${code} ORDER BY created_at DESC`,
    sql`SELECT id, name, category FROM custom_products WHERE household_code = ${code}`,
    sql`SELECT name FROM members WHERE household_code = ${code}`,
    getRenames(code),
  ]);

  const allExpenses = expenses.map(e => toExpense(e as Record<string, unknown>));
  const currentExpenses = allExpenses.filter(e => !e.settledAt);
  const settledExpenses = allExpenses.filter(e => e.settledAt);

  // Group settled expenses by settlement timestamp
  const historyMap = new Map<number, typeof allExpenses>();
  for (const e of settledExpenses) {
    const key = e.settledAt as number;
    if (!historyMap.has(key)) historyMap.set(key, []);
    historyMap.get(key)!.push(e);
  }
  const history = Array.from(historyMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([settledAt, exps]) => ({
      settledAt,
      total: exps.reduce((s, e) => s + (e.amount as number), 0),
      expenses: exps,
    }));

  return NextResponse.json({
    items: items.map(i => toItem(i as Record<string, unknown>)),
    expenses: currentExpenses,
    customProducts,
    members: members.map(m => m.name),
    history,
    renames,
  });
}

export async function POST(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });
  if (await isClosed(code)) return closedResponse();

  const body = await req.json();
  const { type, action, data: rawData } = body as {
    type: 'item' | 'expense' | 'custom_product' | 'member';
    action: 'upsert' | 'delete' | 'settle_all';
    data: Record<string, unknown>;
  };
  const renames = await getRenames(code);
  const data: Record<string, unknown> = { ...rawData };
  if ('name' in data && type === 'member') data.name = applyRename(renames, data.name);
  if ('addedBy' in data) data.addedBy = applyRename(renames, data.addedBy);
  if ('paidBy' in data) data.paidBy = applyRename(renames, data.paidBy);

  if (type === 'member') {
    await sql`INSERT INTO members (household_code, name) VALUES (${code}, ${data.name as string}) ON CONFLICT DO NOTHING`;
  } else if (type === 'item') {
    if (action === 'upsert') {
      const d = data;
      const existing = await sql`SELECT id, bought FROM items WHERE id = ${d.id as string}`;
      await sql`
        INSERT INTO items (id, household_code, name, quantity, notes, category, emoji, bought, added_by, created_at, updated_at)
        VALUES (${d.id as string}, ${code}, ${d.name as string}, ${(d.quantity ?? '1') as string}, ${(d.notes ?? '') as string},
                ${d.category as string}, ${(d.emoji ?? '') as string}, ${d.bought as boolean},
                ${(d.addedBy ?? '') as string}, ${d.createdAt as number}, ${(d.updatedAt ?? d.createdAt) as number})
        ON CONFLICT (id) DO UPDATE SET
          bought = EXCLUDED.bought,
          quantity = EXCLUDED.quantity,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at
      `;
      const sender = (d.addedBy as string) || '';
      if (existing.length === 0) {
        await sendPushToOthers(code, sender, '🛒 ' + (d.name as string), (sender || 'Someone') + ' added it to the list');
      } else if (d.bought === true && existing[0].bought !== true && existing[0].bought !== 't') {
        await sendPushToOthers(code, sender, '✅ ' + (d.name as string), (sender || 'Someone') + ' checked it off');
      }
    } else if (action === 'delete') {
      await sql`DELETE FROM items WHERE id = ${data.id as string} AND household_code = ${code}`;
    }
  } else if (type === 'expense') {
    if (action === 'upsert') {
      const d = data;
      const existingExp = await sql`SELECT id FROM expenses WHERE id = ${d.id as string}`;
      await sql`
        INSERT INTO expenses (id, household_code, paid_by, amount, note, created_at, category)
        VALUES (${d.id as string}, ${code}, ${d.paidBy as string}, ${d.amount as number}, ${(d.note ?? '') as string}, ${d.createdAt as number}, ${(d.category ?? 'other') as string})
        ON CONFLICT (id) DO UPDATE SET
          paid_by = EXCLUDED.paid_by,
          amount = EXCLUDED.amount,
          note = EXCLUDED.note,
          created_at = EXCLUDED.created_at,
          category = EXCLUDED.category
      `;
      if (existingExp.length === 0) {
        const payer = (d.paidBy as string) || 'Someone';
        const note = (d.note as string) ? ` · ${d.note}` : '';
        await sendPushToOthers(code, payer, `💸 €${Number(d.amount).toFixed(2)}${note}`, `${payer} logged a purchase`);
      }
    } else if (action === 'delete') {
      await sql`DELETE FROM expenses WHERE id = ${data.id as string} AND household_code = ${code}`;
    } else if (action === 'settle_all') {
      const ts = data.settledAt as number ?? Date.now();
      await sql`UPDATE expenses SET settled_at = ${ts} WHERE household_code = ${code} AND settled_at IS NULL`;
    }
  } else if (type === 'custom_product') {
    if (action === 'upsert') {
      const d = data;
      await sql`
        INSERT INTO custom_products (id, household_code, name, category)
        VALUES (${d.id as string}, ${code}, ${d.name as string}, ${d.category as string})
        ON CONFLICT (id) DO NOTHING
      `;
    } else if (action === 'delete') {
      await sql`DELETE FROM custom_products WHERE id = ${data.id as string} AND household_code = ${code}`;
    }
  }

  return NextResponse.json({ ok: true });
}
