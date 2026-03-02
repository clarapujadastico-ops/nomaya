import bookImg   from "./circle-book.jpg";
import foodieImg  from "./circle-foodie.png";
import yogaImg    from "./circle-yoga.webp";

const CIRCLE_IMAGE_KEYWORDS: Record<string, string> = {
  // Local assets
  "book":      bookImg,
  "bookworm":  bookImg,
  "reading":   bookImg,
  "literary":  bookImg,
  "foodie":    foodieImg,
  "food":      foodieImg,
  "yoga":      yogaImg,
  "yogi":      yogaImg,
  "pilates":   yogaImg,

  // Unsplash by theme
  "wine":      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop&auto=format",
  "cocktail":  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop&auto=format",
  "brunch":    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=300&fit=crop&auto=format",
  "breakfast": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=300&fit=crop&auto=format",
  "sunday":    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=300&fit=crop&auto=format",
  "journal":   "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop&auto=format",
  "writer":    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop&auto=format",
  "mindful":   "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop&auto=format",
  "meditat":   "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop&auto=format",
  "ceramic":   "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop&auto=format",
  "pottery":   "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop&auto=format",
  "art":       "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop&auto=format",
  "creative":  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop&auto=format",
  "run":       "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400&h=300&fit=crop&auto=format",
  "outdoor":   "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop&auto=format",
  "hike":      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop&auto=format",
  "wellness":  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&auto=format",
  "photo":     "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&auto=format",
  "fashion":   "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop&auto=format",
  "travel":    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format",
  "music":     "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop&auto=format",
  "cook":      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format",
};

/** Returns a themed image for the circle based on its name, else the db cover_url */
export function resolveCircleImage(name: string, dbUrl: string): string {
  const lower = name.toLowerCase();
  for (const [key, img] of Object.entries(CIRCLE_IMAGE_KEYWORDS)) {
    if (lower.includes(key)) return img;
  }
  return dbUrl;
}
