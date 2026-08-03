
'use client';

import { useOrders } from '@/hooks/use-orders';
import type { Order } from '@/context/order-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { History, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function MyOrdersPage() {
  const { state } = useOrders();
  const { orders } = state;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-8 w-8" />
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>

      {orders.length === 0 ? (
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
      )}
    </div>
  );
}
