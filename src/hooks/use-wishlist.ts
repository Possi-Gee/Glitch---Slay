'use client';
import { useContext } from 'react';
import { WishlistContext, type WishlistContextType } from '@/context/wishlist-context';

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
