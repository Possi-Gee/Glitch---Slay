'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVendors } from '@/hooks/use-vendors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Loader2, PlusCircle, Trash2, CheckCircle, ShieldX, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Vendor } from '@/lib/vendor';

const vendorSchema = z.object({
  uid: z.string().min(1, 'User UID is required'),
  email: z.string().email('Valid email is required'),
  displayName: z.string().min(1, 'Display name is required'),
  storeName: z.string().min(1, 'Store name is required'),
  verified: z.boolean().default(false),
});

type VendorForm = z.infer<typeof vendorSchema>;

export default function AdminVendorsPage() {
  const { vendors, loading, saveVendor, deleteVendor } = useVendors();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { uid: '', email: '', displayName: '', storeName: '', verified: false },
  });

  const openCreate = () => {
    setEditingVendor(null);
    reset({ uid: '', email: '', displayName: '', storeName: '', verified: false });
    setDialogOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    reset({ uid: v.uid, email: v.email, displayName: v.displayName, storeName: v.storeName, verified: v.verified });
    setDialogOpen(true);
  };

  const onSubmit = async (data: VendorForm) => {
    try {
      await saveVendor(data as Vendor);
      toast({ title: editingVendor ? 'Vendor Updated' : 'Vendor Added', description: `${data.storeName} has been saved.` });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteVendor(uid);
      toast({ title: 'Vendor Removed', description: 'The vendor has been deleted.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleVerified = async (v: Vendor) => {
    try {
      await saveVendor({ ...v, verified: !v.verified });
      toast({ title: v.verified ? 'Verification Removed' : 'Vendor Verified', description: `${v.storeName} is now ${v.verified ? 'unverified' : 'verified'}.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = vendors.filter((v) =>
    v.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Store className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Vendors</h1>
            <p className="text-muted-foreground mt-1">Manage vendors and verify their store status.</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><PlusCircle className="mr-2" /> Add Vendor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
              <DialogDescription>Enter the vendor&apos;s details. The UID must match their Firebase Auth UID.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uid">Firebase UID</Label>
                <Input id="uid" {...register('uid')} disabled={!!editingVendor} placeholder="User's Firebase Auth UID" />
                {errors.uid && <p className="text-sm text-destructive">{errors.uid.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="vendor@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" {...register('displayName')} placeholder="John Doe" />
                  {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" {...register('storeName')} placeholder="John's Fashion" />
                  {errors.storeName && <p className="text-sm text-destructive">{errors.storeName.message}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {watch('verified') ? <CheckCircle className="h-5 w-5 text-green-600" /> : <ShieldX className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">Verified Vendor</p>
                    <p className="text-xs text-muted-foreground">Shows a verified badge on their products.</p>
                  </div>
                </div>
                <input type="hidden" {...register('verified')} />
                <Switch checked={watch('verified')} onCheckedChange={(c) => setValue('verified', c)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p>{searchTerm ? 'No vendors match your search.' : 'No vendors yet. Add your first vendor to get started.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.uid}>
                    <TableCell className="font-medium">{v.storeName}</TableCell>
                    <TableCell>{v.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{v.email}</TableCell>
                    <TableCell>
                      {v.verified ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <ShieldX className="h-3 w-3" /> Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleVerified(v)}>
                          {v.verified ? 'Unverify' : 'Verify'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(v)}>Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Vendor?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {v.storeName}. Products linked to this vendor will no longer show a verified badge.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(v.uid)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
