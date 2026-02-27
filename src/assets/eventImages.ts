// Local image overrides — keyed by lowercase event title fragment
// Used when the DB image_url is missing or we have a better local asset
import longevityImg from "./Logevity Session.jpg";
import yogaMatchaImg from "./yoga matcha.jpg";

export const LOCAL_EVENT_IMAGES: Record<string, string> = {
  "longevity session": longevityImg,
  "yivamukti":         yogaMatchaImg,
};

// Remote Supabase storage overrides — upload the file to the Events bucket with the matching filename
const SUPABASE_EVENTS_URL = "https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events";
const REMOTE_EVENT_IMAGES: Record<string, string> = {
  "founding members afterwork": `${SUPABASE_EVENTS_URL}/afterwork.jpg`,
};

/** Returns the local asset URL if a match exists, else the Supabase override, else the DB url */
export function resolveEventImage(title: string, dbUrl: string): string {
  const lower = title.toLowerCase();
  for (const [key, img] of Object.entries(LOCAL_EVENT_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  for (const [key, url] of Object.entries(REMOTE_EVENT_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return dbUrl;
}
