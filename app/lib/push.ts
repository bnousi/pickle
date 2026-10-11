import webpush from 'web-push';
import sql from '@/app/lib/db';

let configured = false;
export function getWebPush() {
  if (!configured) {
    webpush.setVapidDetails(
      'mailto:barbaranousi@gmail.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    configured = true;
  }
  return webpush;
}

export async function sendPushToOthers(code: string, senderName: string, title: string, body: string) {
  const subs = await sql`
    SELECT subscription FROM push_subscriptions
    WHERE household_code = ${code} AND user_name != ${senderName}
  `;
  const wp = getWebPush();
  await Promise.allSettled(
    subs.map(row =>
      wp.sendNotification(row.subscription as webpush.PushSubscription, JSON.stringify({ title, body }))
        .catch(() => {})
    )
  );
}
