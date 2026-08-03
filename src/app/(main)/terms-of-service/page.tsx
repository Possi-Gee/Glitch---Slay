'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12">
       <header className="text-center mb-12">
        <FileText className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary lg:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
                <p>Welcome to Jaytel Classic Store. These Terms of Service ("Terms") govern your use of our website located at [Your Website URL] and our services. By accessing or using our service, you agree to be bound by these Terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">2. Use of Our Service</h2>
                <p>You may use our service only for lawful purposes and in accordance with these Terms. You agree not to use the service: in any way that violates any applicable national or international law or regulation; for the purpose of exploiting, harming, or attempting to exploit or harm minors in any way; to transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">3. Accounts</h2>
                <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">4. Intellectual Property</h2>
                <p>The service and its original content, features, and functionality are and will remain the exclusive property of Jaytel Classic Store and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Jaytel Classic Store.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
                <p>In no event shall Jaytel Classic Store, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">6. Governing Law</h2>
                <p>These Terms shall be governed and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions.</p>
              </section>

               <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">7. Changes to Terms</h2>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
              </section>

               <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">8. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at support@jaytelclassic.com.</p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
