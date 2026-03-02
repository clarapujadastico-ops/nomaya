// Local image overrides — keyed by lowercase event title fragment
import longevityImg from "./Logevity Session.jpg";
import yogaImg      from "./vinyasa yoga.webp";
import afterworkImg from "./afterwork.jpg";

export const LOCAL_EVENT_IMAGES: Record<string, string> = {
  // Local assets
  "longevity":   longevityImg,
  "vinyasa":     yogaImg,
  "holistic":    yogaImg,
  "yivamukti":   yogaImg,
  "afterwork":   afterworkImg,

  // Unsplash fallbacks for events without DB images
  "brunch":      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop&auto=format",
  "jewelry":     "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format",
  "jewel":       "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format",
  "matcha":      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&h=600&fit=crop&auto=format",
  "journal":     "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop&auto=format",
  "pottery":     "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=600&fit=crop&auto=format",
  "ceramic":     "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=600&fit=crop&auto=format",
  "painting":    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop&auto=format",
  "yoga":        yogaImg,
};

/** Uses DB url if set (Supabase Storage), else falls back to local/Unsplash by keyword */
export function resolveEventImage(title: string, dbUrl: string): string {
  if (dbUrl) return dbUrl;
  const lower = title.toLowerCase();
  for (const [key, img] of Object.entries(LOCAL_EVENT_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  return "";
}
