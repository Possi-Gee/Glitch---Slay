'use client';

import { useState, useEffect } from 'react';
import { useOrders } from '@/hooks/use-orders';
import type { Order } from '@/context/order-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { History, Package, ShoppingCart, ClipboardList, CreditCard, RotateCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePaystackPayment } from 'react-paystack';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { PreOrder } from '@/types/pre-order';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-500 text-white';
    case 'Shipped':
      return 'bg-blue-500 text-white';
    case 'Delivered':
      return 'bg-green-500 text-white';
    case 'Cancelled':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getPreOrderStatusClass = (status: PreOrder['orderStatus']) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 text-white';
    case 'CONFIRMED':
      return 'bg-blue-500 text-white';
    case 'READY_TO_SHIP':
      return 'bg-indigo-500 text-white';
    case 'SHIPPED':
      return 'bg-green-500 text-white';
    case 'DELIVERED':
      return 'bg-green-700 text-white';
    case 'CANCELLED':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getPreOrderPaymentStatusClass = (status: PreOrder['paymentStatus'], balance: number) => {
  if (status === 'PAID') return 'bg-green-600 text-white';
  if (status === 'REFUNDED') return 'bg-purple-600 text-white';
  return balance > 0 ? 'bg-amber-500 text-white' : 'bg-yellow-500 text-white';
};

const getPreOrderPaymentLabel = (status: PreOrder['paymentStatus'], balance: number) => {
  if (status === 'PAID') return 'Fully Paid';
  if (status === 'REFUNDED') return 'Refunded';
  return balance > 0 ? 'Deposit Paid' : 'Pending';
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { state } = useOrders();
  const { orders } = state;

  const [activeTab, setActiveTab] = useState<'orders' | 'pre-orders'>('orders');
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [preOrdersLoading, setPreOrdersLoading] = useState(true);
  const [payingPreOrder, setPayingPreOrder] = useState<PreOrder | null>(null);

  // Subscribe to user's pre-orders
  useEffect(() => {
    if (!user) {
      setPreOrders([]);
      setPreOrdersLoading(false);
      return;
    }

    setPreOrdersLoading(true);
    const q = query(
      collection(db, 'preOrders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PreOrder[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as PreOrder);
      });
      
      // Sort by creation date descending
      list.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setPreOrders(list);
      setPreOrdersLoading(false);
    }, (error) => {
      console.error("Error loading pre-orders:", error);
      setPreOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Paystack Configuration for completing balance payment
  const paystackConfig = {
    reference: `bal_${Date.now()}`,
    email: user?.email || '',
    amount: payingPreOrder ? Math.round(payingPreOrder.balanceRemaining * 100) : 0,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePayBalanceSuccess = async (preOrder: PreOrder, reference: string) => {
    const preOrderRef = doc(db, 'preOrders', preOrder.id);
    try {
      await updateDoc(preOrderRef, {
        amountPaid: preOrder.amountPaid + preOrder.balanceRemaining,
        balanceRemaining: 0,
        paymentStatus: 'PAID',
        balanceTransactionRef: reference,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Balance Paid!',
        description: `Successfully completed payment for ${preOrder.productName}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Database Error',
        description: 'Failed to update payment status in database. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  // Trigger Paystack balance payment after state is updated and paystackConfig is computed
  useEffect(() => {
    if (payingPreOrder) {
      initializePayment({
        onSuccess: (transaction: any) => {
          handlePayBalanceSuccess(payingPreOrder, transaction.reference);
          setPayingPreOrder(null);
        },
        onClose: () => {
          toast({
            title: 'Payment cancelled',
            description: 'Your payment was not completed.',
            variant: 'destructive',
          });
          setPayingPreOrder(null);
        }
      });
    }
  }, [payingPreOrder]);

  const handleCancelPreOrder = async (preOrder: PreOrder) => {
    if (!confirm('Are you sure you want to cancel this pre-order? Any deposits paid will be refunded.')) return;
    
    const preOrderRef = doc(db, 'preOrders', preOrder.id);
    try {
      await updateDoc(preOrderRef, {
        orderStatus: 'CANCELLED',
        paymentStatus: preOrder.amountPaid > 0 ? 'REFUNDED' : preOrder.paymentStatus,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Pre-order Cancelled',
        description: 'Your pre-order has been successfully cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Could not cancel pre-order.',
        variant: 'destructive',
      });
    }
  };

  const getDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-8 w-8" />
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-muted mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            'px-6 py-3 text-sm font-semibold transition-all border-b-2',
            activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Regular Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('pre-orders')}
          className={cn(
            'px-6 py-3 text-sm font-semibold transition-all border-b-2',
            activeTab === 'pre-orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Pre-Orders ({preOrdersLoading ? '...' : preOrders.length})
        </button>
      </div>

      {/* Tab Content: Regular Orders */}
      {activeTab === 'orders' && (
        orders.length === 0 ? (
          <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold">You have no orders yet.</h2>
              <p className="mt-2 text-muted-foreground">When you place an order, it will appear here.</p>
              <Button asChild className="mt-6">
                  <Link href="/">Start Shopping</Link>
              </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row justify-between items-start">
                          <div>
                              <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                              <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge className={cn(getStatusClass(order.status))}>{order.status}</Badge>
                      </CardHeader>
                      <CardContent>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <Package className="h-5 w-5 text-muted-foreground"/>
                                  <span className="text-sm text-muted-foreground">{order.items.length} item(s)</span>
                              </div>
                              <span className="text-lg font-bold">GH₵{order.total.toFixed(2)}</span>
                          </div>
                      </CardContent>
                  </Card>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Tab Content: Pre-Orders */}
      {activeTab === 'pre-orders' && (
        preOrdersLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : preOrders.length === 0 ? (
          <div className="text-center py-16">
              <ClipboardList className="mx-auto h-24 w-24 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold">No pre-orders found.</h2>
              <p className="mt-2 text-muted-foreground">Reserve new products and they will show up here.</p>
              <Button asChild className="mt-6">
                  <Link href="/pre-orders">Browse Pre-Orders</Link>
              </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {preOrders.map((preOrder) => (
              <Card key={preOrder.id} className="overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3">
                  <div>
                    <CardTitle className="text-lg">Pre-Order #{preOrder.id.slice(0, 8)}</CardTitle>
                    <CardDescription>Reserved on {getDate(preOrder.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={cn(getPreOrderStatusClass(preOrder.orderStatus))}>
                      {preOrder.orderStatus}
                    </Badge>
                    <Badge className={cn(getPreOrderPaymentStatusClass(preOrder.paymentStatus, preOrder.balanceRemaining))}>
                      {getPreOrderPaymentLabel(preOrder.paymentStatus, preOrder.balanceRemaining)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {preOrder.productImage ? (
                      <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0 border bg-muted">
                        <Image
                          src={preOrder.productImage}
                          alt={preOrder.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded bg-muted border flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{preOrder.productName}</h3>
                      <p className="text-sm text-muted-foreground">Option: {preOrder.variant.name} | Quantity: {preOrder.quantity}</p>
                      <p className="text-sm font-semibold mt-1">
                        Total Value: GH₵{preOrder.totalPrice.toFixed(2)} | Paid: GH₵{preOrder.amountPaid.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                      {preOrder.balanceRemaining > 0 && preOrder.orderStatus !== 'CANCELLED' && (
                        <Button 
                          size="sm"
                          className="flex-1 sm:flex-none bg-primary text-white"
                          onClick={() => setPayingPreOrder(preOrder)}
                        >
                          <CreditCard className="mr-1.5 h-4 w-4" />
                          Pay Balance (GH₵{preOrder.balanceRemaining.toFixed(2)})
                        </Button>
                      )}
                      {(preOrder.orderStatus === 'PENDING' || preOrder.orderStatus === 'CONFIRMED') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 sm:flex-none text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleCancelPreOrder(preOrder)}
                        >
                          <RotateCw className="mr-1.5 h-4 w-4" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Estimated Delivery / Info Alert */}
                  {preOrder.balanceRemaining > 0 && preOrder.orderStatus !== 'CANCELLED' && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 rounded-md p-3 flex items-start gap-2.5 text-xs">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Deposit Active:</span> Please pay the remaining balance of <span className="font-bold">GH₵{preOrder.balanceRemaining.toFixed(2)}</span> to guarantee shipment when the product officially releases.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
