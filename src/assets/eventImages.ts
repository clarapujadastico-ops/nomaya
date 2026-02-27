// Local image overrides — keyed by lowercase event title fragment
// Used when the DB image_url is missing or we have a better local asset
import longevityImg from "./Logevity Session.jpg";
import yogaMatchaImg from "./yoga matcha.jpg";
import afterworkImg from "./afterwork.jpg";

export const LOCAL_EVENT_IMAGES: Record<string, string> = {
  "longevity session":          longevityImg,
  "yivamukti":                  yogaMatchaImg,
  "founding members afterwork": afterworkImg,
};

/** Returns the local asset URL if a match exists, else the DB url */
export function resolveEventImage(title: string, dbUrl: string): string {
  const lower = title.toLowerCase();
  for (const [key, img] of Object.entries(LOCAL_EVENT_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  return dbUrl;
}
