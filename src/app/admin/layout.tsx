
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Package, Home, LayoutDashboard, Settings, ShoppingCart, Loader2, ShieldX, Users, RotateCw, Tag, FileText, MessageSquare, Store, Printer, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminBottomNavbar } from '@/components/admin-bottom-navbar';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


type AdminRole = 'admin' | 'superadmin';

interface AdminInfo {
    email: string;
    role: AdminRole;
    expiresAt?: Date;
}

const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "possigee96@gmail.com").split(",");

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    const checkAdminStatus = async () => {
        setIsCheckingAdmin(true);
        if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
            setAdminInfo({ email: user.email, role: 'superadmin' });
            setIsCheckingAdmin(false);
            return;
        }

        const adminDocRef = doc(db, 'admins', user.uid);
        try {
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists()) {
                const adminData = adminDoc.data() as Omit<AdminInfo, 'email' | 'expiresAt'> & { expiresAt?: { toDate: () => Date } };
                
                // Anyone with a role of 'admin' or 'superadmin' is considered an admin
                if (adminData.role === 'admin' || adminData.role === 'superadmin') {
                    const now = new Date();
                    const expiresAt = adminData.expiresAt ? adminData.expiresAt.toDate() : undefined;

                    if (!expiresAt || expiresAt > now) {
                        setAdminInfo({ 
                            email: user.email!, 
                            role: adminData.role,
                            expiresAt: expiresAt
                        });
                    } else {
                        setAdminInfo(null); // Expired
                    }
                } else {
                    setAdminInfo(null); // Not an admin role
                }
            } else {
                setAdminInfo(null);
            }
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: adminDocRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Error checking admin status:", error);
            }
            setAdminInfo(null);
        } finally {
            setIsCheckingAdmin(false);
        }
    };

    checkAdminStatus();
  }, [user, loading, router]);
  
  if (loading || isCheckingAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!adminInfo) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
            <Link href="/" className="font-bold underline ml-2">Go to Homepage</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <AdminLayoutContent adminRole={adminInfo.role}>{children}</AdminLayoutContent>;
}


function AdminLayoutContent({ children, adminRole }: { children: React.ReactNode, adminRole: AdminRole }) {
  const pathname = usePathname();

  const menuItems = [
     {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
     {
      href: '/admin/orders',
      label: 'Orders',
      icon: ShoppingCart,
    },
    {
      href: '/admin/pre-orders',
      label: 'Pre-Orders',
      icon: ClipboardList,
    },
    {
      href: '/admin/products',
      label: 'Products',
      icon: Package,
    },
     {
      href: '/admin/products/import',
      label: 'Import/Export',
      icon: FileText,
    },
    {
      href: '/admin/products/bulk',
      label: 'Bulk Editor',
      icon: Package,
    },
     {
      href: '/admin/homepage-editor',
      label: 'Homepage',
      icon: Home,
    },
    {
      href: '/admin/vendors',
      label: 'Vendors',
      icon: Store,
    },
    {
      href: '/admin/customers',
      label: 'Customers',
      icon: Users,
    },
    {
      href: '/admin/refunds',
      label: 'Refunds',
      icon: RotateCw,
    },
     {
      href: '/admin/reviews',
      label: 'Reviews',
      icon: MessageSquare,
    },
    {
      href: '/admin/blog',
      label: 'Blog',
      icon: FileText,
    },
     {
      href: '/admin/coupons',
      label: 'Coupons',
      icon: Tag,
    },
     {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const getIsActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    if(href === '/'){
        return false;
    }
    return pathname.startsWith(href);
  }

  return (
      <SidebarProvider>
        <div className="md:hidden">
          <AdminBottomNavbar adminRole={adminRole}/>
        </div>
        <div className="hidden md:block">
          <Sidebar>
              <SidebarContent>
              <SidebarGroup>
                  <SidebarMenu>
                  {menuItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          asChild
                          isActive={getIsActive(item.href)}
                          tooltip={{ children: item.label }}
                      >
                          <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          </Link>
                      </SidebarMenuButton>
                      </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: 'Back to Shop' }}>
                        <Link href="/">
                            <Home />
                            <span>Back to Shop</span>
                        </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  </SidebarMenu>
              </SidebarGroup>
              </SidebarContent>
          </Sidebar>
        </div>
        <SidebarInset>
          <header className="p-4 flex items-center gap-2 border-b md:hidden">
              <h1 className="text-lg font-semibold">Admin Panel</h1>
          </header>
          <div className="p-4 md:p-6 pb-20 md:pb-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return <AdminAuthGuard>{children}</AdminAuthGuard>
}
