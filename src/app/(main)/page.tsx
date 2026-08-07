
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/product-card';
import Image from 'next/image';
import { Search, ShoppingBag, Clock, Mail, Heart } from 'lucide-react';
import { MOCKUP_BEST_SELLERS } from '@/lib/mock-products';

const AwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
import { useProduct } from '@/hooks/use-product';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useHomepage } from '@/hooks/use-homepage';
import { CallToAction } from '@/components/call-to-action';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { state: productState } = useProduct();
  const { products, loading } = productState;
  const { state: homepageState } = useHomepage();
  const { items: recentlyViewed } = useRecentlyViewed();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Filter promotion slides of type 'image' that have content
  const imageSlides = useMemo(() => {
    const images = homepageState?.promotions
      ?.filter(p => p.type === 'image' && p.content)
      ?.map(p => p.content) || [];
    return images.length > 0 ? images : ['/hero-model.png'];
  }, [homepageState?.promotions]);

  // Automatic slideshow effect
  useEffect(() => {
    if (imageSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % imageSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [imageSlides]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  // Newsletter state
  const [newsEmail, setNewsEmail] = useState('');
  const [newsSubmitting, setNewsSubmitting] = useState(false);

  // Combine DB products with mockup products if DB doesn't contain them
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

  useEffect(() => {
    setIsClient(true);
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categories.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory('All');
    }
  }, [searchParams, categories]);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const productPrice = product.variants[0]?.price || 0;
        const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
        const matchesRating = product.rating >= minRating;
        return matchesCategory && matchesSearch && matchesPrice && matchesRating;
      })
      .sort((a, b) => {
        const priceA = a.variants[0]?.price || 0;
        const priceB = b.variants[0]?.price || 0;
        switch (sortBy) {
          case 'price-asc': return priceA - priceB;
          case 'price-desc': return priceB - priceA;
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'rating': return (b.rating || 0) - (a.rating || 0);
          default: return 0;
        }
      });
  }, [allProducts, searchTerm, selectedCategory, sortBy, priceRange, minRating]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const catalogSection = document.getElementById('shop-catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsEmail) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    setNewsSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: newsEmail,
        subscribedAt: new Date().toISOString(),
      });
      setNewsEmail('');
      toast({
        title: "Subscribed Successfully!",
        description: "Welcome to the Glitch & Slay inner circle.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setNewsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Banner */}
      <CallToAction />

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 min-h-[500px] border-b border-border">
        {/* Left half: Black panel */}
        <div className="md:col-span-5 bg-black text-white flex flex-col justify-center px-8 py-16 sm:px-16 md:px-12 lg:px-20 space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-[46px] lg:text-6xl font-bold uppercase tracking-wide leading-tight">
              Glitch <span className="text-accent">&amp;</span>
              <br />
              Slay
            </h2>
            <p className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-gray-400">
              Fashion that speaks before you do.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="bg-white text-black hover:bg-white/90 text-xs font-bold tracking-widest uppercase px-8 py-6 rounded-none font-sans"
              onClick={() => {
                const section = document.getElementById('shop-catalog');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Shop Now
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 hover:text-white text-xs font-bold tracking-widest uppercase px-8 py-6 rounded-none font-sans bg-transparent"
              onClick={() => handleCategorySelect('Dresses')}
            >
              New Arrivals
            </Button>
          </div>
        </div>

        {/* Right half: Editorial photo - Sliding Image Carousel */}
        <div className="md:col-span-7 relative min-h-[300px] md:min-h-full bg-muted overflow-hidden">
          {imageSlides.map((src, index) => (
            <div
              key={src + index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image 
                src={src} 
                alt={`Glitch & Slay Hero ${index + 1}`} 
                fill 
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover object-center transition-transform duration-[5000ms] ease-out"
                style={{
                  transform: index === currentSlideIndex ? 'scale(1.05)' : 'scale(1.0)'
                }}
                priority={index === 0}
              />
            </div>
          ))}
          {/* Slider Pagination Controls */}
          {imageSlides.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
              {imageSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlideIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Bar */}
      <section className="bg-black text-white py-6 border-b border-border">
        <div className="container mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            <AwardIcon className="h-5 w-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">Premium Quality</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Best quality products</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            <TagIcon className="h-5 w-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">Affordable Prices</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Value for your money</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            <TruckIcon className="h-5 w-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">Fast Delivery</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Nationwide delivery</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            <LockIcon className="h-5 w-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">Secure Payments</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">100% secure checkout</span>
            </div>
          </div>

        </div>
      </section>

      {/* Shop By Category Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-8">
          <h3 className="text-center font-sans text-sm font-bold uppercase tracking-[0.3em] mb-12 text-foreground">
            Shop By Category
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Category 1: Dresses */}
            <div 
              className="flex flex-col items-center bg-muted/30 border border-border/60 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer group"
              onClick={() => handleCategorySelect('Dresses')}
            >
              <div className="relative aspect-square w-full bg-white border border-border/40 overflow-hidden mb-4">
                <Image 
                  src="/cat-bags.png" 
                  alt="Dresses Category" 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-foreground mb-1">Dresses</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground border-b border-transparent group-hover:border-accent group-hover:text-accent transition-all pb-0.5">Shop Now</span>
            </div>

            {/* Category 2: Sleepwear */}
            <div 
              className="flex flex-col items-center bg-muted/30 border border-border/60 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer group"
              onClick={() => handleCategorySelect('Sleepwear')}
            >
              <div className="relative aspect-square w-full bg-white border border-border/40 overflow-hidden mb-4">
                <Image 
                  src="/cat-clothing.png" 
                  alt="Sleepwear Category" 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-foreground mb-1">Sleepwear</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground border-b border-transparent group-hover:border-accent group-hover:text-accent transition-all pb-0.5">Shop Now</span>
            </div>

            {/* Category 3: Accessories */}
            <div 
              className="flex flex-col items-center bg-muted/30 border border-border/60 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer group"
              onClick={() => handleCategorySelect('Accessories')}
            >
              <div className="relative aspect-square w-full bg-white border border-border/40 overflow-hidden mb-4">
                <Image 
                  src="/cat-accessories.png" 
                  alt="Accessories Category" 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-foreground mb-1">Accessories</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground border-b border-transparent group-hover:border-accent group-hover:text-accent transition-all pb-0.5">Shop Now</span>
            </div>

            {/* Category 4: Bags and phone covers */}
            <div 
              className="flex flex-col items-center bg-muted/30 border border-border/60 hover:shadow-lg transition-all duration-300 p-4 cursor-pointer group"
              onClick={() => handleCategorySelect('Bags and phone covers')}
            >
              <div className="relative aspect-square w-full bg-white border border-border/40 overflow-hidden mb-4">
                <Image 
                  src="/cat-footwear.png" 
                  alt="Bags and phone covers Category" 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-foreground mb-1">Bags and phone covers</span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground border-b border-transparent group-hover:border-accent group-hover:text-accent transition-all pb-0.5">Shop Now</span>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers (Mockup layout & styling) */}
      <section id="best-sellers" className="py-16 bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h3 className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-foreground">
              Best Sellers
            </h3>
            <button 
              onClick={() => handleCategorySelect('All')} 
              className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {MOCKUP_BEST_SELLERS.map((product) => (
              <div key={product.id} className="group cursor-pointer" onClick={() => router.push(`/product/${product.id}`)}>
                <div className="relative aspect-[3/4] w-full bg-muted/30 overflow-hidden border border-border/40 mb-4 flex items-center justify-center">
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-6 group-hover:scale-102 transition-transform duration-300"
                  />
                  {/* Wishlist Button Overlay */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toast({
                        title: "Added to Wishlist",
                        description: `${product.name} has been saved.`,
                      });
                    }}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full border border-border/20 shadow-sm transition-all"
                  >
                    <Heart className="h-3.5 w-3.5 text-foreground hover:fill-foreground" />
                  </button>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <h4 className="font-sans text-xs font-medium tracking-wide text-foreground uppercase group-hover:text-accent transition-colors truncate">
                    {product.name}
                  </h4>
                  <span className="font-sans text-xs font-semibold text-foreground tracking-wide">
                    GHC {(product.price ?? product.variants[0]?.price ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Catalog Section */}
      <section id="shop-catalog" className="container mx-auto px-4 sm:px-8 py-16 scroll-mt-20">
        <header className="mb-10 text-center md:text-left">
          <h2 className="font-serif text-2xl font-bold uppercase tracking-wider text-foreground">Explore Our Catalog</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Browse our complete dynamic store products</p>
        </header>

        {/* Recently Viewed */}
        {isClient && recentlyViewed.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">Recently Viewed</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {recentlyViewed.slice(0, 6).map(item => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow rounded-none border border-border/40" onClick={() => router.push(`/product/${item.id}`)}>
                  <CardContent className="p-3">
                    <div className="aspect-square relative overflow-hidden mb-2 bg-[#F5F5F5]">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill sizes="20vw" className="object-cover" />
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate uppercase tracking-wider">{item.name}</p>
                    <p className="text-xs text-accent font-bold mt-0.5">GHC {item.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-8 space-y-4 border-b border-border/40 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-products"
                type="text"
                placeholder="Search store products..."
                className="w-full pl-10 h-10 border-border/80 focus:border-accent text-xs rounded-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[160px] h-10 border-border/80 text-xs rounded-none">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  <SelectItem value="default" className="text-xs">Default</SelectItem>
                  <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc" className="text-xs">Name: A-Z</SelectItem>
                  <SelectItem value="name-desc" className="text-xs">Name: Z-A</SelectItem>
                  <SelectItem value="rating" className="text-xs">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[160px] h-10 border-border/80 text-xs rounded-none">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-xs">{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Price:</span>
              <select
                className="h-8 border border-border/80 bg-background px-2 text-xs rounded-none"
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
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rating:</span>
              {[0, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2 py-1 border transition-colors ${minRating === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border/80 hover:border-primary'}`}
                >
                  {r === 0 ? 'All' : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Catalog Grid */}
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
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
            </div>
        ) : (
           <div className="text-center col-span-full py-16">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/60" />
              <p className="text-muted-foreground mt-4 font-sans text-xs uppercase tracking-wider">No products found. Try adjusting your search or filters.</p>
           </div>
        )}
      </section>

      {/* Stay Updated (Newsletter Banner) */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-8 max-w-4xl">
          <div className="bg-transparent flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            <div className="flex items-start gap-4">
              <div className="bg-black text-white p-3.5 rounded-full mt-1">
                <Mail className="h-6 w-6" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <h3 className="font-sans text-sm font-bold uppercase tracking-[0.25em] text-foreground">Stay Updated</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Be the first to know about new arrivals, exclusive discounts and restocks.
                </p>
              </div>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto items-center space-x-2 max-w-md flex-grow">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                disabled={newsSubmitting}
                className="bg-white border-border/80 focus:border-accent text-xs h-12 rounded-none px-4"
              />
              <Button 
                type="submit" 
                disabled={newsSubmitting}
                className="bg-black hover:bg-black/90 text-white font-bold text-xs tracking-wider uppercase h-12 rounded-none px-6"
              >
                {newsSubmitting ? "..." : "Subscribe"}
              </Button>
            </form>

          </div>
        </div>
      </section>
    </div>
  );
}
