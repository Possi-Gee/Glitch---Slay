
'use client';
import { useContext } from 'react';
import { SiteSettingsContext, type SiteSettingsContextType } from '@/context/site-settings-context';
export type { SiteTheme, FooterSettings } from '@/context/site-settings-context';

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
