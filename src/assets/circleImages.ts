import bookImg   from "./circle-book.jpg";
import foodieImg  from "./circle-foodie.png";
import yogaImg    from "./circle-yoga.webp";

const LOCAL_CIRCLE_IMAGES: Record<string, string> = {
  "book":   bookImg,
  "foodie": foodieImg,
  "yoga":   yogaImg,
};

/** Returns a local asset for well-known circles, else the db cover_url, else undefined */
export function resolveCircleImage(name: string, dbUrl: string): string {
  const lower = name.toLowerCase();
  for (const [key, img] of Object.entries(LOCAL_CIRCLE_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  return dbUrl;
}
