
'use client';
import { useContext } from 'react';
import { OrderContext, type OrderContextType } from '@/context/order-context';
export type { Order, OrderStatus } from '@/context/order-context';

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
