// Move all data of a household to a new random code and retire the old one.
// Deletes the household's push subscriptions (they belong to the old URL);
// members re-enable notifications from the new install. Sends no notifications.
// usage: node --env-file=.env.local scripts/move-household.mjs <old_code>
import { neon } from '@neondatabase/serverless';
import { randomInt } from 'node:crypto';

const oldCode = process.argv[2];
if (!oldCode) { console.error('usage: move-household.mjs <old_code>'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

// Same alphabet as genCode() in app/page.tsx
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let newCode;
do {
  newCode = Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join('');
} while ((await sql`SELECT 1 FROM households WHERE code = ${newCode}`).length);

await sql`CREATE TABLE IF NOT EXISTS closed_households (code text PRIMARY KEY, closed_at bigint NOT NULL)`;

const r = await sql.transaction([
  sql`INSERT INTO households (code) VALUES (${newCode})`,
  sql`UPDATE items SET household_code = ${newCode} WHERE household_code = ${oldCode} RETURNING id`,
  sql`UPDATE expenses SET household_code = ${newCode} WHERE household_code = ${oldCode} RETURNING id`,
  sql`UPDATE custom_products SET household_code = ${newCode} WHERE household_code = ${oldCode} RETURNING id`,
  sql`UPDATE members SET household_code = ${newCode} WHERE household_code = ${oldCode} RETURNING name`,
  sql`UPDATE member_renames SET household_code = ${newCode} WHERE household_code = ${oldCode} RETURNING old_name`,
  sql`DELETE FROM push_subscriptions WHERE household_code = ${oldCode} RETURNING id`,
  sql`DELETE FROM households WHERE code = ${oldCode} RETURNING code`,
  sql`INSERT INTO closed_households (code, closed_at) VALUES (${oldCode}, ${Date.now()})`,
]);
console.log(`Moved ${oldCode} → ${newCode}`);
console.log(`  items: ${r[1].length}, expenses: ${r[2].length}, custom products: ${r[3].length}, members: ${r[4].length}, renames: ${r[5].length}`);
console.log(`  push subscriptions removed: ${r[6].length}; ${oldCode} is now closed`);
console.log(`\nNEW HOUSEHOLD CODE: ${newCode}`);
