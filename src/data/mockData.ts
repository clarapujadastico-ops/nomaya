export const INTERESTS = [
  { id: "arts", labelKey: "interest.arts", emoji: "🎨", color: "hsl(280 38% 55%)" },
  { id: "wellness", labelKey: "interest.wellness", emoji: "🧘‍♀️", color: "hsl(140 35% 45%)" },
  { id: "food", labelKey: "interest.food", emoji: "🍽️", color: "hsl(15 60% 55%)" },
  { id: "culture", labelKey: "interest.culture", emoji: "🎭", color: "hsl(340 50% 55%)" },
  { id: "entrepreneurship", labelKey: "interest.entrepreneurship", emoji: "💡", color: "hsl(200 50% 45%)" },
  { id: "outdoors", labelKey: "interest.outdoors", emoji: "🌿", color: "hsl(120 30% 40%)" },
  { id: "reading", labelKey: "interest.reading", emoji: "📚", color: "hsl(38 62% 52%)" },
  { id: "music", labelKey: "interest.music", emoji: "🎵", color: "hsl(252 45% 55%)" },
  { id: "travel", labelKey: "interest.travel", emoji: "✈️", color: "hsl(204 44% 48%)" },
  { id: "photography", labelKey: "interest.photography", emoji: "📷", color: "hsl(25 55% 48%)" },
  { id: "cooking", labelKey: "interest.cooking", emoji: "👩‍🍳", color: "hsl(10 65% 52%)" },
  { id: "sustainability", labelKey: "interest.sustainability", emoji: "🌱", color: "hsl(145 40% 40%)" },
  { id: "ceramics", labelKey: "interest.ceramics", emoji: "🏺", color: "hsl(30 50% 48%)" },
  { id: "fashion", labelKey: "interest.fashion", emoji: "👗", color: "hsl(347 86% 60%)" },
  { id: "mindfulness", labelKey: "interest.mindfulness", emoji: "🕯️", color: "hsl(270 30% 52%)" },
  { id: "wine", labelKey: "interest.wine", emoji: "🍷", color: "hsl(350 45% 48%)" },
];

// Event category display name (as stored in the categories table) →
// translation key. Shared by EventsScreen (category filter tabs) and
// EventCard (badge on every event card) so both translate consistently.
export const CATEGORY_KEYS: Record<string, string> = {
  "Wellness": "cat.wellness",
  "Creative": "cat.creative",
  "Social": "cat.social",
  "Professional": "cat.professional",
  "Foodie": "cat.foodie",
  "Cultural": "cat.cultural",
  "Trips": "cat.trips",
};

// Shared with OnboardingFlow (selection) and MemberProfileSheet (display) so
// both always agree on which ids exist and how to translate/label them.
export const LIFE_STAGES = [
  { id: "student", labelKey: "onboarding.ls_student", emoji: "🎓" },
  { id: "working_professional", labelKey: "onboarding.ls_working", emoji: "💼" },
  { id: "founder", labelKey: "onboarding.ls_founder", emoji: "🚀" },
  { id: "freelancer", labelKey: "onboarding.ls_freelancer", emoji: "✨" },
  { id: "new_in_city", labelKey: "onboarding.ls_new_city", emoji: "📍" },
  { id: "parent", labelKey: "onboarding.ls_parent", emoji: "🌸" },
];
