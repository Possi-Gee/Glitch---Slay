
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.62-4.88 1.62-4.41 0-7.99-3.59-7.99-7.99s3.58-7.99 7.99-7.99c2.27 0 4.13.88 5.61 2.29l-2.2 2.2c-1.39-1.31-3.2-2.2-5.61-2.2-3.41 0-6.17 2.76-6.17 6.17s2.76 6.17 6.17 6.17c2.09 0 3.65-.88 4.79-1.98.92-.92 1.4-2.36 1.58-4.26H12.48z"
    />
  </svg>
);

export function LoginPageClient() {
  const { state: settings } = useSiteSettings();
  const { signup, login, loginWithGoogle, loginWithApple } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);


  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors, isSubmitting: isLoggingIn } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const { register: registerSignup, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors, isSubmitting: isSigningUp } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });


  const onLogin: SubmitHandler<LoginValues> = async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onSignup: SubmitHandler<SignupValues> = async ({ name, email, password }) => {
    setError(null);
    try {
      await signup(email, password, name);
      toast({ title: 'Signup Successful', description: 'Your account has been created.' });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (e: any) {
      setError(e.message);
    }
  };
  
  const handleGoogleLogin = async () => {
    setError(null);
    try {
        await loginWithGoogle();
        toast({ title: 'Login Successful', description: 'Welcome!' });
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
    } catch(e: any) {
        setError(e.message);
    }
  }

  const handleAppleLogin = async () => {
    setError(null);
    try {
        await loginWithApple();
        toast({ title: 'Login Successful', description: 'Welcome!' });
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
    } catch(e: any) {
        setError(e.message);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({
            title: 'Email Required',
            description: 'Please enter the email address for your account.',
            variant: 'destructive',
        });
        return;
    }
    setIsResettingPassword(true);
    setError(null);
    try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: 'Check your inbox for a password reset link.',
        });
        setResetEmail('');
        document.getElementById('reset-password-cancel')?.click();
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsResettingPassword(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2">
                 {settings.logoUrl ? (
                    <Image src={settings.logoUrl} alt={settings.appName} width={40} height={40} className="rounded-md object-contain" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-primary" />
                )}
                <span className="text-2xl font-bold">{settings.appName}</span>
            </Link>
        </div>
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" {...registerLogin('email')} />
                  {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="link" className="h-auto p-0 text-xs">Forgot Password?</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter your email address below and we'll send you a link to reset your password.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">Email Address</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel id="reset-password-cancel">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePasswordReset} disabled={isResettingPassword}>
                                        {isResettingPassword && <Loader2 className="mr-2 animate-spin" />}
                                        Send Reset Link
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  <Input id="login-password" type="password" {...registerLogin('password')} />
                   {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn && <Loader2 className="mr-2 animate-spin" />}
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Enter your details to create a new account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input id="signup-name" type="text" placeholder="John Doe" {...registerSignup('name')} />
                {signupErrors.name && <p className="text-sm text-destructive">{signupErrors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="m@example.com" {...registerSignup('email')} />
                {signupErrors.email && <p className="text-sm text-destructive">{signupErrors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...registerSignup('password')} />
                {signupErrors.password && <p className="text-sm text-destructive">{signupErrors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp && <Loader2 className="mr-2 animate-spin" />}
                  Create Account
              </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OR CONTINUE WITH</span>
      </div>
        <div className="grid grid-cols-1 gap-4">
          <Button variant="outline" onClick={handleGoogleLogin}>
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <Button variant="outline" onClick={handleAppleLogin}>
            <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.15,1.9A5.86,5.86,0,0,0,8.83,4.3a5.52,5.52,0,0,1,1.52,4.2,5.89,5.89,0,0,1-3.32,5.24,6.22,6.22,0,0,0,3.52,10.29,6.07,6.07,0,0,0,4.15-1.74,5.77,5.77,0,0,0,3.31,1.74,6.22,6.22,0,0,0,3.52-10.29,5.89,5.89,0,0,1-3.32-5.24,5.52,5.52,0,0,1,1.52-4.2A5.86,5.86,0,0,0,12.15,1.9Z" />
            </svg>
            Continue with Apple
          </Button>
        </div>
      </div>
    </div>
  );
}

    