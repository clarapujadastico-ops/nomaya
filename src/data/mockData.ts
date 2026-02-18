import eventBrunch from "@/assets/event-brunch.jpg";
import eventCeramics from "@/assets/event-ceramics.jpg";
import eventYoga from "@/assets/event-yoga.jpg";
import onboardingHero from "@/assets/onboarding-hero.jpg";

export { onboardingHero };

export const EVENTS = [
  {
    id: "1",
    title: "Sunday Brunch & Conversation",
    date: "Mar 2",
    time: "11:00",
    city: "Barcelona",
    spotsLeft: 3,
    totalSpots: 10,
    category: "Food & Dining",
    image: eventBrunch,
    price: "€28",
    featured: true,
  },
  {
    id: "2",
    title: "Ceramics Circle",
    date: "Mar 8",
    time: "16:00",
    city: "Madrid",
    spotsLeft: 6,
    totalSpots: 12,
    category: "Arts & Crafts",
    image: eventCeramics,
    price: "€45",
    featured: true,
  },
  {
    id: "3",
    title: "Sunrise Yoga in the Garden",
    date: "Mar 15",
    time: "08:00",
    city: "Barcelona",
    spotsLeft: 2,
    totalSpots: 8,
    category: "Wellness",
    image: eventYoga,
    price: "€18",
    featured: false,
  },
  {
    id: "4",
    title: "Founders Coffee Circle",
    date: "Mar 20",
    time: "09:30",
    city: "Madrid",
    spotsLeft: 5,
    totalSpots: 8,
    category: "Entrepreneurship",
    image: eventBrunch,
    price: "Free",
    featured: false,
  },
  {
    id: "5",
    title: "Watercolour Afternoon",
    date: "Mar 22",
    time: "15:00",
    city: "Seville",
    spotsLeft: 4,
    totalSpots: 10,
    category: "Arts & Crafts",
    image: eventCeramics,
    price: "€35",
    featured: false,
  },
];

export const GROUPS = [
  {
    id: "1",
    name: "Ceramics Circle",
    members: 8,
    lastEvent: "Feb 15 · Barcelona",
    nextEvent: "Mar 8 · Madrid",
    image: eventCeramics,
    joined: true,
  },
  {
    id: "2",
    name: "Brunch & Conversation",
    members: 12,
    lastEvent: "Jan 28 · Barcelona",
    nextEvent: "Mar 2 · Barcelona",
    image: eventBrunch,
    joined: true,
  },
  {
    id: "3",
    name: "Wellness Collective",
    members: 6,
    lastEvent: "Feb 20 · Madrid",
    nextEvent: "Mar 15 · Barcelona",
    image: eventYoga,
    joined: false,
  },
];

export const FILTERS = [
  "All",
  "Art & Creativity",
  "Food & Dining",
  "Wellness",
  "Culture",
  "Outdoors",
  "Community",
  "Entrepreneurship",
];

export const INTERESTS = [
  { id: "arts", label: "Arts & crafts", emoji: "🎨" },
  { id: "wellness", label: "Yoga & pilates", emoji: "🧘‍♀️" },
  { id: "food", label: "Food & dining", emoji: "🍽️" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "entrepreneurship", label: "Entrepreneurship", emoji: "💡" },
  { id: "outdoors", label: "Outdoor & movement", emoji: "🌿" },
  { id: "reading", label: "Books & writing", emoji: "📚" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "photography", label: "Photography", emoji: "📷" },
  { id: "cooking", label: "Cooking", emoji: "👩‍🍳" },
  { id: "sustainability", label: "Sustainability", emoji: "🌱" },
];
