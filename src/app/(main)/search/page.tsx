'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProduct } from '@/hooks/use-product';
import { MOCKUP_BEST_SELLERS } from '@/lib/mock-products';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { state: productState } = useProduct();
  const { products, loading } = productState;

  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const allProducts = useMemo(() => {
    const combined = [...products];
    MOCKUP_BEST_SELLERS.forEach(mockItem => {
      if (!combined.some(p => p.name === mockItem.name)) {
        combined.push(mockItem as any);
      }
    });
    return combined;
  }, [products]);

  const categories = useMemo(() => {
    return ['All', ...[...new Set(allProducts.map((p) => p.category))].sort()];
  }, [allProducts]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    return allProducts
      .filter(product => {
        const matchesSearch =
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const productPrice = product.variants[0]?.price || 0;
        const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'relevance') {
          const aExact = a.name.toLowerCase().includes(q) ? 1 : 0;
          const bExact = b.name.toLowerCase().includes(q) ? 1 : 0;
          return bExact - aExact;
        }
        const priceA = a.variants[0]?.price || 0;
        const priceB = b.variants[0]?.price || 0;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [allProducts, query, selectedCategory, priceRange, sortBy]);

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {query ? <>Results for &ldquo;<span className="text-accent">{query}</span>&rdquo;</> : 'Search Products'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {query ? `${results.length} product${results.length !== 1 ? 's' : ''} found` : 'Enter a search term to find products'}
        </p>
      </div>

      {query && (
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b">
          <div className="relative flex-grow max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              defaultValue={query}
              placeholder="Search products..."
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) window.history.replaceState(null, '', `/search?q=${encodeURIComponent(val)}`);
                }
              }}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-9 border border-input bg-background px-2 text-sm rounded-md"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
            >
              <option value="50">Under GH₵50</option>
              <option value="100">Under GH₵100</option>
              <option value="200">Under GH₵200</option>
              <option value="500">Under GH₵500</option>
              <option value="1000">All Prices</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="rounded-none border border-border/40">
              <Skeleton className="aspect-square w-full rounded-none" />
              <CardContent className="p-4 space-y-2 bg-white">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full rounded-none" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/60" />
          <p className="text-muted-foreground mt-4 font-sans text-sm">
            No products found for &ldquo;{query}&rdquo;. Try a different search term or browse categories.
          </p>
        </div>
      ) : (
        <div className="text-center py-16">
          <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground/60" />
          <p className="text-muted-foreground mt-4 font-sans text-sm">
            Type in the search bar above to find products.
          </p>
        </div>
      )}
    </div>
  );
}
