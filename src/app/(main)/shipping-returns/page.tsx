'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, RotateCw } from 'lucide-react';

export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-5xl">Shipping & Returns</h1>
        <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about our delivery and return policies.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-2xl">Shipping Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Processing Time</h4>
              <p>Orders are typically processed and dispatched within 1-2 business days. You will receive a notification once your order is on its way.</p>
            </div>
             <div>
              <h4 className="font-semibold text-foreground mb-1">Shipping Rates & Delivery Times</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Greater Accra Region:</strong> GH₵20 (1-2 business days)</li>
                <li><strong>Other Regions in Ghana:</strong> GH₵40 (3-5 business days)</li>
                <li><strong>In-store Pickup:</strong> Free. We will notify you when your order is ready for pickup at our Osu location.</li>
              </ul>
            </div>
             <div>
              <h4 className="font-semibold text-foreground mb-1">International Shipping</h4>
              <p>Currently, we only ship within Ghana. We are working on expanding our services to other countries in the near future.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <RotateCw className="h-8 w-8 text-primary" />
              <span className="text-2xl">Return Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">14-Day Returns</h4>
              <p>We want you to be completely satisfied with your purchase. If you are not, you may return most new, unopened items within 14 days of delivery for a full refund or exchange.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Conditions for Return</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Items must be in their original, unused condition.</li>
                <li>All original packaging, tags, and accessories must be included.</li>
                <li>Proof of purchase is required for all returns.</li>
                <li>Certain items, such as cosmetics and fabrics that have been cut, are non-returnable for hygiene and customization reasons.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">How to Initiate a Return</h4>
              <p>To start a return, please contact our customer service team at support@jaytelclassic.com with your order number and the reason for the return. We will guide you through the process.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
