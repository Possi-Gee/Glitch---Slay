
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import type { Message } from '@/ai/flows/support-chat-flow';
import { supportChat } from '@/ai/flows/support-chat-flow';
import { useAuth } from '@/hooks/use-auth';
import { ChatMessage } from './chat-message';

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage: Message = {
      role: 'user',
      content: [{ text: input }],
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await supportChat({
        history: messages,
        message: input,
        userId: user?.uid,
      });

      const newModelMessage: Message = {
        role: 'model',
        content: [{ text: responseText }],
      };
      setMessages(prev => [...prev, newModelMessage]);

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        role: 'model',
        content: [{ text: "Sorry, I'm having trouble connecting right now. Please try again later." }],
      };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="w-80 h-[500px] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Support Chat</CardTitle>
                    <CardDescription>How can I help you today?</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                     <div className="space-y-4">
                        <ChatMessage message={{role: 'model', content:[{text: "Hello! I'm your friendly support bot. You can ask me about our products, your orders, or our store policies."}]}} />
                        {messages.map((message, index) => (
                           <ChatMessage key={index} message={message} />
                        ))}
                         {isLoading && <ChatMessage message={{role: 'model', content:[{text: ""}]}} />}
                      </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask a question..."
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full h-16 w-16 shadow-lg mt-4"
          aria-label="Toggle chat widget"
        >
          {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
        </Button>
      </div>
    </>
  );
}
