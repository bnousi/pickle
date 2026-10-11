import sql from '@/app/lib/db';

// Display-name renames per household (old name → new name). Clients that still
// hold the old name keep sending it until they pick up the rename from GET /api/sync,
// so every write maps names through this table first.
export async function getRenames(code: string): Promise<Record<string, string>> {
  try {
    const rows = await sql`SELECT old_name, new_name FROM member_renames WHERE household_code = ${code}`;
    return Object.fromEntries(rows.map(r => [r.old_name as string, r.new_name as string]));
  } catch {
    return {}; // table not created yet
  }
}

export function applyRename(renames: Record<string, string>, name: unknown): string {
  const n = (name as string) ?? '';
  return renames[n] ?? n;
}
