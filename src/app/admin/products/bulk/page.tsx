'use client';

import { useState } from 'react';
import { useProduct } from '@/hooks/use-product';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Check, Loader2 } from 'lucide-react';

export default function BulkStockPage() {
  const { state } = useProduct();
  const { products } = state;
  const { toast } = useToast();
  const [updates, setUpdates] = useState<Record<string, { stock?: number; price?: number }>>({});
  const [saving, setSaving] = useState(false);

  const handleStockChange = (productId: string, variantId: string, value: string) => {
    const key = `${productId}_${variantId}`;
    setUpdates(prev => ({
      ...prev,
      [key]: { ...prev[key], stock: parseInt(value) || 0 },
    }));
  };

  const handlePriceChange = (productId: string, variantId: string, value: string) => {
    const key = `${productId}_${variantId}`;
    setUpdates(prev => ({
      ...prev,
      [key]: { ...prev[key], price: parseFloat(value) || 0 },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let successCount = 0;
    for (const [key, data] of Object.entries(updates)) {
      const [productId, variantId] = key.split('_');
      if (data.stock !== undefined || data.price !== undefined) {
        try {
          const productRef = doc(db, 'products', productId);
          const product = products.find(p => p.id === productId);
          if (product) {
            const variants = product.variants.map(v =>
              v.id === variantId ? { ...v, stock: data.stock ?? v.stock, price: data.price ?? v.price } : v
            );
            await updateDoc(productRef, { variants });
            successCount++;
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    toast({ title: 'Bulk Update Complete', description: `${successCount} variant(s) updated.` });
    setUpdates({});
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Bulk Stock & Price Editor</h1>
            <p className="text-muted-foreground">Update stock levels and prices for multiple products at once.</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={Object.keys(updates).length === 0 || saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Check className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Edit stock and price values directly in the table.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>New Stock</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>New Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product =>
                product.variants.map(variant => {
                  const key = `${product.id}_${variant.id}`;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-sm">{product.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{variant.name}</TableCell>
                      <TableCell>{variant.stock}</TableCell>
                      <TableCell className="w-24">
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          placeholder={String(variant.stock)}
                          value={updates[key]?.stock ?? ''}
                          onChange={(e) => handleStockChange(product.id, variant.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>GH₵{variant.price.toFixed(2)}</TableCell>
                      <TableCell className="w-28">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-xs"
                          placeholder={variant.price.toFixed(2)}
                          value={updates[key]?.price ?? ''}
                          onChange={(e) => handlePriceChange(product.id, variant.id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
