
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/products';

export default function WishlistPage() {
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  const { dispatch: cartDispatch } = useCart();
  const { items } = wishlistState;
  const { toast } = useToast();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Heart className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-semibold">Your Wishlist is Empty</h1>
        <p className="mt-2 text-muted-foreground">Add your favorite items to your wishlist to see them here.</p>
        <Button asChild className="mt-6">
          <Link href="/">Discover Products</Link>
        </Button>
      </div>
    );
  }

  const handleRemoveFromWishlist = (id: string, name: string) => {
    wishlistDispatch({ type: 'REMOVE_ITEM', payload: { id } });
    toast({
      title: 'Removed from wishlist',
      description: `${name} has been removed from your wishlist.`,
      variant: 'destructive',
    });
  };

  const handleMoveToCart = (product: Product) => {
    if (product.variants.length > 1) {
        router.push(`/product/${product.id}`);
        return;
    }
    const itemToAdd = { product, variant: product.variants[0], quantity: 1 };
    cartDispatch({ type: 'ADD_ITEM', payload: itemToAdd });
    wishlistDispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
    toast({
      title: 'Moved to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(product => (
          <Card key={product.id} className="flex h-full flex-col overflow-hidden">
             <Link href={`/product/${product.id}`} className="block h-full flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-square w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    data-ai-hint={product.dataAiHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <CardTitle className="mt-1 text-base font-semibold leading-tight">{product.name}</CardTitle>
                 <p className="text-lg font-bold text-primary mt-2">
                    GH₵{Math.min(...product.variants.map(v => v.price)).toFixed(2)}
                </p>
              </CardContent>
            </Link>
            <CardFooter className="flex flex-col items-stretch gap-2 p-4 pt-0">
               <Button onClick={() => handleMoveToCart(product)}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Move to Cart
              </Button>
              <Button variant="outline" onClick={() => handleRemoveFromWishlist(product.id, product.name)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
