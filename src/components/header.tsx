
'use client';

import Link from 'next/link';
import { Sun, Moon, Wrench, User, LogOut, Heart, ShoppingBag, History } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { useTheme } from '@/context/theme-provider';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-site-settings';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';


const mainNavItems = [
  { href: '/', label: 'Home' },
  { href: '/pre-orders', label: 'Pre-Orders' },
  { href: '/#shop-catalog', label: 'Shop' },
  { href: '/#best-sellers', label: 'Best Sellers' },
  { href: '/search', label: 'Search' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { state: settings } = useSiteSettings();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { state: cartState } = useCart();
  const { state: wishlistState } = useWishlist();
  const [isClient, setIsClient] = useState(false);
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // Set initial hash once
      setActiveHash(window.location.hash);
      
      const handleHashChange = () => {
        setActiveHash(window.location.hash);
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const totalCartItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWishlistItems = wishlistState.items.length;


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3">
           <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-white flex items-center justify-center">
             <Image 
               src={settings.logoUrl || '/logo.jpg'} 
               alt={settings.appName} 
               fill 
               className="object-cover" 
             />
           </div>
           <div className="flex flex-col">
             <span className="font-serif text-lg font-bold tracking-wider leading-none uppercase text-foreground">{settings.appName}</span>
             <span className="text-[10px] font-sans font-medium tracking-widest text-muted-foreground uppercase mt-0.5">Fashion that speaks</span>
           </div>
        </Link>
        
        {/* Navigation Items - Centered */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-widest">
            {mainNavItems.map(item => {
                // Check if path is home page and check hashes separately
                const isItemWithHash = item.href.includes('#');
                let isActive = false;
                
                if (isItemWithHash) {
                  const [path, hash] = item.href.split('#');
                  isActive = pathname === path && activeHash === `#${hash}`;
                } else {
                  // For normal paths, make sure we don't highlight Home ('/') when on a page with hash
                  isActive = item.href === '/' 
                    ? pathname === '/' && !activeHash
                    : pathname === item.href;
                }

                return (
                    <Link 
                      key={item.label} 
                      href={item.href} 
                      className={cn(
                        "transition-colors hover:text-accent font-sans text-xs tracking-widest font-medium py-2 border-b-2 border-transparent hover:border-accent/40", 
                        isActive ? 'text-primary border-primary' : 'text-foreground/75'
                      )}
                    >
                        <span>{item.label}</span>
                    </Link>
                )
            })}
        </nav>
        
        {/* User Actions - Right Aligned */}
        <div className="flex items-center space-x-2">
          
          {/* Search Bar */}
          <SearchBar />

          {/* User Account / Login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                     <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4"/>Profile</Link></DropdownMenuItem>
                 <DropdownMenuItem asChild><Link href="/orders"><History className="mr-2 h-4 w-4"/>Orders</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
             !loading && (
               <Button variant="ghost" size="icon" asChild aria-label="Login">
                 <Link href="/login">
                   <User className="h-5 w-5 text-foreground/80 hover:text-accent transition-colors" />
                 </Link>
               </Button>
             )
           )}

          {/* Wishlist Button */}
          <Button variant="ghost" size="icon" asChild className="relative" aria-label="Wishlist">
            <Link href="/wishlist">
              <Heart className="h-5 w-5 text-foreground/80 hover:text-accent transition-colors" />
              {isClient && totalWishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground animate-scale-in">
                  {totalWishlistItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Cart Button */}
          <Button variant="ghost" size="icon" asChild className="relative" aria-label="Cart">
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5 text-foreground/80 hover:text-accent transition-colors" />
              {isClient && totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground animate-scale-in">
                  {totalCartItems}
                </span>
              )}
            </Link>
          </Button>

          {/* System Admin Wrench */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard" aria-label="Admin Panel">
              <Wrench className="h-5 w-5 text-foreground/60 hover:text-accent transition-colors" />
            </Link>
          </Button>

          {/* Theme Toggler */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground/80" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground/80" />
          </Button>

        </div>
      </div>
    </header>
  );
}
