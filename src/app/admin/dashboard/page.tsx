'use client';

import { useMemo } from 'react';
import { useOrders } from '@/hooks/use-orders';
import type { Order } from '@/context/order-context';
import { useProduct } from '@/hooks/use-product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Landmark, Package, ShoppingCart, Clock, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-500 text-white hover:bg-yellow-500/80';
    case 'Shipped': return 'bg-blue-500 text-white hover:bg-blue-500/80';
    case 'Delivered': return 'bg-green-500 text-white hover:bg-green-500/80';
    case 'Cancelled': return 'bg-red-500 text-white hover:bg-red-500/80';
    default: return 'bg-gray-500 text-white hover:bg-gray-500/80';
  }
};

const STATUS_CONFIG = [
  { status: 'Pending', color: 'bg-yellow-500' },
  { status: 'Shipped', color: 'bg-blue-500' },
  { status: 'Delivered', color: 'bg-green-500' },
  { status: 'Cancelled', color: 'bg-red-500' },
  { status: 'Refunded', color: 'bg-purple-500' },
] as const;

export default function AdminDashboardPage() {
  const { state: orderState } = useOrders();
  const { state: productState } = useProduct();
  const router = useRouter();

  const totalRevenue = useMemo(
    () => orderState.orders.reduce((sum, order) => sum + order.total, 0),
    [orderState.orders]
  );
  const totalSales = orderState.orders.length;
  const totalProducts = productState.products.length;
  const pendingOrders = useMemo(
    () => orderState.orders.filter(order => order.status === 'Pending').length,
    [orderState.orders]
  );

  const recentOrders = useMemo(
    () => [...orderState.orders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [orderState.orders]
  );

  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; revenue: number; isCurrent: boolean }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const isCurrent = i === 0;

      const revenue = orderState.orders
        .filter(order => {
          const orderDate = new Date(order.date);
          return (
            orderDate.getMonth() === d.getMonth() &&
            orderDate.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, order) => sum + order.total, 0);

      months.push({ label, revenue, isCurrent });
    }

    return months;
  }, [orderState.orders]);

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 1);

  const topSellingProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; totalQuantity: number; totalRevenue: number }>();

    orderState.orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.name) || {
          name: item.name,
          totalQuantity: 0,
          totalRevenue: 0,
        };
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.quantity * item.variant.price;
        productMap.set(item.name, existing);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  }, [orderState.orders]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    STATUS_CONFIG.forEach(({ status }) => counts.set(status, 0));
    orderState.orders.forEach(order => {
      counts.set(order.status, (counts.get(order.status) || 0) + 1);
    });
    return STATUS_CONFIG.map(({ status, color }) => ({
      status,
      count: counts.get(status) || 0,
      color,
    }));
  }, [orderState.orders]);

  const maxStatusCount = Math.max(...statusCounts.map(s => s.count), 1);

  const stats = [
    { title: 'Total Revenue', value: `GH₵${totalRevenue.toFixed(2)}`, icon: Landmark },
    { title: 'Total Sales', value: totalSales, icon: ShoppingCart },
    { title: 'Total Products', value: totalProducts, icon: Package },
    { title: 'Pending Orders', value: pendingOrders, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">A quick overview of your store&apos;s performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(() => {
        const lowStock = productState.products.filter(p =>
          p.variants.some(v => v.stock > 0 && v.stock <= 10)
        );
        if (lowStock.length === 0) return null;
        return (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <CardTitle className="text-amber-800 dark:text-amber-400">Low Stock Alert</CardTitle>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">{lowStock.length} product(s) running low on stock.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-amber-200 dark:border-amber-900/30 hover:bg-transparent">
                    <TableHead className="text-amber-800 dark:text-amber-400 font-semibold">Product</TableHead>
                    <TableHead className="text-amber-800 dark:text-amber-400 font-semibold">Variant</TableHead>
                    <TableHead className="text-right text-amber-800 dark:text-amber-400 font-semibold">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.slice(0, 10).map(p => {
                    const lowVariant = p.variants.find(v => v.stock > 0 && v.stock <= 10);
                    return (
                      <TableRow key={p.id} className="border-amber-200 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/30">
                        <TableCell className="font-medium text-sm text-amber-950 dark:text-amber-50">{p.name}</TableCell>
                        <TableCell className="text-sm text-amber-800 dark:text-amber-300">{lowVariant?.name || '—'}</TableCell>
                        <TableCell className="text-right text-sm font-bold text-amber-700 dark:text-amber-400">{lowVariant?.stock || 0}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Revenue Over Time</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Monthly revenue for the last 6 months.</p>
          </CardHeader>
          <CardContent>
            {revenueByMonth.every(m => m.revenue === 0) ? (
              <div className="text-center py-12 text-muted-foreground">No revenue data yet.</div>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {revenueByMonth.map((month) => (
                  <div key={month.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-xs text-muted-foreground">
                      GH₵{month.revenue.toFixed(0)}
                    </span>
                    <div
                      className={cn(
                        'w-full rounded-t transition-all duration-500',
                        month.isCurrent ? 'bg-primary' : 'bg-primary/60'
                      )}
                      style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                    />
                    <span className={cn('text-xs', month.isCurrent ? 'font-bold' : 'text-muted-foreground')}>
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Top Selling Products</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Top 5 products by quantity sold.</p>
          </CardHeader>
          <CardContent className="p-0">
            {topSellingProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No sales data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Total Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingProducts.map((product, i) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                          {product.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{product.totalQuantity}</TableCell>
                      <TableCell className="text-right">GH₵{product.totalRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Orders by Status</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Visual breakdown of order statuses.</p>
        </CardHeader>
        <CardContent>
          {orderState.orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders yet.</div>
          ) : (
            <div className="space-y-5">
              {statusCounts.map(({ status, count, color }) => (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-white', color)}>{status}</Badge>
                    </div>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground">The last 5 orders placed on your store.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>GH₵{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={cn(getStatusClass(order.status))}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {recentOrders.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">No recent orders.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
