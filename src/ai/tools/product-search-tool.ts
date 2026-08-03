
'use server';
/**
 * @fileOverview A Genkit tool for searching products in the store.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import type { Product } from '@/lib/products';

/**
 * Creates a Genkit tool to find products based on a search query.
 * The AI model uses this tool to help users find items in the store.
 */
export const getProductSearchTool = async () => ai.defineTool(
  {
    name: 'findProducts',
    description: 'Search for products available in the store based on a user\'s query.',
    inputSchema: z.object({
      query: z.string().describe('A description of the product the user is looking for.'),
    }),
    outputSchema: z.string().describe('A summary of found products or a message indicating no products were found.'),
  },
  async ({ query: searchQuery }) => {
    try {
      const productsCol = collection(db, 'products');
      // Firestore doesn't support full-text search natively. This is a basic search.
      // For a real app, a dedicated search service like Algolia would be better.
      const q = query(productsCol, limit(5));
      
      const querySnapshot = await getDocs(q);
      
      const allProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        allProducts.push(doc.data() as Product);
      });

      // Filter in-memory since Firestore's querying is limited.
      const lowercasedQuery = searchQuery.toLowerCase();
      const foundProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowercasedQuery) || 
        p.description.toLowerCase().includes(lowercasedQuery) ||
        p.category.toLowerCase().includes(lowercasedQuery)
      ).slice(0, 3); // Return at most 3 results
      
      if (foundProducts.length === 0) {
        return "I couldn't find any products matching that description. Please try describing it differently.";
      }
      
      const productSummaries = foundProducts.map(p => 
        `${p.name} (Price: GHS ${p.variants[0].price.toFixed(2)})`
      );

      return `I found a few products you might be interested in: ${productSummaries.join(', ')}. You can find them by searching on the homepage.`;

    } catch (error) {
      console.error("Error searching for products:", error);
      return "I had trouble searching for products right now. Please try again in a moment.";
    }
  }
);
