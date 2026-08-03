export type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  usedBy: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};
