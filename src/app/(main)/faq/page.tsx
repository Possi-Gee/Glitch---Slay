'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: 'How do I place an order?',
    answer:
      'To place an order, simply browse our product catalog, select the items you wish to purchase, choose your preferred options (like size or color), and add them to your cart. Once you are ready, proceed to checkout, where you will be asked to provide your shipping and payment information.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept several payment methods for your convenience, including major credit cards (Visa, MasterCard), Mobile Money, and Pay on Delivery for eligible orders. All online transactions are secure and encrypted.',
  },
  {
    question: 'How can I track my order?',
    answer:
      'Once your order has been shipped, you will receive a confirmation email with a tracking number. You can use this number to track your order\'s progress. You can also view your order history and status by logging into your account and visiting the "My Orders" page.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 14-day return policy for most items. If you are not satisfied with your purchase, you can return it for a full refund or exchange, provided the item is in its original, unused condition with all tags attached. Please see our Shipping & Returns page for more details.',
  },
  {
    question: 'How long does shipping take?',
    answer:
      'Shipping times vary depending on your location. For orders within Accra, delivery is typically within 1-2 business days. For orders outside Accra, it can take 3-5 business days. You will be given a more accurate estimate at checkout.',
  },
  {
    question: 'Do you offer in-store pickup?',
    answer:
      'Yes, we do! You can select the "In-store Pickup" option during checkout. We will notify you via email as soon as your order is ready for collection at our store in Osu, Accra.',
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <HelpCircle className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary lg:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">Find answers to common questions about our store and services.</p>
      </header>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
