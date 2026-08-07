
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useProduct } from '@/hooks/use-product';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Minus, Plus, Star, Package, Share2, Bell } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { PreOrderButton } from '@/components/pre-order-button';
import { CountdownTimer } from '@/components/countdown-timer';
import type { ProductVariant } from '@/lib/products';
import { products as staticProducts } from '@/lib/products';
import { MOCKUP_BEST_SELLERS } from '@/lib/mock-products';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { ProductReviews } from '@/components/product-reviews';
import { Badge } from '@/components/ui/badge';

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  const { state: productState } = useProduct();
  const { products } = productState;

  const { dispatch: cartDispatch } = useCart();
  const { dispatch: wishlistDispatch, isWishlisted } = useWishlist();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  const { toast } = useToast();

  const product = products.find(p => p.id.toString() === id)
    ?? staticProducts.find(p => p.id.toString() === id)
    ?? MOCKUP_BEST_SELLERS.find(p => p.id.toString() === id);

  useEffect(() => {
    if (product) {
      addRecentlyViewed({
        id: product.id,
        name: product.name,
        image: product.images[0] || '',
        price: product.variants[0]?.price || 0,
        category: product.category,
      });
    }
  }, [product, addRecentlyViewed]);

  const [selectedImage, setSelectedImage] = useState(
    product?.images && product.images.length > 0 ? product.images[0] : undefined
  );

  const getDefaultVariant = () => {
    if (!product) return undefined;
    const singleVariant = product.variants.find(v => v.name.toLowerCase() === 'single' || v.name.toLowerCase() === 'standard' || v.name.toLowerCase() === 'single bottle');
    return singleVariant || product.variants[0];
  }

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(getDefaultVariant());
  const [quantity, setQuantity] = useState(1);
  const [backInStockEmail, setBackInStockEmail] = useState('');
  const [backInStockSent, setBackInStockSent] = useState(false);

  const relatedProducts = product
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground mt-2">The product you are looking for does not exist.</p>
         <Button asChild className="mt-6">
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (!selectedVariant) {
        toast({
            title: 'Please select an option',
            description: 'You must select a variant before adding to cart.',
            variant: 'destructive',
        });
        return;
    }
    if (quantity <= 0 || isNaN(quantity)) {
       toast({
            title: 'Invalid quantity',
            description: 'Please enter a quantity greater than zero.',
            variant: 'destructive',
        });
        return;
    }
    if (quantity > selectedVariant.stock) {
      toast({
          title: 'Insufficient stock',
          description: `Only ${selectedVariant.stock} items available.`,
          variant: 'destructive',
      });
      return;
    }
    cartDispatch({ type: 'ADD_ITEM', payload: { product, variant: selectedVariant, quantity } });
    toast({
      title: 'Added to cart',
      description: `${quantity} x ${product.name} (${selectedVariant.name}) has been added to your cart.`,
    });
  };

  const handleToggleWishlist = () => {
    if (wishlisted) {
      wishlistDispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
      toast({
        title: 'Removed from wishlist',
        description: `${product.name} has been removed from your wishlist.`,
        variant: 'destructive',
      });
    } else {
      wishlistDispatch({ type: 'ADD_ITEM', payload: product });
      toast({
        title: 'Added to wishlist',
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleVariantChange = (variantId: string) => {
    const newVariant = product.variants.find(v => v.id.toString() === variantId);
    setSelectedVariant(newVariant);
    setQuantity(1); // Reset quantity when variant changes
  }
  
  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setQuantity(isNaN(value) ? 1 : value);
  }
  
  const mainImage = selectedImage || (product.images && product.images.length > 0 ? product.images[0] : 'https://picsum.photos/600/600');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-4 group cursor-crosshair">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-200 group-hover:scale-150"
              data-ai-hint={product.dataAiHint}
            />
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100" onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              const img = e.currentTarget.previousElementSibling as HTMLElement;
              if (img) {
                img.style.transformOrigin = `${x}% ${y}%`;
              }
            }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.images && product.images.length > 0 && product.images.map((image, index) => (
              <button 
                key={index}
                onClick={() => setSelectedImage(image)}
                className={cn(
                  "relative aspect-square w-full rounded-md overflow-hidden ring-2 ring-transparent transition-all",
                  selectedImage === image ? "ring-primary" : "hover:ring-primary/50"
                )}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
           <div>
            {product.isPreOrder && (
                <Badge variant="secondary" className="mb-2">Pre-Order Item</Badge>
            )}
            <p className="text-sm font-medium text-primary">{product.category}</p>
            <h1 className="text-3xl lg:text-4xl font-bold mt-2">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-5 w-5", i < Math.round(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                    ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
            </div>
            <p className="text-3xl font-bold text-primary mt-4">GH₵{selectedVariant?.price.toFixed(2)}</p>
            {product.isPreOrder && (
              <div className="mt-4 bg-muted p-4 rounded-lg space-y-2">
                {product.releaseDate && (
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Release Date:</p>
                        <p className="text-sm font-bold">{new Date(product.releaseDate).toLocaleDateString()}</p>
                    </div>
                )}
                {product.shippingDate && (
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated Shipping:</p>
                        <p className="text-sm font-bold">{new Date(product.shippingDate).toLocaleDateString()}</p>
                    </div>
                )}
                {product.preOrderMessage && (
                    <p className="text-sm italic text-muted-foreground pt-2 border-t border-border">{product.preOrderMessage}</p>
                )}
                {product.releaseDate && (
                    <div className="pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Time until release:</p>
                        <CountdownTimer targetDate={product.releaseDate} />
                    </div>
                )}
              </div>
            )}
          </div>
          
          <Separator className="my-6" />

          {product.variants.length > 1 && (
            <div className="mb-6">
                <Label className="text-lg font-semibold mb-2 block">Select Option</Label>
                <RadioGroup 
                    defaultValue={selectedVariant?.id.toString()}
                    onValueChange={handleVariantChange}
                    className="grid grid-cols-2 gap-3"
                >
                    {product.variants.map(variant => (
                        <div key={variant.id}>
                            <RadioGroupItem value={variant.id.toString()} id={`v-${variant.id}`} className="sr-only peer"/>
                            <Label 
                                htmlFor={`v-${variant.id}`}
                                className="flex flex-col text-center items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <span className="font-semibold">{variant.name}</span>
                                <span className="text-sm text-muted-foreground">GH₵{variant.price.toFixed(2)}</span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
          )}

          {selectedVariant && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {product.isPreOrder ? (
                  <span className="text-sm text-primary font-medium">Available for Pre-Order</span>
                ) : selectedVariant.stock > 10 ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">In Stock</span>
                ) : selectedVariant.stock > 0 ? (
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Only {selectedVariant.stock} left</span>
                ) : (
                  <Badge variant="destructive" className="dark:bg-red-900 dark:text-red-100">Out of Stock</Badge>
                )}
              </div>
              {selectedVariant.stock === 0 && !product.isPreOrder && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={backInStockEmail}
                    onChange={(e) => setBackInStockEmail(e.target.value)}
                    className="h-9 px-3 text-sm border border-border/80 bg-background flex-1 max-w-xs rounded-none"
                    disabled={backInStockSent}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={backInStockSent || !backInStockEmail.trim()}
                    onClick={async () => {
                      try {
                        await addDoc(collection(db, 'back_in_stock'), {
                          productId: product.id,
                          variantId: selectedVariant.id,
                          email: backInStockEmail.trim(),
                          productName: product.name,
                          createdAt: new Date().toISOString(),
                        });
                        setBackInStockSent(true);
                        toast({ title: 'You\'re in!', description: 'We\'ll notify you when this item is back in stock.' });
                      } catch {
                        toast({ title: 'Error', description: 'Failed to save your request.', variant: 'destructive' });
                      }
                    }}
                  >
                    <Bell className="mr-1 h-4 w-4" />
                    {backInStockSent ? 'Notified ✓' : 'Notify Me'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <Label htmlFor="quantity" className="text-lg font-semibold mb-2 block">Quantity</Label>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={!selectedVariant || (selectedVariant.stock === 0 && !product.isPreOrder)}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Input 
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.isPreOrder ? (product.preOrderLimit || 99) : (selectedVariant?.stock || 1)}
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    className="h-10 w-20 text-center"
                    disabled={!selectedVariant || (selectedVariant.stock === 0 && !product.isPreOrder)}
                />
                 <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)} disabled={!selectedVariant || (selectedVariant.stock === 0 && !product.isPreOrder) || quantity >= (product.isPreOrder ? (product.preOrderLimit || 99) : (selectedVariant?.stock || 0))}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 10 && !product.isPreOrder && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Hurry, only {selectedVariant.stock} items left</p>
            )}
          </div>
          

           <div>
             <h2 className="text-xl font-semibold">Description</h2>
             <p className="mt-4 text-muted-foreground">{product.description}</p>
          </div>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Share this product</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Share
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} at Glitch & Slay!`)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Post
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
              }}>
                <Share2 className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </div>
         
<div className="mt-auto pt-6">
             <div className="flex items-center gap-4">
                 {product.isPreOrder ? (
                    <PreOrderButton product={product} quantity={quantity} variantId={selectedVariant?.id || ''} />
                 ) : (
                    <Button size="lg" className="flex-grow" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock === 0}>
                        <ShoppingCart className="mr-2" /> Add to Cart
                    </Button>
                 )}
                <Button variant="outline" size="icon" className="w-12 h-12" onClick={handleToggleWishlist}>
                    <Heart className={cn('h-6 w-6', wishlisted ? 'text-red-500 fill-current' : 'text-foreground')} />
                </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <ProductReviews product={product} />
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <Separator />
          <h2 className="text-2xl font-bold mt-8 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
