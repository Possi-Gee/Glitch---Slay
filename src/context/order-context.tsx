
'use client';

import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem } from './cart-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "possigee96@gmail.com").split(",");

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';

export type ShippingAddress = {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
};

export type Order = {
    id: string;
    userId: string; 
    orderId: string;
    customerEmail: string;
    date: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    shippingFee: number;
    total: number;
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    deliveryMethod: 'delivery' | 'pickup';
    status: OrderStatus;
    orderNotes?: string;
    appName?: string;
    transactionRef?: string;
    refundRequested?: boolean;
    refundReason?: string;
    refundNote?: string;
    couponCode?: string;
    discount?: number;
    trackingNumber?: string;
    carrier?: string;
    trackingUrl?: string;
    vendorIds?: string[];
};


type OrderState = {
  orders: Order[];
  loading: boolean;
};

type OrderAction =
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_LOADING'; payload: boolean };


const initialState: OrderState = {
  orders: [],
  loading: true,
};

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'ADD_ORDER':
      // Prevent adding a duplicate if it already exists from a snapshot update
      if (state.orders.find(o => o.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        orders: [action.payload, ...state.orders],
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? { ...order, status: action.payload.status } : order
        ),
      };
    case 'SET_ORDERS':
        return { ...state, orders: action.payload, loading: false };
    case 'SET_LOADING':
        return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export type OrderContextType = {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
};

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { user, loading: authLoading } = useAuth(); // Use auth context to get user info

  useEffect(() => {
    if (authLoading) {
      dispatch({ type: 'SET_LOADING', payload: true });
      return;
    }

    if (!user) {
      // If no user is logged in, clear orders and stop loading.
      dispatch({ type: 'SET_ORDERS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    const ordersCol = collection(db, 'orders');
    
    // Determine if the logged-in user is an admin
    const isAdmin = ADMIN_EMAILS.includes(user.email || '');

    // Create a query based on user role.
    // Admins see all orders, sorted by date.
    // Regular users see only their own orders, sorted by date.
    const q = isAdmin 
        ? query(ordersCol)
        : query(ordersCol, where("userId", "==", user.uid));

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
            ordersData.push(doc.data() as Order);
        });
        
        // Sort client-side by date descending
        ordersData.sort((a, b) => {
            const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date);
            const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });

        dispatch({ type: 'SET_ORDERS', payload: ordersData });
    }, (_error) => {
        dispatch({ type: 'SET_LOADING', payload: false });
        const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, authLoading]);

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
};
