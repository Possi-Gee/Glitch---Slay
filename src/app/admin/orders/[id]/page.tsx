
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/use-orders';
import type { Order, OrderStatus } from '@/context/order-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, User, MoreVertical, Store, MessageSquare, Bike, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { sendOrderUpdateEmail } from '@/ai/flows/send-order-update-email';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import Link from 'next/link';
import { MapLinkButton } from '@/components/map-link-button';


const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-500 text-white hover:bg-yellow-500/80';
    case 'Shipped': return 'bg-blue-500 text-white hover:bg-blue-500/80';
    case 'Delivered': return 'bg-green-500 text-white hover:bg-green-500/80';
    case 'Cancelled': return 'bg-red-500 text-white hover:bg-red-500/80';
    default: return 'bg-gray-500 text-white hover:bg-gray-500/80';
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

const statuses: OrderStatus[] = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];


export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { state, dispatch } = useOrders();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const { state: siteSettings } = useSiteSettings();


  const order = useMemo(() => {
    return state.orders.find((o) => o.id.toString() === id);
  }, [id, state.orders]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (order) {
        setIsUpdating(true);
        const orderRef = doc(db, 'orders', order.id.toString());
        
        updateDoc(orderRef, { status: status }).then(async () => {
            dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: order.id, status } });
            
            toast({
              title: 'Order Status Updated',
              description: `Order #${order.id} is now ${status}.`
            });
            
            // Send email notification
            const emailResult = await sendOrderUpdateEmail({
              status: status,
              recipientEmail: order.shippingAddress.email,
              customerName: order.shippingAddress.fullName,
              appName: siteSettings.appName,
              orderId: order.id.toString(),
              deliveryMethod: order.deliveryMethod,
              paymentMethod: order.paymentMethod,
              total: order.total,
              items: order.items,
            });

            if (emailResult.success) {
                toast({
                    title: 'Email Sent',
                    description: emailResult.message,
                });
            } else {
                 toast({
                    title: 'Email Failed',
                    description: emailResult.message,
                    variant: 'destructive',
                });
            }
        }).catch(_serverError => {
            const permissionError = new FirestorePermissionError({
                path: orderRef.path,
                operation: 'update',
                requestResourceData: { status: status }
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsUpdating(false);
        });
    }
  };
  
  const handleUpdateAdminLocation = () => {
    if (!order) return;

    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const orderRef = doc(db, 'orders', order.id.toString());
      await updateDoc(orderRef, { adminLocation: { lat: latitude, lng: longitude } });
      toast({ title: 'Location Updated', description: 'Your current location saved to order.' });
    }, (error) => {
      console.error(error);
      toast({ title: 'Failed to get location', variant: 'destructive' });
    });
  };

  const handleBookDelivery = () => {
    window.open('https://delivery.yango.com/', '_blank', 'noopener,noreferrer');
  };


  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground mt-2">The order you are looking for does not exist.</p>
        <Button onClick={() => router.push('/admin/orders')} className="mt-6">
          Back to Orders List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="mr-2" /> Back to Orders
        </Button>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleUpdateAdminLocation}>
                Update My Location
            </Button>
            <Button asChild variant="outline">
                <Link href={`/admin/orders/${order.id}/packing-slip`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Packing Slip
                </Link>
            </Button>
            {order.deliveryMethod === 'delivery' && (
                <Button variant="default" onClick={handleBookDelivery}>
                    <Bike className="mr-2"/>
                    Book Delivery
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status <MoreVertical className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {statuses.map(status => (
                        <DropdownMenuItem 
                            key={status} 
                            onClick={() => handleStatusChange(status)}
                            disabled={order.status === status || isUpdating}
                        >
                            Mark as {order.deliveryMethod === 'pickup' && status === 'Shipped' ? 'Ready for Pickup' : status}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

       <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                     <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
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
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package/> Ordered Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)})</CardTitle>
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
                 <Separator className="my-4"/>
                 <div className="space-y-2 text-right">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>GH₵{order.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tax:</span> <span>GH₵{order.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Shipping:</span> <span>GH₵{order.shippingFee.toFixed(2)}</span></div>
                    <Separator/>
                    <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span>GH₵{order.total.toFixed(2)}</span></div>
                 </div>
            </CardContent>
           </Card>
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Truck /> Tracking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tracking Number</label>
                    <input
                      className="w-full mt-1 h-9 px-3 text-sm border border-border/80 bg-background rounded-none"
                      placeholder="e.g., 1Z999AA10123456784"
                      defaultValue={order.trackingNumber || ''}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        const orderRef = doc(db, 'orders', order.id.toString());
                        await updateDoc(orderRef, { trackingNumber: val || '' });
                        if (val) toast({ title: 'Tracking number saved' });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Carrier</label>
                    <input
                      className="w-full mt-1 h-9 px-3 text-sm border border-border/80 bg-background rounded-none"
                      placeholder="e.g., UPS, FedEx, DHL"
                      defaultValue={order.carrier || ''}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        const orderRef = doc(db, 'orders', order.id.toString());
                        await updateDoc(orderRef, { carrier: val || '' });
                        if (val) toast({ title: 'Carrier saved' });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tracking URL</label>
                    <input
                      className="w-full mt-1 h-9 px-3 text-sm border border-border/80 bg-background rounded-none"
                      placeholder="https://..."
                      defaultValue={order.trackingUrl || ''}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        const orderRef = doc(db, 'orders', order.id.toString());
                        await updateDoc(orderRef, { trackingUrl: val || '' });
                        if (val) toast({ title: 'Tracking URL saved' });
                      }}
                    />
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-3 text-sm text-green-600">
                    Tracking: {order.carrier ? `${order.carrier} — ` : ''}{order.trackingNumber}
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">Track Package</a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {order.orderNotes && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><MessageSquare /> Customer Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{order.orderNotes}</p>
                  </CardContent>
              </Card>
            )}
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {order.deliveryMethod === 'delivery' ? (
                        <>
                            <h4 className="font-semibold">Shipping Address</h4>
                            <address className="not-italic text-muted-foreground">
                                {order.shippingAddress.fullName}<br />
                                {order.shippingAddress.address}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                {order.shippingAddress.country}
                            </address>
                        </>
                    ) : (
                        <div>
                            <h4 className="font-semibold">Customer</h4>
                            <p className="text-muted-foreground">This order is for in-store pickup.</p>
                        </div>
                    )}
                     <Separator className="my-4" />
                      <h4 className="font-semibold">Contact Email</h4>
                      <p className="text-muted-foreground">{order.shippingAddress.email}</p>
                     <Separator className="my-4" />
                      <h4 className="font-semibold">Payment Information</h4>
                     <p className="text-muted-foreground">Method: {getPaymentMethodName(order.paymentMethod)}</p>
                     <Separator className="my-4" />
                      <h4 className="font-semibold">Delivery Method</h4>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {order.deliveryMethod === 'delivery' ? <Truck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                        <span>{getDeliveryMethodName(order.deliveryMethod)}</span>
                      </div>
                      {order.deliveryCoords && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-1">Customer Location:</p>
                          <MapLinkButton lat={order.deliveryCoords.lat} lng={order.deliveryCoords.lng} />
                        </div>
                      )}


                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
