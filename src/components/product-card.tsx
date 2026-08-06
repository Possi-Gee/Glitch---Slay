
'use client';

import Image from 'next/image';
import { Heart, Star, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Product } from '@/lib/products';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QuickView } from '@/components/quick-view';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch: cartDispatch } = useCart();
  const { dispatch: wishlistDispatch, isWishlisted } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For products with variants, redirect to product page to select one
    if (product.variants.length > 1) {
        router.push(`/product/${product.id}`);
        return;
    }
    const itemToAdd = { product, variant: product.variants[0], quantity: 1 };
    cartDispatch({ type: 'ADD_ITEM', payload: itemToAdd });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted(product.id)) {
      wishlistDispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
      toast({
        title: 'Removed from wishlist',
        description: `${product.name} has been removed from your wishlist.`,
        variant: 'destructive'
      });
    } else {
      wishlistDispatch({ type: 'ADD_ITEM', payload: product });
      toast({
        title: 'Added to wishlist',
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const wishlisted = isWishlisted(product.id);
  
  const productVariants = product.variants || [];

  let highestPriceVariant = null;
  if (productVariants.length > 0) {
    highestPriceVariant = productVariants.reduce((max, v) => v.price > max.price ? v : max, productVariants[0]);
  }

  const displayPrice = highestPriceVariant ? highestPriceVariant.price : null;
  const originalPrice = highestPriceVariant ? highestPriceVariant.originalPrice : null;
  
  const discount = (originalPrice && displayPrice && originalPrice > displayPrice)
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const productImage = (product.images && product.images.length > 0) ? product.images[0] : 'https://picsum.photos/600/600';


  return (
     <Link href={`/product/${product.id}`} className="group block h-full">
        <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
          <CardHeader className="p-0 relative group/image">
            <div className="relative aspect-square w-full">
              <Image
                src={productImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={product.dataAiHint}
              />
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover/image:opacity-100"
              >
                <span className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-none shadow-lg">
                  Quick View
                </span>
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleToggleWishlist} className="absolute bottom-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8">
                <Heart className={cn('h-5 w-5', wishlisted ? 'text-red-500 fill-current' : '')} />
            </Button>
            {product.isPreOrder && (
                <Badge variant="secondary" className="absolute top-2 left-2 z-10">Pre-Order</Badge>
            )}
            {discount > 0 && (
                <Badge variant="default" className="absolute top-0 right-0 rounded-none rounded-bl-md">-{discount}%</Badge>
            )}
          </CardHeader>
           <QuickView product={product} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
          <CardContent className="flex flex-col flex-grow p-3">
             {product.isOfficialStore && <Badge className="bg-cyan-600 hover:bg-cyan-700 w-fit mb-2">Official Store</Badge>}
             {product.vendor?.verified && (
               <Badge className="bg-green-600 hover:bg-green-700 w-fit mb-2 flex items-center gap-1">
                 <CheckCircle className="h-3 w-3" /> {product.vendor.storeName || 'Verified Vendor'}
               </Badge>
             )}
            <p className="text-sm font-medium leading-tight flex-grow">{product.name}</p>
            {displayPrice !== null && (
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <p className="text-lg font-bold text-foreground">
                    GH₵{displayPrice.toFixed(2)}
                  </p>
                  {originalPrice && originalPrice > 0 && (
                      <p className="text-sm text-muted-foreground line-through">GH₵{originalPrice.toFixed(2)}</p>
                  )}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>
             <Button size="sm" onClick={product.isPreOrder ? () => router.push(`/product/${product.id}`) : handleAddToCart} className="w-full mt-4">
                 {product.isPreOrder ? (
                    <> <Package className="mr-2 h-4 w-4" /> Pre-Order Now </>
                 ) : (
                    <> <ShoppingCart className="mr-2 h-4 w-4" /> {productVariants.length > 1 ? 'Select Options' : 'Add to Cart'} </>
                 )}
             </Button>
          </CardContent>
        </Card>
    </Link>
  );
}
