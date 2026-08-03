'use client';

import { useSiteSettings } from '@/hooks/use-site-settings';
import { MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.76 4.05 1.08.97 2.44 1.43 3.8 1.51v3.76c-1.7-.04-3.37-.56-4.78-1.56-.05 2.82-.04 5.64-.05 8.46-.02 1.63-.44 3.29-1.33 4.67-1.42 2.24-4.01 3.63-6.68 3.59-2.31-.02-4.57-1.11-5.83-3.05-1.57-2.32-1.74-5.59-.44-8.08 1.13-2.22 3.5-3.73 6.03-3.8v3.77c-1.39-.02-2.82.51-3.66 1.66-.86 1.17-.92 2.79-.17 3.99.71 1.19 2.13 1.95 3.53 1.83 1.48-.06 2.85-1.12 3.12-2.58.18-.89.1-1.81.11-2.73-.01-5.18-.01-10.36-.02-15.54z" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function Footer() {
  const { state: settings } = useSiteSettings();

  return (
    <footer className="bg-muted/30 border-t border-border/40 text-foreground pt-16">
      <div className="container mx-auto px-4 sm:px-8 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          
          {/* Logo & Slogan Column */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-3">
               <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-white flex items-center justify-center">
                 <Image 
                   src={settings.logoUrl || '/logo.jpg'} 
                   alt={settings.appName} 
                   fill 
                   className="object-cover" 
                 />
               </div>
               <span className="font-serif text-xl font-bold tracking-wider uppercase text-foreground">{settings.appName}</span>
            </Link>
            <p className="text-xs tracking-widest text-muted-foreground uppercase leading-relaxed max-w-[200px]">
              Fashion that speaks before you do.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground">Quick Links</h4>
            <ul className="flex flex-col space-y-2.5 text-xs text-muted-foreground">
              <li><Link href="/#shop-catalog" className="hover:text-accent transition-colors font-medium">Shop</Link></li>
              <li><Link href="/#best-sellers" className="hover:text-accent transition-colors font-medium">Best Sellers</Link></li>
              <li><Link href="/#best-sellers" className="hover:text-accent transition-colors font-medium">Best Sellers</Link></li>
              <li><Link href="/blog" className="hover:text-accent transition-colors font-medium">Blog</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors font-medium">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors font-medium">Contact</Link></li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground">Customer Service</h4>
            <ul className="flex flex-col space-y-2.5 text-xs text-muted-foreground">
              <li><Link href="/faq" className="hover:text-accent transition-colors font-medium">FAQs</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-accent transition-colors font-medium">Shipping & Delivery</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-accent transition-colors font-medium">Returns & Exchanges</Link></li>
              <li><Link href="/size-guide" className="hover:text-accent transition-colors font-medium">Size Guide</Link></li>
              <li><Link href="/orders" className="hover:text-accent transition-colors font-medium">Track Order</Link></li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground">Contact Us</h4>
            <ul className="flex flex-col space-y-3 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent/80" />
                <span className="font-medium">Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent/80" />
                <a href="tel:+233591234567" className="hover:text-accent transition-colors font-medium">+233 59 123 4567</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent/80" />
                <a href="mailto:hello@glitchandslay.com" className="hover:text-accent transition-colors font-medium">hello@glitchandslay.com</a>
              </li>
            </ul>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-4 pt-2">
              <span className="text-muted-foreground cursor-default" aria-label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </span>
              <span className="text-muted-foreground cursor-default" aria-label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </span>
              <span className="text-muted-foreground cursor-default" aria-label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Bottom Strip - Black */}
      <div className="bg-black text-[#8A8A8A] border-t border-[#1C1C1C] py-4 text-xs font-sans">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="tracking-wide">&copy; {new Date().getFullYear()} {settings.appName}. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors tracking-wide">Privacy Policy</Link>
            <span className="text-[#333333]">|</span>
            <Link href="/terms-of-service" className="hover:text-white transition-colors tracking-wide">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
