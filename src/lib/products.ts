
export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
};


export type VendorInfo = {
  vendorId: string;
  storeName: string;
  verified: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  rating: number;
  reviews: number;
  isOfficialStore?: boolean;
  vendor?: VendorInfo;
  dataAiHint: string;
  variants: ProductVariant[];
  features?: string;
  price?: number;
  // Pre-Order Fields
  isPreOrder?: boolean;
  releaseDate?: string; // Using string as dates from firestore are often serialized
  shippingDate?: string;
  preOrderLimit?: number;
  depositEnabled?: boolean;
  depositAmount?: number;
  expectedDelivery?: string;
  allowCancellation?: boolean;
  preOrderMessage?: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: 'Moisturizing Body Lotion',
    description: 'A rich and creamy body lotion that provides 24-hour hydration for dry skin.',
    category: 'Cosmetics',
    images: ['https://picsum.photos/600/600?random=1', 'https://picsum.photos/600/600?random=11', 'https://picsum.photos/600/600?random=21'],
    rating: 4.8,
    reviews: 210,
    isOfficialStore: true,
    dataAiHint: 'lotion bottle',
    variants: [
      { id: "1", name: '400ml', price: 8.99, stock: 150 },
    ]
  },
  {
    id: "2",
    name: 'Bubu Gown',
    description: 'Elegant and flowing Bubu gown, perfect for any special occasion.',
    category: 'Bubu',
    images: ['https://picsum.photos/600/600?random=2'],
    rating: 4.9,
    reviews: 350,
    isOfficialStore: true,
    dataAiHint: 'african dress',
     variants: [
      { id: "2", name: 'One Size', price: 120.99, originalPrice: 150.00, stock: 20 },
    ]
  },
  {
    id: "3",
    name: 'Antibacterial Hand Soap',
    description: 'Gentle foaming hand soap that kills 99.9% of germs without drying your skin.',
    category: 'Cosmetics',
    images: ['https://picsum.photos/600/600?random=3'],
    rating: 4.7,
    reviews: 180,
    dataAiHint: 'soap dispenser',
    variants: [
       { id: "3", name: '250ml', price: 3.50, stock: 300 },
    ]
  },
  {
    id: "4",
    name: 'Non-stick Frying Pan',
    description: 'A durable non-stick frying pan, essential for every modern kitchen.',
    category: 'kitchen ware, and utensils',
    images: ['https://picsum.photos/600/600?random=4'],
    rating: 4.6,
    reviews: 155,
    isOfficialStore: true,
    dataAiHint: 'frying pan',
    variants: [
       { id: "4", name: '10-inch', price: 25.99, stock: 120 },
    ]
  },
  {
    id: "5",
    name: 'Sewing Thread Kit',
    description: 'A complete kit of colorful sewing threads for all your tailoring needs.',
    category: 'Sewing accessories',
    images: ['https://picsum.photos/600/600?random=5'],
    rating: 4.8,
    reviews: 250,
    dataAiHint: 'sewing kit',
    variants: [
      { id: "5", name: '50-piece set', price: 15.49, stock: 180 },
    ]
  },
  {
    id: "6",
    name: 'Egyptian Cotton Bedsheets',
    description: 'Luxurious and soft bedsheets made from 100% Egyptian cotton for a comfortable night\'s sleep.',
    category: 'Bedsheets',
    images: ['https://picsum.photos/600/600?random=6'],
    rating: 4.9,
    reviews: 190,
    dataAiHint: 'bed sheets',
     variants: [
       { id: "8", name: 'Queen Size', price: 80.99, stock: 90 },
    ]
  },
  {
    id: "7",
    name: 'Leather Slippers',
    description: 'Comfortable and stylish handmade leather slippers for indoor and outdoor wear.',
    category: 'Slippers and shoes',
    images: ['https://picsum.photos/600/600?random=7'],
    rating: 4.7,
    reviews: 220,
    isOfficialStore: true,
    dataAiHint: 'leather slippers',
     variants: [
      { id: "9", name: 'Size 42', price: 35.99, originalPrice: 45.00, stock: 80 },
    ]
  },
  {
    id: "8",
    name: 'Kids T-Shirt',
    description: 'A fun and colorful t-shirt for kids, made from soft, breathable cotton.',
    category: 'Kids wear',
    images: ['https://picsum.photos/600/600?random=8'],
    rating: 4.4,
    reviews: 130,
    dataAiHint: 'kids clothing',
     variants: [
      { id: "10", name: 'Age 5-6', price: 12.50, stock: 250 },
    ]
  },
  {
    id: "9",
    name: 'Silk Fabric',
    description: 'High-quality silk fabric, perfect for creating elegant dresses and blouses.',
    category: 'Fabrics',
    images: ['https://picsum.photos/600/600?random=9'],
    rating: 4.6,
    reviews: 170,
    dataAiHint: 'fabric roll',
     variants: [
       { id: "11", name: 'Per Yard', price: 22.29, stock: 200 },
    ]
  },
  {
    id: "10",
    name: 'Kente African Print',
    description: 'Vibrant and traditional Kente cloth, an authentic African print for all occasions.',
    category: 'African prints',
    images: ['https://picsum.photos/600/600?random=10'],
    rating: 4.8,
    reviews: 300,
    isOfficialStore: true,
    dataAiHint: 'african fabric',
     variants: [
      { id: "13", name: '6 Yards', price: 55.49, originalPrice: 65.00, stock: 150 },
    ]
  },
  {
    id: "11",
    name: 'Silicone Spatula Set',
    description: 'A set of durable, heat-resistant silicone spatulas for baking and cooking.',
    category: 'kitchen ware, and utensils',
    images: ['https://picsum.photos/600/600?random=11'],
    rating: 4.8,
    reviews: 450,
    dataAiHint: 'kitchen utensils',
     variants: [
      { id: "14", name: '3-piece set', price: 19.99, stock: 100 },
    ]
  },
  {
    id: "12",
    name: 'Measuring Tape',
    description: 'A retractable and flexible measuring tape, essential for any sewing project.',
    category: 'Sewing accessories',
    images: ['https://picsum.photos/600/600?random=12'],
    rating: 4.7,
    reviews: 180,
    dataAiHint: 'measuring tape',
     variants: [
       { id: "16", name: '150cm/60inch', price: 5.99, stock: 80 },
    ]
  },
  {
    id: "13",
    name: "Foundation Makeup",
    description: "A long-lasting, full-coverage foundation available in multiple shades.",
    category: "Cosmetics",
    images: ["https://picsum.photos/600/600?random=13"],
    rating: 4.9,
    reviews: 500,
    isOfficialStore: true,
    dataAiHint: "makeup foundation",
    variants: [
      { id: "17", name: "Shade 1", price: 26.50, stock: 100 },
      { id: "18", name: "Shade 2", price: 26.50, stock: 30 },
    ],
  }
];

export type Review = {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    userImage?: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: string; // ISO 8601 date string
};
