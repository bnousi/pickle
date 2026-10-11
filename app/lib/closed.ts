import sql from '@/app/lib/db';

// Household codes that were retired (data moved to a new code). They can't be
// used or re-created, so anyone still holding the old code is locked out.
export async function isClosed(code: string): Promise<boolean> {
  try {
    const rows = await sql`SELECT 1 FROM closed_households WHERE code = ${code.toUpperCase()}`;
    return rows.length > 0;
  } catch {
    return false; // table not created yet
  }
}

export const closedResponse = () => Response.json({ error: 'household closed' }, { status: 403 });
