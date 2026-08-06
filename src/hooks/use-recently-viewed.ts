'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'jaytel_recently_viewed';
const MAX_ITEMS = 10;

export type RecentlyViewedItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
};

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      console.error('Failed to load recently viewed');
    }
  }, []);

  const addItem = useCallback((item: RecentlyViewedItem) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        console.error('Failed to save recently viewed');
      }
      return updated;
    });
  }, []);

  return { items, addItem };
};
