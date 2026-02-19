import { resolveEventImage } from '@/assets/eventImages'

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
          birthday: string | null
          horoscope: string | null
          instagram_url: string | null
          linkedin_url: string | null
          tiktok_url: string | null
          verification_status: 'unverified' | 'pending' | 'verified'
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
          birthday?: string | null
          horoscope?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          tiktok_url?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified'
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
          birthday?: string | null
          horoscope?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          tiktok_url?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified'
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
          is_tbc: boolean
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
          is_tbc?: boolean
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
          is_tbc?: boolean
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
      circles: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string | null
          cover_url: string | null
          city: string
          is_private: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          category_id?: string | null
          cover_url?: string | null
          city?: string
          is_private?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category_id?: string | null
          cover_url?: string | null
          city?: string
          is_private?: boolean
          created_by?: string
          created_at?: string
        }
      }
      device_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          platform?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          platform?: string
          created_at?: string
        }
      }
      circle_memberships: {
        Row: {
          id: string
          circle_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          circle_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          circle_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      circle_messages: {
        Row: {
          id: string
          circle_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          circle_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          circle_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      circles_with_members: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string | null
          cover_url: string | null
          city: string
          is_private: boolean
          created_by: string
          created_at: string
          member_count: number
          category_name: string | null
          category_slug: string | null
          category_color: string | null
        }
      }
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
          is_tbc: boolean
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
export type CircleRow = Database['public']['Views']['circles_with_members']['Row']

/** The shape UI components use for circles */
export interface AppCircle {
  id: string
  name: string
  description: string
  city: string
  coverUrl: string
  isPrivate: boolean
  createdBy: string
  memberCount: number
  category: string
  categoryColor: string
  isMember: boolean
  isAdmin: boolean
}

/** Membership row with nested circle data */
export interface MembershipWithCircle {
  id: string
  circle_id: string
  role: 'admin' | 'member'
  joined_at: string
  circle: {
    id: string
    name: string
    description: string
    city: string
    cover_url: string | null
    is_private: boolean
    category: { name: string; color: string } | null
  } | null
}

export function toAppCircle(row: CircleRow, userId: string, membershipRole: 'admin' | 'member' | null): AppCircle {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    city: row.city,
    coverUrl: row.cover_url ?? '',
    isPrivate: row.is_private,
    createdBy: row.created_by,
    memberCount: row.member_count,
    category: row.category_name ?? 'General',
    categoryColor: row.category_color ?? 'hsl(252 30% 45%)',
    isMember: membershipRole !== null,
    isAdmin: membershipRole === 'admin',
  }
}

/** The shape all UI components use for events */
export interface AppEvent {
  id: string
  title: string
  description: string
  date: string        // formatted "Mar 2"
  rawDate: string     // ISO "2026-02-22" for filtering
  time: string        // "11:00"
  city: string
  spotsLeft: number
  totalSpots: number
  category: string    // category name
  categoryColor: string
  image: string       // URL or empty string
  price: string       // "€28" or "Free"
  featured: boolean
  isTbc: boolean
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
    rawDate: row.date,
    time: row.time.substring(0, 5),
    city: row.city,
    spotsLeft: row.spots_left ?? row.total_spots,
    totalSpots: row.total_spots,
    category: row.category_name ?? 'General',
    categoryColor: row.category_color ?? 'hsl(252 30% 45%)',
    image: resolveEventImage(row.title, row.image_url ?? ''),
    price: formatPrice(row.price_cents, row.currency),
    featured: row.is_featured,
    isTbc: row.is_tbc ?? false,
    latitude: row.latitude,
    longitude: row.longitude,
  }
}
