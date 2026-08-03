
'use client';

import type { Product } from '@/lib/products';
import React, { createContext, useReducer, useEffect, useRef, type ReactNode, useState } from 'react';

type WishlistState = {
  items: Product[];
};

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'SET_STATE'; payload: WishlistState };

const initialState: WishlistState = {
  items: [],
};

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    }
    case 'SET_STATE': {
      return action.payload;
    }
    default:
      return state;
  }
};

export type WishlistContextType = {
  state: WishlistState;
  dispatch: React.Dispatch<WishlistAction>;
  isWishlisted: (id: string) => boolean;
};

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem('jaytel_wishlist');
      if (storedWishlist) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(storedWishlist) });
      }
    } catch (error) {
      console.error("Failed to load wishlist from localStorage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('jaytel_wishlist', JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save wishlist to localStorage", error);
      }
    }, 500);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [state, isHydrated]);

  const isWishlisted = (id: string) => state.items.some(item => item.id === id);

  return (
    <WishlistContext.Provider value={{ state, dispatch, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};
