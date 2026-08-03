
'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/ai/flows/support-chat-flow';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useAuth } from '@/hooks/use-auth';

interface ChatMessageProps {
  message: Message;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}


export function ChatMessage({ message }: ChatMessageProps) {
    const { user } = useAuth();
    const { state: settings } = useSiteSettings();
    const isModel = message.role === 'model';

    return (
        <div className={cn("flex items-start gap-3", isModel ? "justify-start" : "justify-end")}>
            {isModel && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={settings.logoUrl || undefined} />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    "max-w-xs rounded-lg p-3 text-sm shadow",
                    isModel ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                )}
            >
                {message.content.map((part, index) => (
                    <p key={index}>{part.text}</p>
                ))}
            </div>
             {!isModel && user && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
            )}
             {!isModel && !user && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><User/></AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
