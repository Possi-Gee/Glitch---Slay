'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Download, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PressPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <Newspaper className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary lg:text-5xl">Press & Media</h1>
        <p className="mt-4 text-lg text-muted-foreground">Information and resources for journalists and media professionals.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">About Jaytel Classic Store</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        Jaytel Classic Store is a premier online and physical retail destination based in Accra, Ghana, specializing in a curated selection of high-quality goods ranging from fashion and cosmetics to kitchenware and fabrics. Founded on the principles of quality, integrity, and exceptional customer service, our mission is to provide classic, durable, and stylish products that enhance the lives of our customers. We are proud to blend traditional Ghanaian market culture with the convenience of modern e-commerce, creating a unique and beloved shopping experience.
                    </p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Media Contact</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="font-semibold">Media Relations</p>
                     <p className="text-muted-foreground">For all media inquiries, please contact:</p>
                     <Link href="mailto:press@jaytelclassic.com" className="text-primary underline flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4" /> press@jaytelclassic.com
                     </Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Press Kit</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground mb-4">Download our press kit for logos, brand guidelines, and high-resolution images.</p>
                     <Button className="w-full" asChild>
                        <Link href="#">
                            <Download className="mr-2" /> Download Press Kit
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
