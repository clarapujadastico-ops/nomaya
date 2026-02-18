export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          city: string
          bio: string | null
          avatar_url: string | null
          language: string
          interests: string[]
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          city?: string
          bio?: string | null
          avatar_url?: string | null
          language?: string
          interests?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          bio?: string | null
          avatar_url?: string | null
          language?: string
          interests?: string[]
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          city: string
          total_spots: number
          price_cents: number
          currency: string
          category_id: string | null
          image_url: string | null
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          date: string
          time: string
          city: string
          total_spots?: number
          price_cents?: number
          currency?: string
          category_id?: string | null
          image_url?: string | null
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          time?: string
          city?: string
          total_spots?: number
          price_cents?: number
          currency?: string
          category_id?: string | null
          image_url?: string | null
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: 'confirmed' | 'cancelled' | 'waitlisted'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: 'confirmed' | 'cancelled' | 'waitlisted'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: 'confirmed' | 'cancelled' | 'waitlisted'
          created_at?: string
        }
      }
    }
    Views: {
      events_with_spots: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          city: string
          total_spots: number
          price_cents: number
          currency: string
          category_id: string | null
          image_url: string | null
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          created_at: string
          spots_left: number
          category_name: string | null
          category_slug: string | null
          category_color: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type EventRow = Database['public']['Views']['events_with_spots']['Row']

/** The shape all UI components use for events */
export interface AppEvent {
  id: string
  title: string
  description: string
  date: string        // formatted "Mar 2"
  time: string        // "11:00"
  city: string
  spotsLeft: number
  totalSpots: number
  category: string    // category name
  categoryColor: string
  image: string       // URL or empty string
  price: string       // "€28" or "Free"
  featured: boolean
  latitude: number | null
  longitude: number | null
}

/** Booking row with nested event data from Supabase joined query */
export interface BookingWithEvent {
  id: string
  event_id: string
  status: 'confirmed' | 'cancelled' | 'waitlisted'
  created_at: string
  event: {
    id: string
    title: string
    date: string
    city: string
    image_url: string | null
    price_cents: number
    currency: string
    category: { name: string; color: string } | null
  } | null
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`
}

function formatPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return 'Free'
  const symbol = currency === 'EUR' ? '€' : currency
  return `${symbol}${Math.round(priceCents / 100)}`
}

export function toAppEvent(row: EventRow): AppEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: formatDate(row.date),
    time: row.time.substring(0, 5),
    city: row.city,
    spotsLeft: row.spots_left ?? row.total_spots,
    totalSpots: row.total_spots,
    category: row.category_name ?? 'General',
    categoryColor: row.category_color ?? 'hsl(252 30% 45%)',
    image: row.image_url ?? '',
    price: formatPrice(row.price_cents, row.currency),
    featured: row.is_featured,
    latitude: row.latitude,
    longitude: row.longitude,
  }
}
