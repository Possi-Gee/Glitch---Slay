'use client';

import React, { createContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


export interface Promotion {
  id: number;
  type: 'image' | 'welcome';
  content: string; // URL for image, text for welcome
  alt?: string;
  dataAiHint?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export type HomepageState = {
  callToAction: {
    text: string;
    active: boolean;
  };
  promotions: Promotion[];
  flashSale: {
    endDate: string;
  };
  loading: boolean;
};

type HomepageAction =
  | { type: 'SET_STATE'; payload: Partial<HomepageState> }
  | { type: 'UPDATE_HOMEPAGE'; payload: Partial<Omit<HomepageState, 'loading'>> };


const initialState: HomepageState = {
  callToAction: { text: 'FREE DELIVERY ON ORDERS OVER GHC 500 🚚', active: false },
  promotions: [
    { 
      id: 1, 
      type: 'welcome', 
      content: 'Welcome to Glitch & Slay!', 
      title: 'Welcome to Glitch & Slay!', 
      subtitle: 'Fashion that speaks before you do.',
      buttonText: 'Shop Now',
      buttonLink: '/'
    },
    { id: 2, type: 'image', content: 'https://picsum.photos/1200/400?random=1', alt: 'Promotion 1', dataAiHint: 'sale discount' },
  ],
  flashSale: { endDate: '2024-12-31T23:59' },
  loading: true,
};

const homepageReducer = (state: HomepageState, action: HomepageAction): HomepageState => {
  switch (action.type) {
    case 'UPDATE_HOMEPAGE':
      return { ...state, ...action.payload };
    case 'SET_STATE':
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
};

export type HomepageContextType = {
  state: HomepageState;
  dispatch: React.Dispatch<HomepageAction>;
  updateHomepage: (newHomepage: Partial<Omit<HomepageState, 'loading'>>) => Promise<void>;
};

export const HomepageContext = createContext<HomepageContextType | undefined>(undefined);

export const HomepageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(homepageReducer, initialState);
  

  // Memoize the document reference so it is stable across renders
  const homepageDocRef = useMemo(() => doc(db, 'site', 'homepage'), []);

  const updateHomepage = useCallback(async (newHomepage: Partial<Omit<HomepageState, 'loading'>>) => {
      try {
          await setDoc(homepageDocRef, newHomepage, { merge: true });
      } catch (error) {
          console.error("Failed to update homepage settings:", error);
          throw error;
      }
  }, [homepageDocRef]);

  useEffect(() => {
    const unsubscribe = onSnapshot(homepageDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as Partial<HomepageState>;
            if (data.callToAction?.text !== 'FREE DELIVERY ON ORDERS OVER GHC 500 🚚') {
              updateHomepage({
                callToAction: { text: 'FREE DELIVERY ON ORDERS OVER GHC 500 🚚', active: false },
                promotions: [
                  { 
                    id: 1, 
                    type: 'welcome', 
                    content: 'Welcome to Glitch & Slay!', 
                    title: 'Welcome to Glitch & Slay!', 
                    subtitle: 'Fashion that speaks before you do.',
                    buttonText: 'Shop Now',
                    buttonLink: '/'
                  }
                ]
              }).catch((e) => console.error("Auto homepage migration failed", e));
            }
            dispatch({ type: 'SET_STATE', payload: data });
        } else {
            // If no settings in DB, use initial state and set loading to false
            dispatch({ type: 'SET_STATE', payload: {} });
        }
    }, (_error) => {
        dispatch({ type: 'SET_STATE', payload: {} }); // Stop loading on error
        const permissionError = new FirestorePermissionError({
          path: homepageDocRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [homepageDocRef, updateHomepage]);

  return (
    <HomepageContext.Provider value={{ state, dispatch, updateHomepage }}>
      {children}
    </HomepageContext.Provider>
  );
};
