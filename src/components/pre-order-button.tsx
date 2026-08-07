"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Loader2, Truck, Store } from 'lucide-react';
import { createPreOrder } from '@/lib/firebase/pre-orders';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { usePaystackPayment } from 'react-paystack';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface PreOrderButtonProps {
  product: Product;
  quantity: number;
  variantId: string;
}

export function PreOrderButton({ product, quantity, variantId }: PreOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { state: settings } = useSiteSettings();

  // Shipping Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('GHA');
  const [orderNotes, setOrderNotes] = useState('');

  // Prefill user details
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.displayName || '');
    }
  }, [user]);

  const selectedVar = product.variants.find(v => v.id.toString() === variantId);
  const itemPrice = selectedVar?.price || 0;
  const subtotal = itemPrice * quantity;
  const tax = subtotal * (settings.taxRate / 100);
  const shippingFee = deliveryMethod === 'delivery' ? settings.shippingFee : 0;
  const totalPrice = subtotal + tax + shippingFee;

  // Calculate deposit if enabled (percentage based)
  const amountToPay = (product.depositEnabled && product.depositAmount)
    ? (subtotal * (product.depositAmount / 100))
    : totalPrice;
  
  const balanceRemaining = totalPrice - amountToPay;

  // Paystack Configuration
  const paystackConfig = {
    reference: `pre_${Date.now()}`,
    email: email,
    amount: Math.round(amountToPay * 100), // in GH Pesewas
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePreOrderClick = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to place a pre-order.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedVar) {
      toast({
        title: 'Selection Required',
        description: 'Please select a variant first.',
        variant: 'destructive',
      });
      return;
    }
    setIsOpen(true);
  };

  const handlePaymentSuccess = async (reference: string) => {
    setLoading(true);
    setIsOpen(false);
    try {
      await createPreOrder({
        userId: user!.uid,
        productId: product.id.toString(),
        productName: product.name,
        productImage: product.images?.[0] || '',
        variant: {
          id: selectedVar!.id.toString(),
          name: selectedVar!.name,
          price: selectedVar!.price,
        },
        quantity,
        subtotal,
        tax,
        shippingFee,
        totalPrice,
        amountPaid: amountToPay,
        balanceRemaining: balanceRemaining,
        paymentStatus: amountToPay >= totalPrice ? 'PAID' : 'PENDING',
        orderStatus: 'PENDING',
        shippingAddress: {
          fullName,
          email,
          address: deliveryMethod === 'delivery' ? address : '',
          city: deliveryMethod === 'delivery' ? city : '',
          state: deliveryMethod === 'delivery' ? state : '',
          zip: deliveryMethod === 'delivery' ? zip : '',
          country: deliveryMethod === 'delivery' ? country : '',
        },
        deliveryMethod,
        orderNotes,
        transactionRef: reference,
      });

      toast({
        title: 'Pre-order placed!',
        description: `Successfully paid GH₵${amountToPay.toFixed(2)}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Database Error',
        description: error.message || 'Failed to save pre-order details. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in your name and email.',
        variant: 'destructive',
      });
      return;
    }
    if (deliveryMethod === 'delivery' && (!address.trim() || !city.trim() || !state.trim())) {
      toast({
        title: 'Required Fields',
        description: 'Please complete your shipping address.',
        variant: 'destructive',
      });
      return;
    }

    // Trigger Paystack Payment
    initializePayment({
      onSuccess: (transaction: any) => {
        handlePaymentSuccess(transaction.reference);
      },
      onClose: () => {
        toast({
          title: 'Payment cancelled',
          description: 'Your payment was not completed.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <>
      <Button 
        size="lg" 
        className="flex-grow bg-primary hover:bg-primary/90" 
        onClick={handlePreOrderClick}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
        {loading ? 'Processing...' : 'Pre-Order Now'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto text-foreground">
          <DialogHeader>
            <DialogTitle>Pre-Order Checkout: {product.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
            
            {/* Delivery Method */}
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(val: any) => setDeliveryMethod(val)}
                className="grid grid-cols-2 gap-4"
              >
                <Label htmlFor="pre-delivery" className="flex items-center gap-2 border p-3 rounded-md cursor-pointer hover:bg-muted [&:has(:checked)]:border-primary">
                  <RadioGroupItem value="delivery" id="pre-delivery" />
                  <Truck className="h-4 w-4" />
                  Home Delivery
                </Label>
                <Label htmlFor="pre-pickup" className="flex items-center gap-2 border p-3 rounded-md cursor-pointer hover:bg-muted [&:has(:checked)]:border-primary">
                  <RadioGroupItem value="pickup" id="pre-pickup" />
                  <Store className="h-4 w-4" />
                  Store Pickup
                </Label>
              </RadioGroup>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="pre-fullName">Full Name</Label>
                <Input
                  id="pre-fullName"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pre-email">Email</Label>
                <Input
                  id="pre-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="dark:text-white"
                />
              </div>
            </div>

            {/* Shipping Address (Conditional) */}
            {deliveryMethod === 'delivery' && (
              <div className="space-y-3 border-t pt-3">
                <h4 className="text-sm font-semibold">Shipping Address</h4>
                <div className="space-y-1">
                  <Label htmlFor="pre-address">Street Address</Label>
                  <Input
                    id="pre-address"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 High Street"
                    className="dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="pre-city">City</Label>
                    <Input
                      id="pre-city"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Accra"
                      className="dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pre-state">State/Region</Label>
                    <Input
                      id="pre-state"
                      required
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="Greater Accra"
                      className="dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pre-zip">Zip/Postal</Label>
                    <Input
                      id="pre-zip"
                      required
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      placeholder="00233"
                      className="dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="space-y-1">
              <Label htmlFor="pre-notes">Order Notes (Optional)</Label>
              <Textarea
                id="pre-notes"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Notes about your delivery, e.g. special directions"
                className="h-20 dark:text-white"
              />
            </div>

            {/* Pricing Summary & Deposit Details */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm text-foreground">
              <div className="flex justify-between">
                <span>Subtotal ({quantity}x)</span>
                <span>GH₵{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>GH₵{tax.toFixed(2)}</span>
              </div>
              {deliveryMethod === 'delivery' && (
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>GH₵{shippingFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total Value</span>
                <span>GH₵{totalPrice.toFixed(2)}</span>
              </div>

              {product.depositEnabled && product.depositAmount && (
                <div className="border-t border-dashed border-muted-foreground/30 pt-2 mt-2 space-y-1 text-primary">
                  <div className="flex justify-between font-bold text-base">
                    <span>Deposit Due Now ({product.depositAmount}%)</span>
                    <span>GH₵{amountToPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Remaining Balance</span>
                    <span>GH₵{balanceRemaining.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11">
              Pay with Paystack (GH₵{amountToPay.toFixed(2)})
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
