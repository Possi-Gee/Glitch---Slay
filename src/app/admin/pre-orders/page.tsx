'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { PreOrder } from '@/types/pre-order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Search, RotateCw, ClipboardList, Mail, User, MapPin, FileText, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

const orderStatuses: PreOrder['orderStatus'][] = ['PENDING', 'CONFIRMED', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const paymentStatuses: PreOrder['paymentStatus'][] = ['PENDING', 'PAID', 'REFUNDED'];

const getPreOrderStatusClass = (status: PreOrder['orderStatus']) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-500 text-white';
    case 'CONFIRMED': return 'bg-blue-500 text-white';
    case 'READY_TO_SHIP': return 'bg-indigo-500 text-white';
    case 'SHIPPED': return 'bg-green-500 text-white';
    case 'DELIVERED': return 'bg-green-700 text-white';
    case 'CANCELLED': return 'bg-red-500 text-white';
    default: return 'bg-gray-500 text-white';
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

export default function AdminPreOrdersPage() {
  const { toast } = useToast();
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Detail Modal state
  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);

  // Subscribe to all pre-orders
  useEffect(() => {
    setLoading(true);
    const preOrdersCol = collection(db, 'preOrders');

    const unsubscribe = onSnapshot(preOrdersCol, (snapshot) => {
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
      setLoading(false);
    }, (error) => {
      console.error("Error loading pre-orders:", error);
      setLoading(false);
      toast({
        title: "Load Failed",
        description: "You do not have permission to view pre-orders.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleOrderStatusChange = async (preOrderId: string, status: PreOrder['orderStatus']) => {
    const preOrderRef = doc(db, 'preOrders', preOrderId);
    try {
      await updateDoc(preOrderRef, {
        orderStatus: status,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Status Updated',
        description: `Pre-order status marked as ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update status.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentStatusChange = async (preOrderId: string, status: PreOrder['paymentStatus']) => {
    const preOrderRef = doc(db, 'preOrders', preOrderId);
    const preOrder = preOrders.find(p => p.id === preOrderId);
    if (!preOrder) return;

    try {
      const updateData: Partial<PreOrder> = {
        paymentStatus: status,
        updatedAt: new Date().toISOString(),
      };
      
      // If marking as fully PAID, clear balanceRemaining and adjust amountPaid
      if (status === 'PAID') {
        updateData.amountPaid = preOrder.totalPrice;
        updateData.balanceRemaining = 0;
      }
      
      await updateDoc(preOrderRef, updateData);
      toast({
        title: 'Payment Updated',
        description: `Pre-order payment marked as ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update payment status.',
        variant: 'destructive',
      });
    }
  };

  const getDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };

  // Filtered and searched pre-orders list
  const filteredPreOrders = preOrders.filter(preOrder => {
    const term = searchTerm.toLowerCase();
    const customerName = preOrder.shippingAddress?.fullName?.toLowerCase() || '';
    const customerEmail = preOrder.shippingAddress?.email?.toLowerCase() || preOrder.userId?.toLowerCase() || '';
    const productName = preOrder.productName?.toLowerCase() || '';
    const matchesSearch = customerName.includes(term) || customerEmail.includes(term) || productName.includes(term) || preOrder.id.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || preOrder.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || preOrder.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Pre-Orders</h1>
            <p className="text-muted-foreground">Manage upcoming product reservation orders.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Reservations</CardTitle>
          <CardDescription>Filter, track, and update all customer pre-orders.</CardDescription>
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customer, email, product, or ID..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Order Statuses</SelectItem>
                {orderStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Statuses</SelectItem>
                {paymentStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pre-Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reserved Date</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <RotateCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading pre-orders...
                  </TableCell>
                </TableRow>
              ) : filteredPreOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No pre-orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPreOrders.map((preOrder) => (
                  <TableRow 
                    key={preOrder.id} 
                    className="cursor-pointer" 
                    onClick={() => setSelectedPreOrder(preOrder)}
                  >
                    <TableCell className="font-medium">#{preOrder.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{preOrder.shippingAddress?.fullName || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">{preOrder.shippingAddress?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{preOrder.productName}</div>
                        <div className="text-xs text-muted-foreground">{preOrder.variant?.name} (Qty: {preOrder.quantity})</div>
                      </div>
                    </TableCell>
                    <TableCell>{getDate(preOrder.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>GH₵{preOrder.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-sm">GH₵{preOrder.amountPaid.toFixed(2)}</div>
                        {preOrder.balanceRemaining > 0 && (
                          <div className="text-xs text-amber-600 font-semibold">Bal: GH₵{preOrder.balanceRemaining.toFixed(2)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(getPreOrderStatusClass(preOrder.orderStatus))}>
                        {preOrder.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(getPreOrderPaymentStatusClass(preOrder.paymentStatus, preOrder.balanceRemaining))}>
                        {getPreOrderPaymentLabel(preOrder.paymentStatus, preOrder.balanceRemaining)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedPreOrder(preOrder)}>View Details</DropdownMenuItem>
                          
                          {/* Order Status updates */}
                          <div className="border-t my-1" />
                          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">Order Status</div>
                          {orderStatuses.map(status => (
                            <DropdownMenuItem 
                              key={status} 
                              onClick={() => handleOrderStatusChange(preOrder.id, status)}
                              disabled={preOrder.orderStatus === status}
                            >
                              Mark as {status}
                            </DropdownMenuItem>
                          ))}

                          {/* Payment status updates */}
                          <div className="border-t my-1" />
                          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">Payment Status</div>
                          {paymentStatuses.map(status => (
                            <DropdownMenuItem 
                              key={status} 
                              onClick={() => handlePaymentStatusChange(preOrder.id, status)}
                              disabled={preOrder.paymentStatus === status}
                            >
                              Mark as {status === 'PAID' ? 'Fully Paid' : status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedPreOrder} onOpenChange={(open) => !open && setSelectedPreOrder(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto text-foreground">
          {selectedPreOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Pre-Order Details: #{selectedPreOrder.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                
                {/* Product details */}
                <div className="flex gap-4 items-center bg-muted/30 p-3 rounded-md">
                  {selectedPreOrder.productImage ? (
                    <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0 border">
                      <NextImage
                        src={selectedPreOrder.productImage}
                        alt={selectedPreOrder.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted border flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-base">{selectedPreOrder.productName}</h4>
                    <p className="text-sm text-muted-foreground">Option: {selectedPreOrder.variant?.name} | Qty: {selectedPreOrder.quantity}</p>
                    <p className="text-xs text-muted-foreground">Variant ID: {selectedPreOrder.variant?.id}</p>
                  </div>
                </div>

                {/* Customer / Shipping Details */}
                <div className="grid grid-cols-2 gap-4 border-t pt-3">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer
                    </h4>
                    <p className="text-sm font-semibold">{selectedPreOrder.shippingAddress?.fullName || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {selectedPreOrder.shippingAddress?.email || 'No Email'}
                    </p>
                    <p className="text-xs text-muted-foreground">User ID: {selectedPreOrder.userId}</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Shipping / Delivery
                    </h4>
                    <p className="text-sm font-semibold capitalize">{selectedPreOrder.deliveryMethod} Method</p>
                    {selectedPreOrder.deliveryMethod === 'delivery' ? (
                      <p className="text-xs text-muted-foreground leading-normal">
                        {selectedPreOrder.shippingAddress?.address}<br />
                        {selectedPreOrder.shippingAddress?.city}, {selectedPreOrder.shippingAddress?.state} {selectedPreOrder.shippingAddress?.zip}<br />
                        {selectedPreOrder.shippingAddress?.country}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">In-store pickup selected</p>
                    )}
                  </div>
                </div>

                {/* Transaction / Notes */}
                <div className="grid grid-cols-2 gap-4 border-t pt-3">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Paystack Reference
                    </h4>
                    <p className="text-xs font-mono select-all bg-muted/50 p-1.5 rounded truncate" title={selectedPreOrder.transactionRef}>
                      Ref: {selectedPreOrder.transactionRef || 'N/A'}
                    </p>
                    {selectedPreOrder.balanceTransactionRef && (
                      <p className="text-xs font-mono select-all bg-muted/50 p-1.5 rounded truncate" title={selectedPreOrder.balanceTransactionRef}>
                        Bal Ref: {selectedPreOrder.balanceTransactionRef}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Order Notes
                    </h4>
                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-1.5 rounded max-h-16 overflow-y-auto">
                      {selectedPreOrder.orderNotes || 'No notes added'}
                    </p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t pt-3 bg-muted/10 p-3 rounded-md space-y-2">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">Financial Details</h4>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-right font-medium">GH₵{selectedPreOrder.subtotal?.toFixed(2) || '0.00'}</span>
                    <span className="text-muted-foreground">Estimated Tax:</span>
                    <span className="text-right font-medium">GH₵{selectedPreOrder.tax?.toFixed(2) || '0.00'}</span>
                    <span className="text-muted-foreground">Shipping Fee:</span>
                    <span className="text-right font-medium">GH₵{selectedPreOrder.shippingFee?.toFixed(2) || '0.00'}</span>
                    <span className="text-muted-foreground font-bold border-t pt-1 mt-1">Total Value:</span>
                    <span className="text-right font-bold border-t pt-1 mt-1">GH₵{selectedPreOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                    
                    <span className="text-primary font-bold border-t pt-1 mt-1">Amount Paid:</span>
                    <span className="text-right text-primary font-bold border-t pt-1 mt-1">GH₵{selectedPreOrder.amountPaid?.toFixed(2) || '0.00'}</span>
                    {selectedPreOrder.balanceRemaining > 0 && (
                      <>
                        <span className="text-amber-600 font-semibold">Remaining Balance:</span>
                        <span className="text-right text-amber-600 font-semibold">GH₵{selectedPreOrder.balanceRemaining?.toFixed(2) || '0.00'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
