
'use client';

import type { Product, ProductVariant } from '@/lib/products';
import React, { createContext, useReducer, useEffect, useState, useRef, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  variant: ProductVariant;
}

type CartState = {
  items: CartItem[];
};

type AddItemPayload = {
    product: Omit<Product, 'variants' | 'images'> & {images: string[]},
    variant: ProductVariant,
    quantity?: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: AddItemPayload }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: CartState = {
  items: [],
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, variant, quantity = 1 } = action.payload;
      const cartItemId = `${product.id}_${variant.id}`;
      const existingItem = state.items.find(item => item.id === cartItemId);
      const newQty = existingItem ? existingItem.quantity + quantity : quantity;

      if (newQty > variant.stock) {
        return state;
      }
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === cartItemId
              ? { ...item, quantity: newQty }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { 
            id: cartItemId,
            productId: product.id,
            name: product.name,
            image: product.images[0],
            quantity,
            variant
        }],
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        }
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART': {
      return { ...state, items: [] };
    }
    case 'SET_STATE': {
      return action.payload;
    }
    case 'SET_ERROR': {
      return state;
    }
    default:
      return state;
  }
};

export type CartContextType = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('jaytel_cart');
      if (storedCart) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(storedCart) });
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
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
        localStorage.setItem('jaytel_cart', JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }, 500);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [state, isHydrated]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};
