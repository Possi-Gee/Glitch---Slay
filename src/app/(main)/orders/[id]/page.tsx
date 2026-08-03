
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Package, Truck, Store, FileText, MessageSquare, Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/context/order-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

const getPaymentMethodName = (method: string) => {
    const names: { [key: string]: string } = {
        card: 'Credit/Debit Card',
        mobile_money: 'Mobile Money',
        on_delivery: 'Pay on Delivery',
    };
    return names[method] || 'Unknown';
}

const getDeliveryMethodName = (method: Order['deliveryMethod']) => {
    return method === 'delivery' ? 'Home Delivery' : 'In-store Pickup';
}

const OrderStatusTimeline = ({ status, deliveryMethod }: { status: Order['status'], deliveryMethod: Order['deliveryMethod'] }) => {
    const statuses: Order['status'][] = ['Pending', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(status);

    if (status === 'Cancelled' || deliveryMethod === 'pickup') {
        return null; // Don't show timeline for cancelled or pickup orders
    }

    const timelineSteps = [
        { name: 'Pending', icon: Package },
        { name: 'Shipped', icon: Truck },
        { name: 'Delivered', icon: CheckCircle },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-start relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-4">
                        <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}></div>
                    </div>
                    {timelineSteps.map((step, index) => {
                        const isCompleted = index < currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.name} className="flex flex-col items-center z-10 text-center">
                                <div className={cn("flex items-center justify-center w-8 h-8 rounded-full mb-2", 
                                    isCompleted ? 'bg-primary' :
                                    isCurrent ? 'bg-primary ring-4 ring-primary/30' :
                                    'bg-muted'
                                )}>
                                   {isCompleted ? <CheckCircle className="h-5 w-5 text-primary-foreground"/> : <Icon className={cn("h-5 w-5", isCurrent ? 'text-primary-foreground' : 'text-muted-foreground')} />}
                                </div>
                                <p className={cn("text-xs font-semibold", isCompleted || isCurrent ? 'text-primary' : 'text-muted-foreground')}>{step.name}</p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { state: orderState } = useOrders();
  const { loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [returnReason, setReturnReason] = useState('');
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);

  const handleRequestReturn = async () => {
    if (!order || !returnReason.trim()) return;
    setIsRequestingReturn(true);
    try {
      const orderRef = doc(db, 'orders', order.id.toString());
      await updateDoc(orderRef, { refundRequested: true, refundReason: returnReason.trim() });
      toast({ title: 'Return Requested', description: 'Your return request has been submitted. We will review it shortly.' });
      setReturnReason('');
    } catch {
      toast({ title: 'Error', description: 'Failed to submit return request. Please try again.', variant: 'destructive' });
    } finally {
      setIsRequestingReturn(false);
    }
  };

  const order = useMemo(() => {
    return orderState.orders.find((o) => o.id.toString() === id);
  }, [id, orderState.orders]);
  
  if (authLoading || orderState.loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin" />
        <p className="mt-4">Loading Order Details...</p>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground mt-2">The order you are looking for does not exist or you may not have permission to view it.</p>
        <Button asChild className="mt-6">
          <Link href="/orders">Back to My Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2" /> Back
      </Button>

       <Card className="mb-8">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                     <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                     <CardTitle className="text-2xl">Thank you for your order!</CardTitle>
                     <CardDescription>Placed on {new Date(order.date).toLocaleString()}</CardDescription>
                </div>
                <div className="text-right mt-4 sm:mt-0">
                    <p className="text-sm text-muted-foreground">Order Status</p>
                    <Badge className={cn("text-lg mt-1", getStatusClass(order.status))}>{order.status}</Badge>
                </div>
            </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <OrderStatusTimeline status={order.status} deliveryMethod={order.deliveryMethod} />
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package/> Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="divide-y">
                    {order.items.map((item) => (
                    <li key={item.id} className="flex items-center py-4">
                        <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" />
                        <div className="ml-4 flex-grow">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Variant: {item.variant.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-semibold">GH₵{(item.variant.price * item.quantity).toFixed(2)}</p>
                             <p className="text-sm text-muted-foreground">GH₵{item.variant.price.toFixed(2)} each</p>
                        </div>
                    </li>
                    ))}
                </ul>
            </CardContent>
           </Card>

            {order.orderNotes && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{order.orderNotes}</p>
                </CardContent>
              </Card>
            )}
           
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck /> Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.deliveryMethod === 'delivery' && (
                            <div>
                                <h4 className="font-semibold">Shipping Address</h4>
                                <address className="not-italic text-muted-foreground">
                                    {order.shippingAddress.fullName}<br />
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                    {order.shippingAddress.country}
                                </address>
                            </div>
                        )}
                        <div>
                             <h4 className="font-semibold">Payment Method</h4>
                             <p className="text-muted-foreground">{getPaymentMethodName(order.paymentMethod)}</p>
                        </div>
                         <div className="md:col-span-2">
                             <h4 className="font-semibold">Delivery Method</h4>
                             <div className="flex items-center gap-2 text-muted-foreground">
                                {order.deliveryMethod === 'delivery' ? <Truck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                                <span>{getDeliveryMethodName(order.deliveryMethod)}</span>
                             </div>
                        </div>
                        {order.trackingNumber && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold">Tracking</h4>
                            <p className="text-muted-foreground">
                              {order.carrier ? `${order.carrier}: ` : ''}{order.trackingNumber}
                            </p>
                            {order.trackingUrl && (
                              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                                Track Package
                              </a>
                            )}
                          </div>
                        )}
                    </div>
                </CardContent>
           </Card>
           
           {order.status !== 'Cancelled' && order.status !== 'Refunded' && !order.refundRequested && (
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2"><RotateCw /> Need to Return?</CardTitle>
                 <CardDescription>If something isn't right, you can request a return within 30 days of delivery.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <Label htmlFor="returnReason">Reason for Return</Label>
                   <Textarea
                     id="returnReason"
                     placeholder="Tell us what went wrong..."
                     value={returnReason}
                     onChange={(e) => setReturnReason(e.target.value)}
                   />
                   <Button onClick={handleRequestReturn} disabled={isRequestingReturn || !returnReason.trim()}>
                     {isRequestingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Submit Return Request
                   </Button>
                 </div>
               </CardContent>
             </Card>
           )}
           {order.refundRequested && (
             <Card>
               <CardContent className="p-4">
                 <p className="text-sm text-amber-600 flex items-center gap-2">
                   <RotateCw className="h-4 w-4" />
                   A return request has been submitted for this order. We will review it shortly.
                 </p>
               </CardContent>
             </Card>
           )}

        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>GH₵{order.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Tax</span>
                        <span>GH₵{order.tax.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>GH₵{order.shippingFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>GH₵{order.total.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                     <Button asChild className="w-full">
                        <Link href="/">Continue Shopping</Link>
                     </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/orders/${order.id}/invoice`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Invoice
                        </Link>
                     </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
