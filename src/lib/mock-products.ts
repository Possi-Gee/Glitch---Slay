import type { Product } from '@/lib/products';

export const MOCKUP_BEST_SELLERS: Product[] = [
  {
    id: "mock-1",
    name: "Black Luxe Shoulder Bag",
    description: "A premium quilted black leather shoulder bag with gold chain strap, representing timeless elegance.",
    category: "Bags and phone covers",
    price: 280.00,
    rating: 4.9,
    reviews: 142,
    images: ["/prod-bag.png"],
    dataAiHint: "shoulder bag",
    variants: [{ id: "v1", name: "Standard", price: 280.00, stock: 12 }]
  },
  {
    id: "mock-2",
    name: "Oversized Graphic Tee",
    description: "A trendy oversized white graphic tee made of premium thick organic cotton.",
    category: "Customization",
    price: 120.00,
    rating: 4.7,
    reviews: 95,
    images: ["/prod-tee.png"],
    dataAiHint: "graphic tee",
    variants: [{ id: "v2", name: "Standard", price: 120.00, stock: 25 }]
  },
  {
    id: "mock-3",
    name: "Gold Layered Necklace",
    description: "A beautiful three-tier layered gold chain necklace that adds elegance to any look.",
    category: "Accessories",
    price: 80.00,
    rating: 4.8,
    reviews: 64,
    images: ["/prod-necklace.png"],
    dataAiHint: "necklace",
    variants: [{ id: "v3", name: "Standard", price: 80.00, stock: 18 }]
  },
  {
    id: "mock-4",
    name: "Denim Cargo Jeans",
    description: "Relaxed-fit denim cargo jeans featuring functional utility pockets and raw hem details.",
    category: "Customization",
    price: 200.00,
    rating: 4.6,
    reviews: 110,
    images: ["/prod-jeans.png"],
    dataAiHint: "cargo jeans",
    variants: [{ id: "v4", name: "Standard", price: 200.00, stock: 15 }]
  }
];
