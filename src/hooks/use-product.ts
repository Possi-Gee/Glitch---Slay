
'use client';
import { useContext } from 'react';
import { ProductContext, type ProductContextType } from '@/context/product-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useProduct = (): ProductContextType & { updateProductRating: (productId: string, newRating: number, newReviewsCount: number) => void } => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }

  const { dispatch } = context;

  const updateProductRating = async (productId: string, newRating: number, newReviewsCount: number) => {
    const productRef = doc(db, 'products', productId);
    try {
        await updateDoc(productRef, {
            rating: newRating,
            reviews: newReviewsCount,
        });
        dispatch({
            type: 'UPDATE_PRODUCT',
            payload: { id: productId, rating: newRating, reviews: newReviewsCount } as any,
        });
    } catch (error) {
        console.error("Failed to update product rating:", error);
    }
  };

  return { ...context, updateProductRating };
};
