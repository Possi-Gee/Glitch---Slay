
import { BottomNavbar } from '@/components/bottom-navbar';
import { ChatWidget } from '@/components/chat-widget';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NotificationPrompt } from '@/components/notification-prompt';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
      <NotificationPrompt />
      {/* Spacer for bottom navbar on mobile */}
      <div className="pb-16 md:hidden"></div>
      {/* Mobile-only bottom navbar */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
}
