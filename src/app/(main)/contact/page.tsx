
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { sendContactFormEmail } from '@/ai/flows/send-contact-form-email';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const { state: settings } = useSiteSettings();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setError(null);
    try {
      const result = await sendContactFormEmail({
        fromName: data.name,
        fromEmail: data.email,
        subject: data.subject,
        message: data.message,
        appName: settings.appName,
      });

      if (result.success) {
        toast({
          title: 'Message Sent!',
          description: 'Thank you for contacting us. We will get back to you shortly.',
        });
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-5xl">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">We'd love to hear from you. Let's get in touch.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Send us a Message</h2>
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl><Input placeholder="e.g., Order Inquiry" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl><Textarea placeholder="Your message..." {...field} rows={5} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                    Send Message
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Information</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Our Address</CardTitle>
                  <CardDescription>Come visit us at our main store.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">123 Classic Lane, Osu</p>
                <p className="text-muted-foreground">Accra, Ghana</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Phone className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Call Us</CardTitle>
                  <CardDescription>Mon - Fri, 9am - 6pm GMT</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Main Office: +233 30 274 0642</p>
                <p className="text-muted-foreground">Support: +233 30 274 0643</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Email Us</CardTitle>
                  <CardDescription>We'll reply within 24 hours.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                 <p className="text-muted-foreground">General: info@jaytelclassic.com</p>
                 <p className="text-muted-foreground">Support: support@jaytelclassic.com</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
