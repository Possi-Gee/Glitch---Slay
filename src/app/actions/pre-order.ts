"use server";

import { createPreOrder } from "@/lib/firebase/pre-orders";
import { PreOrder } from "@/types/pre-order";
import { revalidatePath } from "next/cache";

export async function placePreOrder(data: Omit<PreOrder, 'id' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'paymentStatus'>) {
  try {
    // 1. Add validation (e.g., check product stock/limits here if needed)
    
    // 2. Prepare order object
    const newOrder: Omit<PreOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
    };

    // 3. Save to Firestore
    const orderId = await createPreOrder(newOrder);

    // 4. Trigger Email (to be implemented later)

    revalidatePath("/dashboard/orders");
    return { success: true, orderId };
  } catch (error: any) {
    console.error("Failed to place pre-order:", error);
    return { success: false, error: error.message || "Failed to place pre-order" };
  }
}
