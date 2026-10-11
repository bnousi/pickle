import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { isClosed, closedResponse } from '@/app/lib/closed';

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  }
  if (await isClosed(code)) return closedResponse();
  await sql`INSERT INTO households (code) VALUES (${code}) ON CONFLICT DO NOTHING`;
  if (name && typeof name === 'string' && name.trim()) {
    await sql`INSERT INTO members (household_code, name) VALUES (${code}, ${name.trim()}) ON CONFLICT DO NOTHING`;
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || await isClosed(code)) return NextResponse.json({ exists: false });
  const rows = await sql`SELECT code FROM households WHERE code = ${code}`;
  return NextResponse.json({ exists: rows.length > 0 });
}
