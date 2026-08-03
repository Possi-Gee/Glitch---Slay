
'use server';
/**
 * @fileOverview A Genkit tool for retrieving FAQ information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This data is a simplified version of what's on the FAQ and Shipping/Returns pages.
// In a more advanced implementation, this could be dynamically fetched or embedded.
const FAQ_DATA = {
  shipping: {
    processingTime: "Orders are typically processed and dispatched within 1-2 business days.",
    ratesAndTimes: {
      "Greater Accra Region": "GH₵20 (1-2 business days)",
      "Other Regions in Ghana": "GH₵40 (3-5 business days)",
      "In-store Pickup": "Free. We will notify you when your order is ready for pickup at our Osu location."
    },
    international: "Currently, we only ship within Ghana."
  },
  returns: {
    policy: "We offer a 14-day return policy for most new, unopened items for a full refund or exchange.",
    conditions: [
      "Items must be in their original, unused condition.",
      "All original packaging, tags, and accessories must be included.",
      "Proof of purchase is required.",
      "Cosmetics and cut fabrics are non-returnable."
    ],
    initiate: "To start a return, please contact our customer service team at support@jaytelclassic.com with your order number and the reason for the return."
  },
  payment: {
    methods: "We accept major credit cards (Visa, MasterCard), Mobile Money, and Pay on Delivery for eligible orders."
  },
  general: {
      orderPlacement: "To place an order, browse our products, add items to your cart, and proceed to checkout to provide your shipping and payment information.",
      orderTracking: "Once your order ships, you will receive an email with a tracking number. You can also see your order status in the 'My Orders' page of your account.",
      inStorePickup: "Yes, you can select 'In-store Pickup' at checkout. We'll email you when your order is ready for collection at our store in Osu, Accra."
  }
};

const FaqQuestionSchema = z.enum(['shipping', 'returns', 'payment', 'general']);


/**
 * A Genkit tool that provides answers to frequently asked questions.
 * The AI model will use this tool when it determines the user is asking
 * about shipping, returns, or payment policies.
 */
export async function getFaqTool() {
  return ai.defineTool(
    {
        name: 'getFaq',
        description: 'Get information about store policies such as shipping, returns, and payment methods.',
        inputSchema: z.object({
            topic: FaqQuestionSchema.describe('The topic the user is asking about.'),
        }),
        outputSchema: z.string().describe('The answer to the user\'s question.'),
    },
    async ({ topic }) => {
        return JSON.stringify(FAQ_DATA[topic]);
    }
  );
}
