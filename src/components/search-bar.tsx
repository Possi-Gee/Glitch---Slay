'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useProduct } from '@/hooks/use-product';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { state } = useProduct();
  const { products } = state;

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }, [query, products]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 hover:text-accent transition-colors" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mt-2 border-t pt-2">
            {suggestions.map(product => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm text-sm"
                onClick={() => setOpen(false)}
              >
                <img src={product.images[0]} alt={product.name} className="w-8 h-8 object-cover rounded" />
                {product.name}
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
