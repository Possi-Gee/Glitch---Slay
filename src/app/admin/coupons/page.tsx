'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import type { Coupon } from '@/lib/coupon';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, Edit, Trash2, Search, Tag, MoreHorizontal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

type CouponState = {
  coupons: Coupon[];
  loading: boolean;
};

type CouponAction =
  | { type: 'SET_COUPONS'; payload: Coupon[] }
  | { type: 'SET_LOADING'; payload: boolean };

const couponReducer = (state: CouponState, action: CouponAction): CouponState => {
  switch (action.type) {
    case 'SET_COUPONS':
      return { ...state, coupons: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const generateUniqueId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const couponSchema = z.object({
  code: z.string().min(3, 'Coupon code is required').toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(0.01, 'Value must be greater than 0'),
  minOrderAmount: z.coerce.number().min(0, 'Minimum order amount cannot be negative'),
  maxUses: z.coerce.number().min(0, 'Max uses cannot be negative'),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  isActive: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function AdminCouponsPage() {
  useAuth();
  const [state, dispatch] = useReducer(couponReducer, { coupons: [], loading: true });
  const { coupons } = state;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const couponsCol = collection(db, 'coupons');
    const unsubscribe = onSnapshot(couponsCol, (querySnapshot) => {
      const couponsData: Coupon[] = [];
      querySnapshot.forEach((doc) => {
        couponsData.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      dispatch({ type: 'SET_COUPONS', payload: couponsData });
    }, (_error) => {
      dispatch({ type: 'SET_LOADING', payload: false });
      const permissionError = new FirestorePermissionError({
        path: 'coupons',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      minOrderAmount: 0,
      maxUses: 0,
      expiresAt: '',
      isActive: true,
    },
  });

  const resetDialog = useCallback(() => {
    reset({
      code: '',
      type: 'percentage',
      value: 0,
      minOrderAmount: 0,
      maxUses: 0,
      expiresAt: '',
      isActive: true,
    });
    setEditingCoupon(null);
  }, [reset]);

  useEffect(() => {
    if (!isDialogOpen) {
      resetDialog();
    }
  }, [isDialogOpen, resetDialog]);

  const onSubmit = async (data: CouponFormValues) => {
    const couponData = {
      ...data,
      currentUses: editingCoupon?.currentUses || 0,
      usedBy: editingCoupon?.usedBy || [],
      createdAt: editingCoupon?.createdAt || new Date().toISOString(),
    };

    const finalCoupon: Coupon = {
      id: editingCoupon?.id || generateUniqueId(),
      ...couponData,
    };

    const couponRef = doc(db, 'coupons', finalCoupon.id);

    setDoc(couponRef, finalCoupon, { merge: true }).catch((_serverError) => {
      const permissionError = new FirestorePermissionError({
        path: couponRef.path,
        operation: editingCoupon ? 'update' : 'create',
        requestResourceData: finalCoupon,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    toast({
      title: editingCoupon ? 'Coupon Updated' : 'Coupon Created',
      description: `Coupon ${finalCoupon.code} has been successfully saved.`,
    });

    setIsDialogOpen(false);
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt.split('T')[0],
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (couponToDelete) {
      const couponRef = doc(db, 'coupons', couponToDelete.id);
      deleteDoc(couponRef).catch((_serverError) => {
        const permissionError = new FirestorePermissionError({
          path: couponRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      toast({
        title: 'Coupon Deletion Initiated',
        description: `Attempting to delete coupon ${couponToDelete.code}.`,
        variant: 'destructive',
      });
    }
    setIsDeleteConfirmOpen(false);
    setCouponToDelete(null);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const couponRef = doc(db, 'coupons', coupon.id);
    setDoc(couponRef, { isActive: !coupon.isActive }, { merge: true }).catch((_serverError) => {
      const permissionError = new FirestorePermissionError({
        path: couponRef.path,
        operation: 'update',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground">Manage your discount coupons.</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? 'Update the coupon details below.' : 'Fill in the details below to create a new coupon.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} id="coupon-form" className="px-6 py-4 grid gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Coupon Code</Label>
                      <Input id="code" {...register('code')} placeholder="e.g., SAVE10" />
                      {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Discount Type</Label>
                      <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="value">
                        {control._formValues.type === 'fixed' ? 'Discount Amount (GH₵)' : 'Discount Percentage (%)'}
                      </Label>
                      <Input id="value" type="number" step="0.01" {...register('value')} />
                      {errors.value && <p className="text-sm text-destructive mt-1">{errors.value.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrderAmount">Minimum Order Amount (GH₵)</Label>
                      <Input id="minOrderAmount" type="number" step="0.01" {...register('minOrderAmount')} />
                      {errors.minOrderAmount && <p className="text-sm text-destructive mt-1">{errors.minOrderAmount.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Max Uses (0 = Unlimited)</Label>
                      <Input id="maxUses" type="number" {...register('maxUses')} />
                      {errors.maxUses && <p className="text-sm text-destructive mt-1">{errors.maxUses.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expiry Date</Label>
                      <Input id="expiresAt" type="date" {...register('expiresAt')} />
                      {errors.expiresAt && <p className="text-sm text-destructive mt-1">{errors.expiresAt.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" form="coupon-form" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            View and manage all discount coupons.
          </CardDescription>
          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search coupon code..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell className="capitalize">{coupon.type}</TableCell>
                  <TableCell>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `GH₵${coupon.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {coupon.maxUses === 0
                      ? `${coupon.currentUses} / ∞`
                      : `${coupon.currentUses} / ${coupon.maxUses}`}
                  </TableCell>
                  <TableCell>
                    <span className={isExpired(coupon.expiresAt) ? 'text-destructive' : ''}>
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          coupon.isActive && !isExpired(coupon.expiresAt)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coupon.isActive && !isExpired(coupon.expiresAt) ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => handleToggleActive(coupon)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEditClick(coupon)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(coupon)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No coupons found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the coupon
              "{couponToDelete?.code}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
