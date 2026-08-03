
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, Heart, LogOut, Loader2, ShieldAlert, ShieldX, Mail, KeyRound } from 'lucide-react';
import { ProfileListItem } from '@/components/profile-list-item';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  password: { label: 'Email & Password', color: 'bg-blue-500' },
  'google.com': { label: 'Google', color: 'bg-red-500' },
  'apple.com': { label: 'Apple', color: 'bg-gray-600' },
};

export default function ProfilePage() {
  const { user, loading, logout, updateUserProfile, updateUserPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isEmailProvider = user?.providerData.some(p => p.providerId === 'password');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
    if (user) {
      profileForm.reset({ displayName: user.displayName || '' });
    }
  }, [user, loading, router, profileForm]);

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    try {
      await updateUserProfile(data.displayName);
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async (data: PasswordFormValues) => {
    try {
      await updateUserPassword(data.newPassword, data.currentPassword);
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      passwordForm.reset();
    } catch (error: any) {
       toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="text-center space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Account</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4"><Skeleton className="h-6 w-full" /></div>
                <div className="p-4"><Skeleton className="h-6 w-full" /></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{user.displayName || 'Anonymous User'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center justify-center gap-2">
              {user.providerData.map((p, i) => {
                const info = PROVIDER_LABELS[p.providerId] || { label: p.providerId, color: 'bg-gray-400' };
                return (
                  <Badge key={i} className={`${info.color} text-white border-0 text-[10px] flex items-center gap-1`}>
                    <ShieldAlert className="h-3 w-3" />
                    {info.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Account</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              <ProfileListItem href="/orders" icon={History} label="My Orders" />
              <ProfileListItem href="/wishlist" icon={Heart} label="My Wishlist" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Profile Details</CardTitle>
              <CardDescription>Your account information and sign-in method.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEmailProvider} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email || ''} disabled />
                  </div>
                   {!isEmailProvider && (
                    <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <ShieldX className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
                            You're signed in with a social provider. Your profile name and email are managed there — changes made here won't stick.
                        </AlertDescription>
                    </Alert>
                    )}
                  {isEmailProvider && (
                      <div className="flex justify-end">
                          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                              {profileForm.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                              Save Changes
                          </Button>
                      </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

           {isEmailProvider ? (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change Password</CardTitle>
                    <CardDescription>Enter your current password, then choose a strong new one.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                    <Input type="password" {...field} placeholder="Enter your current password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="border-t pt-4 space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} placeholder="At least 6 characters" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} placeholder="Repeat your new password" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                    {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                        <ShieldX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                            You signed in with a social account, so there&apos;s no password to manage. Use your social provider to handle security.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
            )}


          <Card>
            <CardContent className="p-0">
              <div onClick={handleLogout} className="cursor-pointer">
                <ProfileListItem href="#" icon={LogOut} label="Log Out" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
