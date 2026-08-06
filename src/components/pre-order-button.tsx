"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Loader2 } from 'lucide-react';
import { createPreOrder } from '@/lib/firebase/pre-orders'; // Direct import
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';

interface PreOrderButtonProps {
  product: Product;
  quantity: number;
  variantId: string;
}

export function PreOrderButton({ product, quantity, variantId }: PreOrderButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePreOrder = async () => {
    if (!user) {
        toast({
            title: 'Authentication Required',
            description: 'Please log in to place a pre-order.',
            variant: 'destructive',
        });
        return;
    }

    setLoading(true);
    try {
      const selectedVar = product.variants.find(v => v.id.toString() === variantId);
      if (!selectedVar) throw new Error('Variant not found');
      
      const totalPrice = selectedVar.price * quantity;
      
      // Calculate deposit if enabled (percentage based)
      const amountToPay = (product.depositEnabled && product.depositAmount)
        ? (totalPrice * (product.depositAmount / 100))
        : totalPrice;

      // NOTE: Here you would trigger your payment gateway (Paystack)
      // Example: initializePayment({ onSuccess: () => { /* ... call createPreOrder ... */ } })

      await createPreOrder({
        userId: user.uid,
        productId: product.id.toString(),
        quantity,
        amountPaid: amountToPay,
        balanceRemaining: totalPrice - amountToPay,
      });

      toast({
        title: 'Pre-order placed!',
        description: `Successfully paid GH₵${amountToPay.toFixed(2)}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place pre-order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="flex-grow bg-primary hover:bg-primary/90" 
      onClick={handlePreOrder}
      disabled={loading}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
      {loading ? 'Processing...' : 'Pre-Order Now'}
    </Button>
  );
}
