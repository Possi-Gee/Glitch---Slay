
'use client';

import { useMemo } from 'react';
import { useProduct } from '@/hooks/use-product';
import { ProductCard } from '@/components/product-card';
import { Zap, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SalesPage() {
  const { state: productState } = useProduct();
  const { products } = productState;

  const saleProducts = useMemo(() => {
    return products.filter(product => 
      product.variants.some(variant => variant.originalPrice && variant.originalPrice > variant.price)
    );
  }, [products]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <Zap className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-5xl mt-4">Flash Sale</h1>
        <p className="mt-4 text-lg text-muted-foreground">Don't miss out on these amazing deals!</p>
      </header>

      {saleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {saleProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center col-span-full py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Sale Items Right Now</h2>
            <p className="mt-2 text-muted-foreground">Check back later for more deals.</p>
            <Button asChild className="mt-6">
                <Link href="/">Continue Shopping</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
