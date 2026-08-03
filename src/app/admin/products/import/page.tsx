'use client';

import { useState, useRef } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProduct } from '@/hooks/use-product';
import { Upload, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type ParsedProduct = {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  features: string;
  imageUrls: string[];
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): ParsedProduct[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    const rawImages = row.imageurl || '';
    const imageUrls = rawImages
      .split(/[;,]/)
      .map(u => u.trim())
      .filter(Boolean);

    return {
      name: row.name || '',
      description: row.description || '',
      category: row.category || '',
      price: parseFloat(row.price) || 0,
      stock: parseInt(row.stock) || 0,
      features: row.features || '',
      imageUrls,
    };
  }).filter(p => p.name);
}

const EXPORT_HEADERS = ['id', 'name', 'description', 'category', 'price', 'stock', 'features', 'images', 'rating', 'reviews'];

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ProductImportExportPage() {
  const { state: productState } = useProduct();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        setParsedData(data);
        setImportSuccess(false);
        toast({
          title: 'CSV Parsed',
          description: `Successfully parsed ${data.length} product(s). Review before importing.`,
        });
      } catch {
        toast({
          title: 'Parse Error',
          description: 'Failed to parse CSV file. Check the format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);

    try {
      const batch = writeBatch(db);

      parsedData.forEach((item) => {
        const id = crypto.randomUUID?.() || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const productRef = doc(db, 'products', id);

        batch.set(productRef, {
          id,
          name: item.name,
          description: item.description,
          category: item.category,
          images: item.imageUrls.length > 0 ? item.imageUrls : ['https://picsum.photos/600/600'],
          rating: 0,
          reviews: 0,
          features: item.features,
          isOfficialStore: false,
          dataAiHint: `${item.category.toLowerCase()} product`,
          variants: [
            {
              id: crypto.randomUUID?.() || `var_${Date.now()}`,
              name: 'Standard',
              price: item.price,
              stock: item.stock,
            },
          ],
        });
      });

      await batch.commit();

      setImportSuccess(true);
      toast({
        title: 'Import Successful',
        description: `${parsedData.length} product(s) imported.`,
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { products } = productState;

      const rows = [EXPORT_HEADERS.join(',')];

      products.forEach(product => {
        const row = [
          escapeCSV(product.id),
          escapeCSV(product.name),
          escapeCSV(product.description || ''),
          escapeCSV(product.category),
          product.variants[0]?.price ?? 0,
          product.variants[0]?.stock ?? 0,
          escapeCSV(product.features || ''),
          escapeCSV((product.images || []).join(';')),
          product.rating ?? 0,
          product.reviews ?? 0,
        ];
        rows.push(row.join(','));
      });

      const csvString = rows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `${products.length} product(s) exported.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import / Export Products</h1>
        <p className="text-muted-foreground">Bulk import or export your product inventory via CSV.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">description</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">category</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">price</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">stock</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">features</code>,{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">imageUrl</code> (semicolon-separated URLs).
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-sm"
            />
          </div>

          {parsedData.length > 0 && (
            <>
              <Alert variant={importSuccess ? 'default' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.length} product(s) parsed. Review below then click Confirm Import.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Images</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                        <TableCell>GH₵{item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {item.imageUrls.join('; ') || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2 border-t">
                    +{parsedData.length - 10} more product(s)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={isImporting || importSuccess}>
                  {isImporting ? (
                    <><Loader2 className="mr-2 animate-spin" /> Importing...</>
                  ) : importSuccess ? (
                    <><CheckCircle className="mr-2" /> Imported</>
                  ) : (
                    <><Upload className="mr-2" /> Confirm Import</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => { setParsedData([]); setImportSuccess(false); }}>
                  Clear
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download all products as a CSV file with columns: id, name, description, category, price, stock, features, images, rating, reviews.
          </p>
          <Button onClick={handleExport} disabled={isExporting || productState.products.length === 0}>
            {isExporting ? (
              <><Loader2 className="mr-2 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="mr-2" /> Export CSV ({productState.products.length} products)</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
