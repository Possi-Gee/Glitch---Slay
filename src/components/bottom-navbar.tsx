
'use client';

import Link from 'next/link';
import { Home, ShoppingCart, User, History } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/orders', label: 'Orders', icon: History },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const { state: cartState } = useCart();
  const { state: wishlistState } = useWishlist();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalCartItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWishlistItems = wishlistState.items.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-around">
        {navItems.map((item) => {
           const isActive = (item.href === '/' && pathname === item.href) || (item.href !== '/' && pathname.startsWith(item.href));
           return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary',
                isActive ? 'text-primary' : ''
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {isClient && item.href === '/cart' && totalCartItems > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {totalCartItems}
                  </span>
                )}
                {isClient && item.href === '/wishlist' && totalWishlistItems > 0 && (
                   <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {totalWishlistItems}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
}
