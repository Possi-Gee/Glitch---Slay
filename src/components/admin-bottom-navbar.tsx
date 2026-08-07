
'use client';

import Link from 'next/link';
import { Home, Package, Settings, ShoppingCart, LayoutDashboard, Users, RotateCw, FileText, ClipboardList, Tag, MessageSquare, Store, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminBottomNavbarProps {
  adminRole: 'admin' | 'superadmin';
}

const primaryNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/pre-orders', label: 'Pre-Orders', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const moreNavItems = [
  { href: '/admin/products/import', label: 'Import/Export', icon: FileText },
  { href: '/admin/products/bulk', label: 'Bulk Editor', icon: Package },
  { href: '/admin/homepage-editor', label: 'Homepage', icon: Home },
  { href: '/admin/vendors', label: 'Vendors', icon: Store },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/refunds', label: 'Refunds', icon: RotateCw },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/', label: 'Back to Shop', icon: Home },
];

export function AdminBottomNavbar({ adminRole: _adminRole }: AdminBottomNavbarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href;
    if (href === '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <span className="text-base font-bold tracking-wide">All Admin Pages</span>
            <button onClick={() => setMoreOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col p-4 space-y-1 overflow-y-auto">
            {[...primaryNavItems, ...moreNavItems].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid h-16 max-w-screen-2xl mx-auto items-center px-2"
          style={{ gridTemplateColumns: `repeat(${primaryNavItems.length + 1}, minmax(0, 1fr))` }}
        >
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-primary px-1',
                isActive(item.href) ? 'text-primary' : ''
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          ))}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation options"
            className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-primary px-1"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
