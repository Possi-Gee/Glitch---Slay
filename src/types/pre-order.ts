export interface PreOrder {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  amountPaid: number;
  balanceRemaining?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPreOrderSettings {
  isPreOrder: boolean;
  releaseDate?: Date;
  shippingDate?: Date;
  preOrderLimit?: number;
  depositEnabled: boolean;
  depositAmount: number;
  expectedDelivery?: string;
  allowCancellation: boolean;
  preOrderMessage?: string;
}
