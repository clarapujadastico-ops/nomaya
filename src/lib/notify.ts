import { supabase } from "./supabase";

/** Fire-and-forget push notification — never throws. */
export async function sendPush(params: {
  userId?: string;
  userIds?: string[];
  circleId?: string;
  excludeUserId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    await supabase.functions.invoke("send-push", { body: params });
  } catch {
    // Push is non-critical — fail silently
  }
}
