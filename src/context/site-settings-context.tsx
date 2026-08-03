
'use client';

import React, { createContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


export type Link = { id: number; label: string; url: string };
export type FooterColumn = { id: number; title: string; links: Link[] };

export type SiteTheme = {
  background: string;
  foreground: string;
  primary: string;
  'primary-foreground': string;
  accent: string;
  'accent-foreground': string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  border: string;
  input: string;
  ring: string;
};

export type FooterSettings = {
  columns: FooterColumn[];
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
};


export type SiteSettingsState = {
  appName: string;
  logoUrl: string;
  fromEmail: string;
  adminEmail: string;
  adminPhone: string;
  taxRate: number;
  shippingFee: number;
  theme: SiteTheme;
  footer: FooterSettings;
  loading: boolean;
};

type SiteSettingsAction =
  | { type: 'SET_STATE'; payload: Partial<SiteSettingsState> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Omit<SiteSettingsState, 'loading'>> };


const initialState: SiteSettingsState = {
  appName: 'Glitch & Slay',
  logoUrl: '/logo.jpg',
  fromEmail: 'onboarding@resend.dev',
  adminEmail: 'hello@glitchandslay.com',
  adminPhone: '+233 59 123 4567',
  taxRate: 8,
  shippingFee: 5,
  theme: {
    background: '0 0% 100%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    'card-foreground': '0 0% 10%',
    popover: '0 0% 100%',
    'popover-foreground': '0 0% 10%',
    primary: '0 0% 0%',
    'primary-foreground': '0 0% 98%',
    accent: '23 39% 64%',
    'accent-foreground': '0 0% 98%',
    border: '0 0% 90%',
    input: '0 0% 90%',
    ring: '23 39% 64%',
  },
  footer: {
    columns: [
      {
        id: 2,
        title: 'Support',
        links: [
          { id: 1, label: 'Contact Us', url: '/contact' },
          { id: 2, label: 'FAQ', url: '/faq' },
          { id: 3, label: 'Shipping & Returns', url: '/shipping-returns' },
          { id: 4, label: 'Track Order', url: '/orders' },
        ],
      },
       {
        id: 3,
        title: 'Company',
        links: [
          { id: 1, label: 'About Us', url: '/about' },
          { id: 2, label: 'Careers', url: '/careers' },
          { id: 3, label: 'Press', url: '/press' },
          { id: 4, label: 'Terms of Service', url: '/terms-of-service' },
        ],
      },
    ],
    socialLinks: {
        twitter: '#',
        facebook: '#',
        instagram: '#'
    }
  },
  loading: true,
};

const settingsReducer = (state: SiteSettingsState, action: SiteSettingsAction): SiteSettingsState => {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
       return { ...state, ...action.payload };
    case 'SET_STATE':
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
};

export type SiteSettingsContextType = {
  state: SiteSettingsState;
  dispatch: React.Dispatch<SiteSettingsAction>;
  updateSettings: (newSettings: Partial<Omit<SiteSettingsState, 'loading'>>) => Promise<void>;
};

export const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  
  // Memoize the document reference so it is stable across renders
  const settingsDocRef = useMemo(() => doc(db, 'site', 'settings'), []);

  const updateSettings = useCallback(async (newSettings: Partial<Omit<SiteSettingsState, 'loading'>>) => {
      try {
          await setDoc(settingsDocRef, newSettings, { merge: true });
          // The onSnapshot listener will automatically update the state,
          // so we don't need to dispatch here.
      } catch (error) {
          console.error("Failed to update site settings:", error);
          // Optionally re-throw or handle the error in the UI
          throw error;
      }
  }, [settingsDocRef]);

  useEffect(() => {
    const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as Partial<SiteSettingsState>;
            if (data.appName !== 'Glitch & Slay') {
              const migratedTheme = {
                background: '0 0% 100%',
                foreground: '0 0% 10%',
                card: '0 0% 100%',
                'card-foreground': '0 0% 10%',
                popover: '0 0% 100%',
                'popover-foreground': '0 0% 10%',
                primary: '0 0% 0%',
                'primary-foreground': '0 0% 98%',
                accent: '23 39% 64%',
                'accent-foreground': '0 0% 98%',
                border: '0 0% 90%',
                input: '0 0% 90%',
                ring: '23 39% 64%',
              };
              updateSettings({
                appName: 'Glitch & Slay',
                logoUrl: '/logo.jpg',
                adminEmail: 'hello@glitchandslay.com',
                adminPhone: '+233 59 123 4567',
                theme: migratedTheme,
              }).catch((e) => console.error("Auto settings migration failed", e));
            }
            dispatch({ type: 'SET_STATE', payload: data });
        } else {
            // If no settings in DB, use initial state and set loading to false
            dispatch({ type: 'SET_STATE', payload: {} });
        }
    }, (_error) => {
        dispatch({ type: 'SET_STATE', payload: {} }); // Stop loading on error
        const permissionError = new FirestorePermissionError({
          path: settingsDocRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [settingsDocRef, updateSettings]);


  return (
    <SiteSettingsContext.Provider value={{ state, dispatch, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
