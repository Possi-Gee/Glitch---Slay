
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem } from '@/context/cart-context';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function CartPage() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const { state: settings } = useSiteSettings();


  const handleUpdateQuantity = (item: CartItem, quantity: number) => {
    // Prevent NaN values from being dispatched
    if (isNaN(quantity)) {
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity } });
  };

  const handleRemoveItem = (item: CartItem) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } });
  };

  const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const tax = subtotal * (settings.taxRate / 100);
  const deliveryFee = subtotal > 0 ? settings.shippingFee : 0;
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-semibold">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {items.map(item => (
                  <li key={item.id} className="flex items-center p-4">
                    <Image src={item.image} alt={item.name} width={80} height={80} className="rounded-md" />
                    <div className="ml-4 flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                      <p className="text-sm text-muted-foreground">GH₵{item.variant.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item, parseInt(e.target.value, 10))}
                        className="h-9 w-16 text-center"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 lg:mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>GH₵{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>GH₵{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>GH₵{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
               <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
