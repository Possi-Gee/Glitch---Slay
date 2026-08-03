'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building } from 'lucide-react';
import Link from 'next/link';

const jobOpenings = [
  {
    title: 'E-commerce Operations Manager',
    location: 'Accra, Ghana',
    type: 'Full-time',
    description: 'We are looking for an experienced operations manager to oversee our e-commerce logistics, inventory, and order fulfillment processes.',
  },
  {
    title: 'Customer Service Representative',
    location: 'Accra, Ghana',
    type: 'Full-time',
    description: 'Join our friendly team to assist customers with their inquiries, process orders, and ensure a top-notch shopping experience.',
  },
  {
    title: 'Digital Marketing Specialist',
    location: 'Remote',
    type: 'Contract',
    description: 'Help us grow our online presence through creative and effective digital marketing campaigns across various platforms.',
  },
];

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <Briefcase className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary lg:text-5xl">Work With Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">Join our team and help us build the future of classic retail.</p>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Current Openings</h2>
        
        <div className="space-y-6">
          {jobOpenings.map((job, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.location} &middot; {job.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{job.description}</p>
              </CardContent>
              <CardFooter>
                 <Button asChild>
                    <Link href={`mailto:careers@jaytelclassic.com?subject=Application%20for%20${encodeURIComponent(job.title)}`}>
                        Apply Now
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {jobOpenings.length === 0 && (
             <Card className="text-center p-12">
                <p className="text-muted-foreground">There are no open positions at this time. Please check back later!</p>
            </Card>
          )}
        </div>

        <Card className="mt-12 bg-muted">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building /> Our Culture</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground">
                    At Jaytel Classic Store, we foster a collaborative and innovative environment. We believe in empowering our employees, celebrating our successes, and learning from our challenges. If you are a creative problem-solver with a passion for quality and customer service, we would love to hear from you.
                </p>
                <p className="mt-4 text-muted-foreground">
                    Don't see a role that fits? We are always looking for talented individuals. Send your resume to <Link href="mailto:careers@jaytelclassic.com" className="text-primary underline">careers@jaytelclassic.com</Link>.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
