'use client';

import { Building, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-5xl">About Glitch & Slay</h1>
        <p className="mt-4 text-lg text-muted-foreground">Your trusted partner for quality and elegance.</p>
      </header>

      <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden mb-12">
        <Image
          src="https://picsum.photos/seed/about-us/1600/600"
          alt="Glitch & Slay storefront"
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover"
          data-ai-hint="modern storefront"
        />
      </div>

      <section className="max-w-3xl mx-auto mb-16 text-center">
        <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
        <p className="text-muted-foreground leading-relaxed">
          Founded in Accra with a passion for bringing high-quality, classic goods to our community, Glitch & Slay started as a small dream. We believed that everyone deserves access to products that are not only beautiful and stylish but also durable and reliable. From humble beginnings, we have grown into a beloved local and online destination, known for our carefully curated selection and unwavering commitment to customer satisfaction. We blend traditional Ghanaian hospitality with modern e-commerce convenience to offer a unique shopping experience.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-8 text-center mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-2">
              <Target className="h-10 w-10 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">To provide our customers with a diverse range of high-quality products that enhance their lifestyle, coupled with an exceptional shopping experience.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-2">
              <Building className="h-10 w-10 text-primary" />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">To be the leading and most trusted online classic store in West Africa, known for our quality, integrity, and customer-centric approach.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-2">
              <Users className="h-10 w-10 text-primary" />
              Our Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Quality, Customer Satisfaction, Integrity, and Community. These pillars guide every decision we make and every interaction we have.</p>
          </CardContent>
        </Card>
      </section>

      <section className="bg-muted -mx-4 px-4 py-16 md:rounded-lg">
          <div className="container mx-auto text-center">
             <h2 className="text-3xl font-semibold mb-4">Meet the Team</h2>
             <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                We are a dedicated team of professionals who are passionate about what we do. Get to know the faces behind Glitch & Slay.
             </p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col items-center">
                    <Image src="https://picsum.photos/seed/team1/200/200" alt="Team member 1" width={120} height={120} className="rounded-full mb-4 object-cover" />
                    <h4 className="font-semibold">Jane Doe</h4>
                    <p className="text-sm text-primary">Founder & CEO</p>
                </div>
                 <div className="flex flex-col items-center">
                    <Image src="https://picsum.photos/seed/team2/200/200" alt="Team member 2" width={120} height={120} className="rounded-full mb-4 object-cover" />
                    <h4 className="font-semibold">John Smith</h4>
                    <p className="text-sm text-primary">Head of Operations</p>
                </div>
                 <div className="flex flex-col items-center">
                    <Image src="https://picsum.photos/seed/team3/200/200" alt="Team member 3" width={120} height={120} className="rounded-full mb-4 object-cover" />
                    <h4 className="font-semibold">Emily Jones</h4>
                    <p className="text-sm text-primary">Customer Service Lead</p>
                </div>
                 <div className="flex flex-col items-center">
                    <Image src="https://picsum.photos/seed/team4/200/200" alt="Team member 4" width={120} height={120} className="rounded-full mb-4 object-cover" />
                    <h4 className="font-semibold">Michael Brown</h4>
                    <p className="text-sm text-primary">Marketing Director</p>
                </div>
             </div>
          </div>
      </section>

    </div>
  );
}
