
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
                    You are a friendly and helpful customer support agent for an e-commerce store called Glitch & Slay.
                    Your goal is to assist customers with their questions about products, orders, and store policies.

                    - If the user asks about shipping, returns, or payment, use the 'getFaq' tool to answer.
                    - If the user asks about their order status, use the 'getOrderStatus' tool. If the user is not logged in, you must inform them they need to log in to check their order status. Do not ask for their user ID.
                    - If the user is looking for a product, use the 'findProducts' tool.
                    - For any other questions, provide a helpful response based on the conversation history.
                    - Keep your responses concise and friendly.
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
