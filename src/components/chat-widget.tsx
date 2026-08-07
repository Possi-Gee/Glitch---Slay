
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
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[55] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="w-[calc(100vw-32px)] sm:w-80 h-[380px] md:h-[500px] max-h-[calc(100vh-120px)] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                  <div>
                    <CardTitle className="text-lg">Support Chat</CardTitle>
                    <CardDescription className="text-xs">How can I help you today?</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-4 py-2">
                     <div className="space-y-4 pb-4">
                        <ChatMessage message={{role: 'model', content:[{text: "Hello! I'm your friendly support bot. You can ask me about our products, your orders, or our store policies."}]}} />
                        {messages.map((message, index) => (
                           <ChatMessage key={index} message={message} />
                        ))}
                         {isLoading && <ChatMessage message={{role: 'model', content:[{text: ""}]}} />}
                      </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask a question..."
                      disabled={isLoading}
                      className="h-9 text-xs"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full h-14 w-14 sm:h-16 sm:w-16 shadow-lg mt-4"
            aria-label="Toggle chat widget"
          >
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        )}
      </div>
    </>
  );
}
