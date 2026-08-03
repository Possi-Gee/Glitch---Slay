
'use client';

import { useReducer, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/context/order-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { RotateCw, CheckCircle, X, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

type State = {
  orders: Order[];
  loading: boolean;
};

type Action =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_ORDER'; payload: Partial<Order> & { id: string } };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_ORDERS':
      return { orders: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      };
    default:
      return state;
  }
};

const statusBadge = (order: Order) => {
  if (order.status === 'Refunded') {
    return <Badge className="bg-purple-500 text-white">Refunded</Badge>;
  }
  return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
};

export default function AdminRefundsPage() {
  const [state, dispatch] = useReducer(reducer, { orders: [], loading: true });
  const { toast } = useToast();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('refundRequested', '==', true));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push(doc.data() as Order);
      });
      // Sort client-side by date descending
      ordersData.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      dispatch({ type: 'SET_ORDERS', payload: ordersData });
    }, (_error) => {
      dispatch({ type: 'SET_LOADING', payload: false });
      const permissionError = new FirestorePermissionError({
        path: q.toString(),
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async () => {
    if (!selectedOrder) return;

    setProcessingId(selectedOrder.id);
    const orderRef = doc(db, 'orders', selectedOrder.id.toString());

    try {
      await updateDoc(orderRef, {
        status: 'Refunded',
        refundRequested: false,
      });

      dispatch({
        type: 'UPDATE_ORDER',
        payload: { id: selectedOrder.id, status: 'Refunded', refundRequested: false },
      });

      toast({
        title: 'Refund Approved',
        description: `Order #${selectedOrder.id} has been marked as Refunded.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setApproveDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;

    setProcessingId(selectedOrder.id);
    const orderRef = doc(db, 'orders', selectedOrder.id.toString());

    try {
      await updateDoc(orderRef, {
        refundRequested: false,
        refundNote: rejectNote || 'Refund request rejected by admin.',
      });

      dispatch({
        type: 'UPDATE_ORDER',
        payload: {
          id: selectedOrder.id,
          refundRequested: false,
          refundNote: rejectNote || 'Refund request rejected by admin.',
        },
      });

      toast({
        title: 'Refund Rejected',
        description: `Order #${selectedOrder.id} refund request has been rejected.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reject refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setRejectNote('');
    }
  };

  const openApproveDialog = (order: Order) => {
    setSelectedOrder(order);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (order: Order) => {
    setSelectedOrder(order);
    setRejectNote('');
    setRejectDialogOpen(true);
  };

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RotateCw className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Refunds / Returns</h1>
          <p className="text-muted-foreground">Manage customer refund and return requests.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            {state.orders.length} pending request{state.orders.length !== 1 ? 's' : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.shippingAddress?.fullName || 'Unknown'}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>GH₵{order.total.toFixed(2)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.refundReason || 'No reason provided'}
                  </TableCell>
                  <TableCell>{statusBadge(order)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApproveDialog(order)}
                        disabled={processingId === order.id}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRejectDialog(order)}
                        disabled={processingId === order.id}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {state.orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No pending refund requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the refund for order #{selectedOrder?.id}?
              This will mark the order as <strong>Refunded</strong> and notify the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedOrder?.refundReason && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <strong>Customer Reason:</strong> {selectedOrder.refundReason}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processingId !== null}>
              {processingId === selectedOrder?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the refund for order #{selectedOrder?.id}?
              You can provide a note explaining the reason for rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedOrder?.refundReason && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <strong>Customer Reason:</strong> {selectedOrder.refundReason}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="rejectNote">Admin Note (optional)</Label>
            <Textarea
              id="rejectNote"
              placeholder="Explain why the refund was rejected..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processingId !== null} className="bg-red-600 hover:bg-red-700">
              {processingId === selectedOrder?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
