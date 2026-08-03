'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/products';
import Link from 'next/link';

interface QuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickView({ product, open, onOpenChange }: QuickViewProps) {
  const { dispatch: cartDispatch } = useCart();
  const { dispatch: wishlistDispatch, isWishlisted } = useWishlist();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.find(v => v.name === 'Standard' || v.name === 'Single') || product.variants[0]
  );

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    if (selectedVariant.stock === 0) {
      toast({ title: 'Out of Stock', description: 'This variant is currently out of stock.', variant: 'destructive' });
      return;
    }
    cartDispatch({ type: 'ADD_ITEM', payload: { product, variant: selectedVariant, quantity: 1 } });
    toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.` });
    onOpenChange(false);
  };

  const handleToggleWishlist = () => {
    if (wishlisted) {
      wishlistDispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
    } else {
      wishlistDispatch({ type: 'ADD_ITEM', payload: product });
    }
    toast({
      title: wishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: `${product.name} has been ${wishlisted ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  const discount = selectedVariant?.originalPrice && selectedVariant.originalPrice > selectedVariant.price
    ? Math.round(((selectedVariant.originalPrice - selectedVariant.price) / selectedVariant.originalPrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 z-10 p-1 bg-background/80 rounded-full hover:bg-background transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square">
            <Image
              src={product.images[0] || 'https://picsum.photos/600/600'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader className="p-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
              <DialogTitle className="text-xl mt-1">{product.name}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold">GH₵{(selectedVariant?.price || 0).toFixed(2)}</span>
              {selectedVariant?.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
                <>
                  <span className="text-sm text-muted-foreground line-through">GH₵{selectedVariant.originalPrice.toFixed(2)}</span>
                  <Badge variant="destructive" className="text-xs">-{discount}%</Badge>
                </>
              )}
            </div>

            {product.variants.length > 1 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2">Select Variant:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "px-3 py-1.5 text-xs border transition-colors",
                        selectedVariant?.id === v.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {v.name} — GH₵{v.price.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{product.description}</p>

            <div className="mt-auto pt-4 flex items-center gap-2">
              <Button size="sm" className="flex-1" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock === 0}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleToggleWishlist}>
                <Heart className={cn('h-4 w-4', wishlisted ? 'text-red-500 fill-current' : '')} />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/product/${product.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
