
'use client';
import { useContext } from 'react';
import { HomepageContext, type HomepageContextType } from '@/context/homepage-context';

export const useHomepage = (): HomepageContextType => {
  const context = useContext(HomepageContext);
  if (!context) {
    throw new Error('useHomepage must be used within a HomepageProvider');
  }
  return context;
};

export * from '@/context/homepage-context';
