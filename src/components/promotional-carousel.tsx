
'use client';

import * as React from "react"
import Image from "next/image";
import Link from 'next/link';
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel"
import { useHomepage } from '@/hooks/use-homepage';
import { Skeleton } from "@/components/ui/skeleton";

export function PromotionalCarousel() {
  const { state } = useHomepage();
  const { promotions, loading } = state;

  if (loading) {
    return (
       <div className="w-full bg-white py-4">
        <div className="w-full max-w-6xl mx-auto p-1">
          <Skeleton className="aspect-[3/1] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white py-4">
        <Carousel
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full max-w-6xl mx-auto"
        >
        <CarouselContent>
            {promotions.map((promo) => (
              <CarouselItem key={promo.id}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="relative flex aspect-[3/1] items-center justify-center p-0 overflow-hidden rounded-lg">
                        {promo.type === 'image' ? (
                          <Image src={promo.content} alt={promo.alt || 'Promotion'} fill className="object-cover" data-ai-hint={promo.dataAiHint} />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center bg-gray-100 dark:bg-gray-800 w-full h-full p-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">{promo.title}</h2>
                            <p className="mt-2 text-lg text-muted-foreground">{promo.subtitle}</p>
                            {promo.buttonText && promo.buttonLink && (
                              <Button asChild className="mt-6">
                                <Link href={promo.buttonLink}>{promo.buttonText}</Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselDots />
        </Carousel>
    </div>
  )
}
