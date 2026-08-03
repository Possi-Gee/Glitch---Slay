
'use client';

import { ThemeProvider } from '@/context/theme-provider';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { ProductProvider } from '@/context/product-context';
import { HomepageProvider } from '@/context/homepage-context';
import { SiteSettingsProvider } from '@/context/site-settings-context';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { useEffect } from 'react';
import { OrderProvider } from '@/context/order-context';
import { AuthProvider } from '@/context/auth-context';
import { useTheme } from '@/context/theme-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ErrorBoundary } from '@/components/error-boundary';

function AppThemeController({ children }: { children: React.ReactNode }) {
  const { state: settings } = useSiteSettings();
  const { theme } = useTheme();

  useEffect(() => {
    document.title = settings.appName;
    const root = document.documentElement;

    if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
       (Object.keys(settings.theme) as Array<keyof typeof settings.theme>).forEach((key) => {
        const value = settings.theme[key];
        root.style.setProperty(`--${key}`, value);
      });
    } else {
       (Object.keys(settings.theme) as Array<keyof typeof settings.theme>).forEach((key) => {
          root.style.removeProperty(`--${key}`);
       });
    }
  }, [settings, theme]);
  
  return <>{children}</>;
}


function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
       <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppThemeController>
          <AuthProvider>
              <ProductProvider>
                <WishlistProvider>
                  <CartProvider>
                    <OrderProvider>
                       <HomepageProvider>
                        {children}
                        <Toaster />
                        <FirebaseErrorListener />
                      </HomepageProvider>
                    </OrderProvider>
                  </CartProvider>
                </WishlistProvider>
              </ProductProvider>
            </AuthProvider>
        </AppThemeController>
       </ThemeProvider>
    </SiteSettingsProvider>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Glitch &amp; Slay — Fashion that speaks before you do.</title>
        <meta name="description" content="Glitch & Slay - Premium fashion store. Discover our curated collection of clothing, bags, accessories, and footwear. Fashion that speaks before you do." />
        <meta name="keywords" content="fashion, clothing, bags, accessories, footwear, online store, premium fashion" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#000000" />
        <meta property="og:title" content="Glitch &amp; Slay — Fashion that speaks before you do." />
        <meta property="og:description" content="Premium fashion store. Discover our curated collection of clothing, bags, accessories, and footwear." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/hero-model.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Glitch &amp; Slay" />
        <meta name="twitter:description" content="Premium fashion store. Fashion that speaks before you do." />
        <meta name="twitter:image" content="/hero-model.png" />
        <meta name="application-name" content="Glitch & Slay" />
        <link rel="canonical" href="https://glitchandslay.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Glitch & Slay" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ErrorBoundary>
          <AppProviders>
            {children}
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
