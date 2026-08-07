
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useOrders } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { CreditCard, Truck, Store, MessageSquare, Loader2, CheckCircle, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/context/order-context';
import type { Coupon } from '@/lib/coupon';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, collection, getDocs, query, where, updateDoc, increment, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import { usePaystackPayment } from 'react-paystack';


const checkoutSchema = z.discriminatedUnion("deliveryMethod", [
    z.object({
        deliveryMethod: z.literal('delivery'),
        fullName: z.string().min(3, 'Full name is required'),
        email: z.string().email('A valid email is required'),
        address: z.string().min(5, 'Address is required'),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        zip: z.string().min(1, 'Postal code is required'),
        country: z.string().min(2, 'Country is required'),
    }),
    z.object({
        deliveryMethod: z.literal('pickup'),
        fullName: z.string().optional(),
        email: z.string().email('A valid email is required'),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
    })
]).and(
    z.object({
        paymentMethod: z.enum(['card', 'on_delivery']),
        orderNotes: z.string().optional(),
    })
);


type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const { state: settings } = useSiteSettings();
  const { dispatch: orderDispatch } = useOrders();
  const { items } = cartState;
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const guestId = useRef<string | null>(null);
  if (typeof window !== 'undefined' && !guestId.current) {
    guestId.current = localStorage.getItem('guest_id') || crypto.randomUUID();
    if (!localStorage.getItem('guest_id')) {
      localStorage.setItem('guest_id', guestId.current);
    }
  }

  const isGuest = !user && !loading;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'card',
      deliveryMethod: 'delivery',
      fullName: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'GHA',
      orderNotes: '',
    }
  });

  const deliveryMethod = form.watch('deliveryMethod');
  const paymentMethod = form.watch('paymentMethod');
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location tracking.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast({
          title: 'Location Captured',
          description: 'Your delivery location has been set automatically.',
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'Location Required',
          description: 'Please enable location services in your browser settings for home delivery.',
          variant: 'destructive',
        });
      }
    );
  };

  useEffect(() => {
    if (deliveryMethod === 'delivery') {
      captureLocation();
    } else {
        setDeliveryCoords(null);
    }
  }, [deliveryMethod]);

  const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const tax = subtotal * (settings.taxRate / 100);
  const deliveryFee = deliveryMethod === 'delivery' && subtotal > 0 ? settings.shippingFee : 0;
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  useEffect(() => {
    if (user) {
      form.setValue('email', user.email || '');
      form.setValue('fullName', user.displayName || '');
    }
  }, [user, form]);

  useEffect(() => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  }, [items]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a coupon code.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to apply a coupon.', variant: 'destructive' });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('code', '==', couponCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'Invalid Coupon', description: 'No coupon found with that code.', variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      if (!coupon.isActive) {
        toast({ title: 'Coupon Inactive', description: 'This coupon is no longer active.', variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      if (new Date(coupon.expiresAt) < new Date()) {
        toast({ title: 'Coupon Expired', description: 'This coupon has expired.', variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
        toast({ title: 'Coupon Fully Used', description: 'This coupon has reached its usage limit.', variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      if (subtotal < coupon.minOrderAmount) {
        toast({ title: 'Minimum Not Met', description: `Minimum order amount of GH₵${coupon.minOrderAmount.toFixed(2)} required.`, variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      if (coupon.usedBy?.includes(user.uid)) {
        toast({ title: 'Already Used', description: 'You have already used this coupon.', variant: 'destructive' });
        setIsApplyingCoupon(false);
        return;
      }

      let calculatedDiscount = 0;
      if (coupon.type === 'percentage') {
        calculatedDiscount = subtotal * (coupon.value / 100);
      } else {
        calculatedDiscount = coupon.value;
      }
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      setDiscount(calculatedDiscount);
      setAppliedCoupon(coupon);
      toast({ title: 'Coupon Applied!', description: `Discount of GH₵${calculatedDiscount.toFixed(2)} applied.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to apply coupon. Please try again.', variant: 'destructive' });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  };
  
  const createOrderInFirestore = useCallback(async (data: CheckoutFormValues, transactionRef?: string) => {
    const activeUserId = user?.uid || guestId.current || 'guest';
    const activeUserName = user?.displayName || data.fullName || 'Guest';
    
    const { paymentMethod, deliveryMethod, orderNotes, email } = data;
    const orderId = crypto.randomUUID().slice(0, 8);

    const vendorIdsSet = new Set<string>();

    const newOrder: Order = {
      id: orderId,
      userId: activeUserId,
      orderId: orderId.toString(),
      customerEmail: email,
      date: new Date().toISOString(),
      items: items,
      subtotal,
      tax,
      shippingFee: deliveryFee,
      total,
      shippingAddress: data.deliveryMethod === 'delivery' ? { 
        fullName: data.fullName!,
        email: data.email!,
        address: data.address!, 
        city: data.city!, 
        state: data.state!, 
        zip: data.zip!, 
        country: data.country! 
      } : { fullName: data.fullName || activeUserName, email: data.email!, address: '', city: '', state: '', zip: '', country: '' },
      paymentMethod,
      deliveryMethod,
      deliveryCoords: deliveryCoords ?? undefined,
      status: 'Pending',
      orderNotes: orderNotes,
      appName: "Glitch & Slay",
      ...(transactionRef && { transactionRef }),
      ...(appliedCoupon && { couponCode: appliedCoupon.code, discount }),
      vendorIds: [],
    };

    const orderRef = doc(collection(db, 'orders'), newOrder.id.toString());
    try {
      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) {
            throw new Error(`Product "${item.name}" no longer exists.`);
          }
          const product = productDoc.data();
          const variantIndex = product.variants.findIndex(
            (v: any) => v.id === item.variant.id
          );
          if (variantIndex === -1) {
            throw new Error(`Variant "${item.variant.name}" for "${item.name}" not found.`);
          }
          if (product.variants[variantIndex].stock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.name}" (${item.variant.name}). Only ${product.variants[variantIndex].stock} left.`
            );
          }
          product.variants[variantIndex].stock -= item.quantity;
          transaction.update(productRef, { variants: product.variants });

          const productVendorId = product.vendor?.vendorId;
          if (productVendorId) {
            vendorIdsSet.add(productVendorId);
          }
        }

        if (appliedCoupon && user) {
          const couponRef = doc(db, 'coupons', appliedCoupon.id);
          transaction.update(couponRef, {
            currentUses: increment(1),
            usedBy: arrayUnion(user.uid),
          });
        }

        newOrder.vendorIds = Array.from(vendorIdsSet);
        transaction.set(orderRef, newOrder);
      });

      orderDispatch({ type: 'ADD_ORDER', payload: newOrder });
      toast({
        title: 'Order Placed!',
        description: 'Thank you for your purchase. A confirmation email will be sent shortly.',
      });
      cartDispatch({ type: 'CLEAR_CART' });
      router.push(`/orders/${newOrder.id}`);
    } catch (error: any) {
      if (error.message?.includes('Insufficient stock') || error.message?.includes('no longer exists') || error.message?.includes('not found')) {
        toast({
          title: 'Order Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'create',
            requestResourceData: newOrder
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: 'Order Failed',
          description: 'Something went wrong processing your order. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  }, [user, items, subtotal, tax, deliveryFee, total, appliedCoupon, discount, orderDispatch, cartDispatch, router, toast]);

  const paystackConfig = {
      reference: (new Date()).getTime().toString(),
      email: form.getValues('email'),
      amount: Math.round(total * 100),
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const onSubmit = useCallback(async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    
    if (data.paymentMethod === 'card') {
      initializePayment({
        onSuccess: (transaction) => {
          createOrderInFirestore(data, transaction.reference);
        },
        onClose: () => {
          toast({
            title: 'Payment cancelled',
            description: 'Your payment was not completed.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
        },
      });
    } else { // 'on_delivery'
      createOrderInFirestore(data);
    }
  }, [initializePayment, createOrderInFirestore, toast]);

  const handlePaymentMethodChange = useCallback((value: 'card' | 'on_delivery') => {
      form.setValue('paymentMethod', value, { shouldValidate: true });
  }, [form]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            <p className="mt-4">Verifying authentication...</p>
        </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-semibold">Your cart is empty.</h1>
            <p className="mt-2 text-muted-foreground">You can't proceed to checkout without any items.</p>
            <Button onClick={() => router.push('/')} className="mt-6">Continue Shopping</Button>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      {isGuest && (
        <div className="mb-6 p-4 bg-muted rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Checking out as a guest.{" "}
            <Link href="/login?redirect=/checkout" className="text-primary underline font-medium">
              Sign in
            </Link>{" "}
            to use coupons and save your order history.
          </p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Card>
              <CardHeader>
                <CardTitle>Delivery Method</CardTitle>
                <CardDescription>Choose how you'd like to receive your order.</CardDescription>
              </CardHeader>
              <CardContent>
                 <FormField
                  control={form.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <FormItem>
                              <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                                <Truck className="mb-3 h-6 w-6" />
                                Home Delivery
                              </Label>
                            </FormItem>
                            <FormItem>
                              <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                                <Store className="mb-3 h-6 w-6" />
                                In-store Pickup
                              </Label>
                            </FormItem>
                          </RadioGroup>
                       </FormControl>
                    </FormItem>
                  )}
                 />
              </CardContent>
             </Card>

            <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                  <Input placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                </CardContent>
            </Card>

            {deliveryMethod === 'delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GHA">Ghana</SelectItem>
                            <SelectItem value="NGA">Nigeria</SelectItem>
                            <SelectItem value="KEN">Kenya</SelectItem>
                            <SelectItem value="ZAF">South Africa</SelectItem>
                            <SelectItem value="USA">United States</SelectItem>
                            <SelectItem value="GBR">United Kingdom</SelectItem>
                            <SelectItem value="CAN">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you'd like to pay for your order.</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => handlePaymentMethodChange(value as any)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormItem>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <CreditCard className="mb-3 h-6 w-6"/>
                       Pay Now
                    </Label>
                  </FormItem>
                  <FormItem>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <RadioGroupItem value="on_delivery" id="on_delivery" className="peer sr-only" />
                        <Truck className="mb-3 h-6 w-6"/>
                        Pay on Delivery
                    </Label>
                  </FormItem>
                 </RadioGroup>
                 <FormMessage className="pt-4" />
              </CardContent>
              <CardContent>
                {paymentMethod === 'card' && (
                  <div className="text-center text-muted-foreground bg-gray-50 p-4 rounded-md">
                     You will be redirected to Paystack to complete your payment securely.
                  </div>
                )}
                {paymentMethod === 'on_delivery' && (
                  <div className="text-center text-muted-foreground bg-gray-50 p-4 rounded-md">
                    You will pay with cash or mobile money when your order is delivered.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <MessageSquare />
                      Order Notes (Optional)
                  </CardTitle>
                  <CardDescription>
                      Add any special instructions for your order.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <FormField
                      control={form.control}
                      name="orderNotes"
                      render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <Textarea
                                      placeholder="e.g., Please leave the package at the front door."
                                      {...field}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </CardContent>
            </Card>

          </div>

          <div className="mt-8 lg:mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y mb-6">
                  {items.map(item => (
                    <li key={item.id} className="flex items-center py-3">
                       <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-md" />
                      <div className="ml-4 flex-grow">
                        <p className="font-semibold text-sm">{item.name} <span className="text-muted-foreground">({item.variant.name})</span></p>
                         <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">GH₵{(item.variant.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mb-4">
                  <div className="flex-grow">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                  </div>
                  {appliedCoupon ? (
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveCoupon}>
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode.trim()}>
                      {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>GH₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes ({settings.taxRate}%)</span>
                    <span>GH₵{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>GH₵{deliveryFee.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-GH₵{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>GH₵{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Button type="submit" className="w-full" size="lg" disabled={items.length === 0 || isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                   {paymentMethod === 'card' ? 'Pay Now' : 'Place Order'}
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
