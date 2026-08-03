
'use server';
/**
 * @fileOverview A Genkit tool for retrieving a user's order status.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { Order } from '@/context/order-context';

/**
 * Creates a Genkit tool to get the status of a user's most recent orders.
 * @param userId - The ID of the user whose orders are being requested.
 * @returns A Genkit tool.
 */
export const getOrderStatusTool = async (userId?: string) => ai.defineTool(
  {
    name: 'getOrderStatus',
    description: 'Get the status of the user\'s most recent orders. Only works if the user is logged in.',
    outputSchema: z.string().describe("A summary of the user's recent orders, or a message indicating they need to log in."),
  },
  async () => {
    if (!userId) {
      return "The user is not logged in. Please tell them they need to log in to check their order status.";
    }

    try {
      const ordersCol = collection(db, 'orders');
      const q = query(
        ordersCol, 
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return "The user has not placed any orders yet.";
      }
      
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        orders.push(doc.data() as Order);
      });

      // Sort client-side by date and take the 3 most recent
      orders.sort((a, b) => {
        const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date);
        const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      const recentOrders = orders.slice(0, 3);
      
      const orderSummaries = recentOrders.map(order => 
        `Order #${order.id} placed on ${new Date(order.date).toLocaleDateString()} has a status of '${order.status}'. The total was GHS ${order.total.toFixed(2)}.`
      );

      return `Here is a summary of your recent orders: ${orderSummaries.join(' ')}`;

    } catch (error) {
      console.error("Error fetching orders for tool:", error);
      return "There was an error trying to fetch the order status. Please ask the user to try again later.";
    }
  }
);
