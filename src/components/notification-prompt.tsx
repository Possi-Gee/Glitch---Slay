
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    if (newPermission === 'granted') {
      toast({
        title: 'Notifications Enabled!',
        description: "You'll be the first to know about new products.",
      });
    } else {
        toast({
            title: 'Notifications Blocked',
            description: "You can enable notifications from your browser settings if you change your mind.",
            variant: 'destructive',
        })
    }
    setPermission(newPermission);
  };

  if (!isMounted || permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Card className="w-80 shadow-lg animate-in slide-in-from-bottom-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell /> Stay Updated!</CardTitle>
          <CardDescription>
            Enable notifications to get the latest updates on new products.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPermission('denied')}>
                <BellOff className="mr-2" />
                Maybe Later
            </Button>
            <Button size="sm" onClick={handleRequestPermission}>
                <Bell className="mr-2" />
                Enable
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
