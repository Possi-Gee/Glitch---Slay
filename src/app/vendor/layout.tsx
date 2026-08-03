'use client';

import { useVendorSession } from '@/hooks/use-vendor-session';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Package } from 'lucide-react';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { vendor, loading, isVendor } = useVendorSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isVendor) {
      router.push('/login');
    }
  }, [loading, isVendor, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isVendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-white border-r border-border p-6 hidden md:block">
          <div className="mb-8">
            <Link href="/vendor/orders" className="text-xl font-bold tracking-tight">
              {vendor?.storeName || 'Vendor'}
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Vendor Dashboard</p>
          </div>
          <nav className="space-y-2">
            <Link
              href="/vendor/orders"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent"
            >
              <Package className="h-4 w-4" />
              Orders
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
