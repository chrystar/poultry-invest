import { sendPushNotifications } from './sendPushNotification';
import { supabase } from './supabase';

type NotifyParams = {
  userIds: string[];
  title: string;
  body: string;
  type?: 'reservation' | 'venture' | 'general';
  route?: string | null;
};

export async function notifyUsers({ userIds, title, body, type = 'general', route = null }: NotifyParams) {
  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length === 0) return;

  // 1. In-app notification feed
  await supabase.from('notifications').insert(
    uniqueIds.map((user_id) => ({ user_id, title, body, type, route }))
  );

  // 2. Native push, only to users who have a token registered
  const { data: profiles } = await supabase
    .from('profiles')
    .select('push_token')
    .in('id', uniqueIds)
    .not('push_token', 'is', null);

  const pushMessages = (profiles ?? [])
    .filter((p) => p.push_token)
    .map((p) => ({
      to: p.push_token as string,
      title,
      body,
      data: route ? { route } : undefined,
    }));

  await sendPushNotifications(pushMessages);
}