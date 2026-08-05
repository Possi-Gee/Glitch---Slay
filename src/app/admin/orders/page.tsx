
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrders } from '@/hooks/use-orders';
import type { Order, OrderStatus } from '@/context/order-context';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ShoppingCart, Bluetooth, BluetoothConnected } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendOrderUpdateEmail } from '@/ai/flows/send-order-update-email';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import {
  isWebBluetoothAvailable,
  isPrinterPaired,
  pairPrinter,
  printInvoice,
  clearPrinterInfo,
} from '@/lib/bluetooth-print';


const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-500 text-white hover:bg-yellow-500/80';
    case 'Shipped': return 'bg-blue-500 text-white hover:bg-blue-500/80';
    case 'Delivered': return 'bg-green-500 text-white hover:bg-green-500/80';
    case 'Cancelled': return 'bg-red-500 text-white hover:bg-red-500/80';
    case 'Refunded': return 'bg-purple-500 text-white hover:bg-purple-500/80';
    default: return 'bg-gray-500 text-white hover:bg-gray-500/80';
  }
};

const statuses: OrderStatus[] = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

export default function AdminOrdersPage() {
  const { state, dispatch } = useOrders();
  const { orders } = state;
  const router = useRouter();
  const { toast } = useToast();
  const { state: siteSettings } = useSiteSettings();
  const [printerPaired, setPrinterPaired] = useState(false);
  const [printerConnecting, setPrinterConnecting] = useState(false);

  useEffect(() => {
    setPrinterPaired(isPrinterPaired());
  }, []);

  const handlePairPrinter = useCallback(async () => {
    if (!isWebBluetoothAvailable()) {
      toast({
        title: 'Bluetooth Not Available',
        description: 'Web Bluetooth is only supported in Chrome on desktop or Android.',
        variant: 'destructive',
      });
      return;
    }
    setPrinterConnecting(true);
    try {
      const info = await pairPrinter();
      setPrinterPaired(true);
      toast({
        title: 'Printer Connected',
        description: `Connected to ${info.name}`,
      });
    } catch (e: any) {
      toast({
        title: 'Connection Failed',
        description: e.message || 'Could not connect to printer.',
        variant: 'destructive',
      });
    } finally {
      setPrinterConnecting(false);
    }
  }, [toast]);

  const handlePrint = useCallback(async (order: Order) => {
    try {
      await printInvoice({
        id: order.id,
        date: order.date,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingFee: order.shippingFee,
        total: order.total,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        appName: siteSettings.appName,
      });
      toast({
        title: 'Invoice Printed',
        description: `Invoice for Order #${order.id} sent to printer.`,
      });
    } catch (e: any) {
      if (e.message === 'no-printer-paired') {
        toast({
          title: 'No Printer Connected',
          description: 'Connect a Bluetooth printer first.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Print Failed',
          description: e.message || 'Could not print invoice.',
          variant: 'destructive',
        });
      }
    }
  }, [siteSettings.appName, toast]);

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', order.id.toString());
    updateDoc(orderRef, { status: status }).then(async () => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: order.id, status } });

        toast({
          title: 'Order Status Updated',
          description: `Order #${order.id} is now ${status}.`
        });
        
        // Send email notification
        const emailResult = await sendOrderUpdateEmail({
          orderId: order.id.toString(),
          status: status,
          recipientEmail: order.shippingAddress.email,
          customerName: order.shippingAddress.fullName,
          appName: siteSettings.appName,
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
    });
  };
  
  const handleViewOrder = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          <div>
             <h1 className="text-3xl font-bold">Orders</h1>
             <p className="text-muted-foreground">Manage and track all customer orders.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {printerPaired ? (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <BluetoothConnected className="h-3.5 w-3.5" />
              Printer Connected
              <button
                onClick={() => { clearPrinterInfo(); setPrinterPaired(false); }}
                className="text-muted-foreground hover:text-destructive ml-1"
              >
                ×
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePairPrinter}
              disabled={printerConnecting}
            >
              {printerConnecting ? (
                <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full mr-2" />
              ) : (
                <Bluetooth className="h-4 w-4 mr-2" />
              )}
              Connect Bluetooth Printer
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => handleViewOrder(order.id)}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>GH₵{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                     <Badge className={cn(getStatusClass(order.status))}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(order)}>Print Invoice</DropdownMenuItem>
                        {statuses.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onClick={() => handleStatusChange(order, status)}
                                disabled={order.status === status}
                            >
                                Mark as {order.deliveryMethod === 'pickup' && status === 'Shipped' ? 'Ready for Pickup' : status}
                            </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         {orders.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">No orders found.</div>
        )}
      </Card>
    </div>
  );
}
