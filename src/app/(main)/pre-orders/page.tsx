'use client';

import { useMemo } from 'react';
import { useProduct } from '@/hooks/use-product';
import { ProductCard } from '@/components/product-card';
import { ShoppingBag } from 'lucide-react';
import { MOCKUP_BEST_SELLERS } from '@/lib/mock-products';

export default function PreOrdersPage() {
  const { state: productState } = useProduct();
  const { products, loading } = productState;

  const preOrderProducts = useMemo(() => {
    const allProducts = [...products, ...MOCKUP_BEST_SELLERS];
    // Filter by unique ID to avoid duplicates and check isPreOrder flag
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
    return uniqueProducts.filter(p => p.isPreOrder);
  }, [products]);

  return (
    <div className="container mx-auto px-4 sm:px-8 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Coming Soon: Pre-Orders</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Reserve our upcoming arrivals before they sell out. Secure your items now and be the first to receive them.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse" />
            ))}
        </div>
      ) : preOrderProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {preOrderProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-lg">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
          <h3 className="text-xl font-semibold">No active pre-orders</h3>
          <p className="text-muted-foreground mt-2">Check back soon for new exciting product releases!</p>
        </div>
      )}
    </div>
  );
}
