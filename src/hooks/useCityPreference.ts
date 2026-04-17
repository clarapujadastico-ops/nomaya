import { useState, useEffect } from 'react';

const SUPPORTED_CITIES = ['Madrid', 'Barcelona'] as const;
export type SupportedCity = typeof SUPPORTED_CITIES[number];

const STORAGE_KEY = 'nomaya_selected_city';

/** Persists the user's chosen city across sessions. Defaults to Madrid. */
export function useCityPreference(profileCity?: string | null) {
  const [city, setCity] = useState<SupportedCity>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_CITIES.includes(stored as SupportedCity)) {
      return stored as SupportedCity;
    }
    // Default to profile city if it's a supported city, else Madrid
    if (profileCity && SUPPORTED_CITIES.includes(profileCity as SupportedCity)) {
      return profileCity as SupportedCity;
    }
    return 'Madrid';
  });

  // Sync profile city on first load if nothing stored
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored && profileCity && SUPPORTED_CITIES.includes(profileCity as SupportedCity)) {
      setCity(profileCity as SupportedCity);
    }
  }, [profileCity]);

  function selectCity(c: SupportedCity) {
    localStorage.setItem(STORAGE_KEY, c);
    setCity(c);
  }

  return { city, selectCity, cities: SUPPORTED_CITIES };
}
