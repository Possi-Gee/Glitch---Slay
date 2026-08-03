'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVendorSession } from '@/hooks/use-vendor-session';
import { useVendorOrders } from '@/hooks/use-vendor-orders';
import type { Order } from '@/context/order-context';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Package, Bluetooth, BluetoothConnected } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    case 'Pending': return 'bg-yellow-500 text-white';
    case 'Shipped': return 'bg-blue-500 text-white';
    case 'Delivered': return 'bg-green-500 text-white';
    case 'Cancelled': return 'bg-red-500 text-white';
    case 'Refunded': return 'bg-purple-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export default function VendorOrdersPage() {
  const { vendor, loading: vendorLoading } = useVendorSession();
  const { orders: vendorOrders, loading: ordersLoading } = useVendorOrders(vendor?.uid);
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

  const handleMarkReady = useCallback(async (order: Order) => {
    const orderRef = doc(db, 'orders', order.id.toString());
    updateDoc(orderRef, { status: 'Shipped' }).then(async () => {
      toast({
        title: 'Order Marked as Ready',
        description: `Order #${order.id} is now ready for pickup.`,
      });

      if (printerPaired) {
        await handlePrint(order);
      }
    }).catch(() => {
      const permissionError = new FirestorePermissionError({
        path: orderRef.path,
        operation: 'update',
        requestResourceData: { status: 'Shipped' },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        title: 'Failed to Update',
        description: 'Could not update order status.',
        variant: 'destructive',
      });
    });
  }, [toast, printerPaired, handlePrint]);

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground text-sm">
              Orders containing your products
            </p>
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
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell>GH₵{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={cn(getStatusClass(order.status))}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleMarkReady(order)}
                        >
                          Mark as Ready
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(order)}
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {order.status !== 'Pending' && (
                      <span className="text-xs text-muted-foreground">
                        {order.deliveryMethod === 'pickup' ? 'Ready for Pickup' : order.status}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {vendorOrders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm mt-1">Orders containing your products will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
