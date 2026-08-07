
'use server';
/**
 * @fileOverview A customer support chatbot flow.
 *
 * This file defines the AI flow for a customer support chatbot. The chatbot can
 * answer frequently asked questions, check order status for logged-in users, and
 * help find products. It uses Genkit tools to perform these actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFaqTool } from '../tools/faq-tool';
import { getOrderStatusTool } from '../tools/order-status-tool';
import { getProductSearchTool } from '../tools/product-search-tool';

// Define message schema for conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});
export type Message = z.infer<typeof MessageSchema>;

// Define the input schema for the chat flow
const SupportChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
  userId: z.string().optional().describe('The ID of the logged-in user, if any.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

// Define the output schema for the chat flow
const SupportChatOutputSchema = z.string().describe('The chatbot\'s response.');
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;


/**
 * Processes a user's message in the support chat.
 * @param input The support chat input including history and the new message.
 * @returns The chatbot's text response.
 */
export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}


// Define the main chat flow
const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    // Dynamically get tools. This allows tools to access user-specific data like userId.
    const faqTool = await getFaqTool();
    const orderStatusTool = await getOrderStatusTool(input.userId);
    const productSearchTool = await getProductSearchTool();
    
    // Construct the full chat history, including the system prompt
    const messages: Message[] = [
        {
            role: 'system',
            content: [{
                text: `
                    You are a friendly, helpful, and highly-knowledgeable customer support agent for Glitch & Slay, a premium fashion e-commerce store.
                    Your goal is to assist customers and admins with any questions about products, orders, store policies, or ANY feature in the app.

                    Here is your comprehensive knowledge base about the Glitch & Slay app's features and how to use them:

                    1. CUSTOMER SHOPPING & CART:
                       - Users can browse products, search by name, filter by category (Dresses, Tops, Bags, Footwear, etc.), and sort by price, name, or rating.
                       - They can add products to their shopping cart, choose quantities, apply discount coupon codes, and checkout securely.
                       - Checkout choices: Nationwide delivery across Ghana (rates calculated at checkout) or free In-store Pickup at our Osu location in Accra.

                    2. PRE-ORDER FEATURE (HOW IT WORKS):
                       - If an item is out of stock or marked for pre-order, customers can still reserve it!
                       - Pre-orders bypass standard out-of-stock limits, meaning a customer can purchase even if quantity is 0.
                       - Deposit Downpayment: Depending on setup, customers can pay a partial deposit/downpayment or full price at checkout using Paystack.
                       - Managing Pre-orders: After ordering, the customer can log in, go to the 'Pre-Orders' tab under 'My Orders', view active reservations, cancel pending ones, and pay remaining balances via Paystack directly from their dashboard.

                    3. SECURE PAYMENTS (PAYSTACK):
                       - All checkout payments, deposits, and remaining pre-order balances are processed securely in real-time via Paystack (Visa, MasterCard, Mobile Money).

                    4. USER PORTAL & ACCOUNTS:
                       - Users can create accounts and log in to:
                         - Track order history and statuses ('My Orders' tab).
                         - Manage and complete payments for pre-orders ('Pre-Orders' tab).
                         - Rate and submit reviews for products they have purchased.

                    5. ADMIN CONTROL PANEL (ADMIN USER GUIDE):
                       - Accessible to authorized staff/admin users.
                       - Dashboard: Real-time sales statistics and low stock alerts. Low stock alert tables support dark and light mode contrast for high visibility.
                       - Products: Full product management (create, read, update, delete products), bulk editor to modify multiple items at once, and CSV Import/Export tools.
                       - Homepage Editor: Customizes the homepage banner carousel. Admins can add, remove, and reorder welcome banners or slide images. The slide images on the main page automatically cycle and slide with a premium zoom transition.
                       - Pre-Orders Manager (/admin/pre-orders): Accessible from the admin sidebar. Allows admins to search, filter by order or payment status, view customer addresses and payment references, update order status (PENDING, CONFIRMED, READY_TO_SHIP, SHIPPED, DELIVERED, CANCELLED), and update payment status (PENDING, PAID, REFUNDED).
                       - Settings: Configure store info (tax rates, shipping fees, contact details) and visual branding themes (primary colors, accent colors, and background colors).
                       - Blog Manager: Write and edit blog posts.
                       - Coupon Codes Manager: Create and manage discount coupons.

                    GUIDELINES FOR RESPONSE:
                    - If the user asks about shipping, returns, payment, or general app features, use the 'getFaq' tool to answer.
                    - If the user asks about their order status, use the 'getOrderStatus' tool. If they are not logged in, inform them they need to log in to see their order history.
                    - If the user is looking for a product, use the 'findProducts' tool.
                    - For all other questions, use the conversation history and this detailed knowledge base.
                    - Keep your responses concise, friendly, and professional.
                `
            }]
        },
      ...input.history,
      { role: 'user', content: [{ text: input.message }] },
    ];

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      messages,
      tools: [faqTool, orderStatusTool, productSearchTool],
      config: {
        // Lower temperature for more predictable, less "creative" responses
        temperature: 0.3,
      }
    });

    return output?.content[0].text || "I'm sorry, I'm having trouble understanding. Could you please rephrase?";
  }
);
