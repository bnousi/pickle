// Rename a household member everywhere. Sends no push notifications.
// usage: node --env-file=.env.local scripts/rename-member.mjs <household_code> <old_name> <new_name>
import { neon } from '@neondatabase/serverless';

const [code, oldName, newName] = process.argv.slice(2);
if (!code || !oldName || !newName) {
  console.error('usage: rename-member.mjs <household_code> <old_name> <new_name>');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS member_renames (
  household_code text NOT NULL, old_name text NOT NULL, new_name text NOT NULL,
  PRIMARY KEY (household_code, old_name))`;

const results = await sql.transaction([
  sql`INSERT INTO member_renames (household_code, old_name, new_name) VALUES (${code}, ${oldName}, ${newName})
      ON CONFLICT (household_code, old_name) DO UPDATE SET new_name = EXCLUDED.new_name`,
  sql`INSERT INTO members (household_code, name) VALUES (${code}, ${newName}) ON CONFLICT DO NOTHING`,
  sql`DELETE FROM members WHERE household_code = ${code} AND name = ${oldName} RETURNING name`,
  sql`UPDATE items SET added_by = ${newName} WHERE household_code = ${code} AND added_by = ${oldName} RETURNING id`,
  sql`UPDATE expenses SET paid_by = ${newName} WHERE household_code = ${code} AND paid_by = ${oldName} RETURNING id`,
  sql`UPDATE push_subscriptions SET user_name = ${newName} WHERE household_code = ${code} AND user_name = ${oldName} RETURNING id`,
]);
console.log(`Renamed "${oldName}" → "${newName}" in ${code}:`);
console.log(`  members: ${results[2].length}, items: ${results[3].length}, expenses: ${results[4].length}, push subscriptions: ${results[5].length}`);
