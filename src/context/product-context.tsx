
'use client';

import type { Product } from '@/lib/products';
import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


type ProductState = {
  products: Product[];
  loading: boolean;
};

type ProductAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: { id: string } }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: ProductState = {
  products: [],
  loading: true,
};

const productReducer = (state: ProductState, action: ProductAction): ProductState => {
  switch (action.type) {
    case 'ADD_PRODUCT': {
       if (state.products.find(p => p.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        products: [action.payload, ...state.products],
      };
    }
     case 'UPDATE_PRODUCT': {
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    }
    case 'DELETE_PRODUCT': {
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload.id),
      };
    }
    case 'SET_PRODUCTS': {
      return { ...state, products: action.payload, loading: false };
    }
    case 'SET_LOADING': {
        return { ...state, loading: action.payload };
    }
    default:
      return state;
  }
};

export type ProductContextType = {
  state: ProductState;
  dispatch: React.Dispatch<ProductAction>;
};

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const productsCol = collection(db, 'products');
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(productsCol, (querySnapshot) => {
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
            products.push(doc.data() as Product);
        });
        dispatch({ type: 'SET_PRODUCTS', payload: products });
    }, (_error) => {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Instead of just logging, we emit a structured error.
        const permissionError = new FirestorePermissionError({
          path: productsCol.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <ProductContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductContext.Provider>
  );
};

    
