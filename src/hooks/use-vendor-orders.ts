'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/context/order-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export function useVendorOrders(vendorId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersCol = collection(db, 'orders');
    const q = query(
      ordersCol,
      where('vendorIds', 'array-contains', vendorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Order);
      });
      // Sort client-side by date descending
      list.sort((a, b) => {
        const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date);
        const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setOrders(list);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [vendorId]);

  return { orders, loading };
}
