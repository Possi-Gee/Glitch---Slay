import { ShippingAddress } from '@/context/order-context';

export interface PreOrder {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variant: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalPrice: number;
  amountPaid: number;
  balanceRemaining: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: ShippingAddress;
  deliveryMethod: 'delivery' | 'pickup';
  orderNotes?: string;
  transactionRef?: string;
  balanceTransactionRef?: string;
  createdAt: any;
  updatedAt: any;
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
