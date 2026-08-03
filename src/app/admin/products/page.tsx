
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Product } from '@/lib/products';
import { useProduct } from '@/hooks/use-product';
import { useVendors } from '@/hooks/use-vendors';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';


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
import { Textarea } from '@/components/ui/textarea';
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
import { PlusCircle, Loader2, Bot, Edit, Trash2, Search, Package, Upload, Camera } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CameraCapture } from '@/components/camera-capture';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';


// Helper function to generate unique IDs
const generateUniqueId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  originalPrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Product name is required'),
  description: z.string().min(10, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url().or(z.string().startsWith('data:image'))).min(1, 'At least one product image is required.').max(5, 'A maximum of 5 images are allowed.'),
  features: z.string().optional(),
  rating: z.coerce.number().min(0).max(5, 'Rating must be between 0 and 5').default(0),
  reviews: z.coerce.number().min(0).default(0),
  isOfficialStore: z.boolean().default(false),
  vendorId: z.string().optional(),
  variants: z.array(variantSchema).min(1, 'At least one product variant is required.'),
});

type ProductFormValues = z.infer<typeof productSchema>;


export default function AdminProductsPage() {
  const { state: productState } = useProduct();
  const { products } = productState;
  const { vendors } = useVendors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  const uniqueCategories = useMemo(() => {
    const baseCategories = [
      "kitchen ware, and utensils",
      "Sewing accessories",
      "Bedsheets",
      "Slippers and shoes",
      "Bubu",
      "Kids wear",
      "Cosmetics",
      "Fabrics",
      "African prints",
    ];
    const allCategories = new Set([...baseCategories, ...products.map((p) => p.category)]);
    return Array.from(allCategories).sort();
  }, [products]);
  
  const categories = useMemo(() => {
    return ['All', ...uniqueCategories];
  }, [uniqueCategories]);


  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isOfficialStore: false,
      rating: 0,
      reviews: 0,
      vendorId: '',
      variants: [{ name: 'Standard', price: 0, stock: 0, id: generateUniqueId() }],
      images: [],
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
    keyName: "fieldId" // Use a different key name to avoid conflicts
  });
  
  const images = watch('images');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const productName = watch('name');
  const features = watch('features');
  const variants = watch('variants');
  const singleItemVariantIndex = variants.findIndex(v => v.name === 'Single');
  const isSoldAsSingleItem = singleItemVariantIndex !== -1;

  const handleToggleSingleItemSale = (checked: boolean) => {
    setTimeout(() => {
        if (checked) {
            if (!isSoldAsSingleItem) {
                append({ name: 'Single', price: 0, stock: 0, originalPrice: 0, id: generateUniqueId() });
            }
        } else {
            if (isSoldAsSingleItem) {
                if (getValues('variants').length > 1) {
                    remove(singleItemVariantIndex);
                } else {
                    toast({
                        title: "Cannot Remove",
                        description: "You must have at least one variant for a product.",
                        variant: 'destructive',
                    });
                    setValue('variants', getValues('variants')); 
                }
            }
        }
    }, 0);
  };


  const handleGenerateDescription = async () => {
    if (!productName || !features) {
      toast({
        title: 'Missing Details',
        description: 'Please enter a product name and some features to generate a description.',
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productName,
        features,
        numVariations: 1,
      });
      if (result.descriptions && result.descriptions.length > 0) {
        setValue('description', result.descriptions[0], { shouldValidate: true });
        toast({ title: 'Success', description: 'Generated product description.' });
      } else {
        throw new Error('No description was generated.');
      }
    } catch {
       toast({
        title: 'Error',
        description: 'Failed to generate description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetDialog = useCallback(() => {
    reset({
      isOfficialStore: false,
      rating: 0,
      reviews: 0,
      variants: [{ name: 'Standard', price: 0, stock: 0, id: generateUniqueId() }],
      name: '',
      description: '',
      category: '',
      images: [],
      features: '',
    });
    setEditingProduct(null);
  }, [reset]);

  useEffect(() => {
    if (!isDialogOpen) {
      resetDialog();
    }
  }, [isDialogOpen, resetDialog]);


  const onSubmit = async (data: ProductFormValues) => {
    const isEditing = !!editingProduct;
    const selectedVendor = data.vendorId ? vendors.find((v) => v.uid === data.vendorId) : null;
    const productData = {
      ...data,
      variants: data.variants.map(v => ({...v, id: v.id || generateUniqueId()}))
    }
    delete productData.vendorId;

    const finalProduct: Product = {
      id: editingProduct?.id || generateUniqueId(),
      ...productData,
      vendor: selectedVendor ? { vendorId: selectedVendor.uid, storeName: selectedVendor.storeName, verified: selectedVendor.verified } : undefined,
      dataAiHint: `${data.category.toLowerCase()} product`
    };

    const productRef = doc(db, 'products', finalProduct.id.toString());
    
    setDoc(productRef, finalProduct, { merge: true }).catch(_serverError => {
        const permissionError = new FirestorePermissionError({
            path: productRef.path,
            operation: isEditing ? 'update' : 'create',
            requestResourceData: finalProduct
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    toast({
      title: isEditing ? 'Product Updated' : 'Product Added',
      description: `${finalProduct.name} has been successfully saved.`,
    });

    setIsDialogOpen(false);
  };
  
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    const productWithVariantIds = {
        ...product,
        variants: product.variants.map(v => ({ ...v, id: v.id || generateUniqueId() }))
    };
    reset(productWithVariantIds);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
        const productRef = doc(db, "products", productToDelete.id.toString());
        deleteDoc(productRef).catch(_serverError => {
            const permissionError = new FirestorePermissionError({
                path: productRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        toast({
            title: 'Product Deletion Initiated',
            description: `Attempting to delete ${productToDelete.name}.`,
            variant: 'destructive',
        });
    }
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const getProductPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return 'N/A';
    }
    const prices = product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `GH₵${minPrice.toFixed(2)}`;
    }
    return `GH₵${minPrice.toFixed(2)} - GH₵${maxPrice.toFixed(2)}`;
  };
  
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterCategory !== 'All') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return Math.min(...a.variants.map(v => v.price)) - Math.min(...b.variants.map(v => v.price));
        case 'price-desc':
          return Math.max(...b.variants.map(v => v.price)) - Math.max(...a.variants.map(v => v.price));
        default:
          return 0;
      }
    });

    return filtered;

  }, [products, searchTerm, filterCategory, sortBy]);
  
  const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

  const handleImageAdd = async (imageDataUri: string) => {
     if (imageDataUri.length > MAX_IMAGE_SIZE_BYTES) {
        toast({
            title: "Image Too Large",
            description: "Please upload an image smaller than 4 MB.",
            variant: "destructive",
        });
        return;
    }

    const currentImages = getValues('images') || [];
    if (currentImages.length >= 5) {
        toast({
            title: 'Image Limit Reached',
            description: 'You can only add a maximum of 5 images.',
            variant: 'destructive',
        });
        return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUri }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setValue('images', [...currentImages, data.url], { shouldValidate: true, shouldDirty: true });
      toast({
          title: "Image Uploaded",
          description: "Image uploaded successfully to Cloudinary.",
      });
    } catch (error: any) {
      console.error("Cloudinary upload failed:", error);
      toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image to Cloudinary.",
          variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const handleImageRemove = (index: number) => {
    const currentImages = getValues('images') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
  }


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUri = e.target?.result as string;
        if (imageDataUri) {
          handleImageAdd(imageDataUri);
        }
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCameraCapture = (imageDataUri: string) => {
    handleImageAdd(imageDataUri);
    setIsCameraOpen(false);
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Package className="h-8 w-8" />
           <div>
              <h1 className="text-3xl font-bold">Products</h1>
              <p className="text-muted-foreground">Manage your product inventory.</p>
           </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the details below.' : 'Fill in the details below to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} id="product-form" className="px-6 py-4 grid gap-6">
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" {...register('name')} />
                      {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueCategories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                      </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="features">Features</Label>
                     <Textarea id="features" {...register('features')} placeholder="e.g., Bluetooth 5.2, 30-hour battery" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} />
                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating || !productName || !features} className="mt-2">
                      {isGenerating ? <><Loader2 className="mr-2 animate-spin"/> Generating...</> : <><Bot className="mr-2"/> Generate with AI</>}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="rating">Rating (0-5)</Label>
                          <Input id="rating" type="number" step="0.1" {...register('rating')} />
                          {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="reviews">Reviews</Label>
                          <Input id="reviews" type="number" {...register('reviews')} />
                          {errors.reviews && <p className="text-sm text-destructive mt-1">{errors.reviews.message}</p>}
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Controller
                            name="isOfficialStore"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="isOfficialStore"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                      <Label htmlFor="isOfficialStore">Official Store</Label>
                       </div>
                       <div className="space-y-2 pt-6">
                           <Label htmlFor="vendorId">Vendor</Label>
                           <Controller
                               name="vendorId"
                               control={control}
                               render={({ field }) => (
                                   <Select onValueChange={field.onChange} value={field.value || ''}>
                                       <SelectTrigger id="vendorId">
                                           <SelectValue placeholder="No vendor (store default)" />
                                       </SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="">No vendor (store default)</SelectItem>
                                           {vendors.map((v) => (
                                               <SelectItem key={v.uid} value={v.uid}>
                                                   {v.storeName} {v.verified ? '✓' : ''}
                                               </SelectItem>
                                           ))}
                                       </SelectContent>
                                   </Select>
                               )}
                           />
                       </div>
                   </div>
                 </div>

                <div className="space-y-4">
                  <Label>Images</Label>
                  <Card className="p-4 bg-background space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                       {images?.map((image, index) => (
                        <div key={`image-${index}-${image.substring(0, 10)}`} className="relative group aspect-square">
                            {image && (
                              <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  fill
                                  sizes="100px"
                                  className="rounded-md object-cover"
                              />
                            )}
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleImageRemove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                       <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                       <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {isUploading ? 'Uploading...' : 'Upload from Device'}
                       </Button>
                       <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Use Camera
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Capture Image</DialogTitle>
                                    <DialogDescription>
                                        Position the product in the frame and click capture.
                                    </DialogDescription>
                                </DialogHeader>
                                <CameraCapture onCapture={handleCameraCapture} />
                            </DialogContent>
                        </Dialog>
                    </div>
                    {errors.images && <p className="text-sm text-destructive mt-1">{errors.images.message || (errors.images as any)._errors.join(', ')}</p>}
                  </Card>
                </div>

                <div className="space-y-4">
                    <Separator />
                    <div>
                        <h3 className="text-lg font-medium">Product Options</h3>
                         <p className="text-sm text-muted-foreground">Define how this product can be purchased.</p>
                        {errors.variants && <p className="text-sm text-destructive mt-1">{typeof errors.variants.message === 'string' ? errors.variants.message : 'Please check variant details.'}</p>}
                    </div>
                    
                    <Card className="p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="single-item-sale" className="font-medium">Sell as individual item</Label>
                        <Switch
                          id="single-item-sale"
                          checked={isSoldAsSingleItem}
                          onCheckedChange={handleToggleSingleItemSale}
                        />
                      </div>
                      {isSoldAsSingleItem && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                            <input type="hidden" {...register(`variants.${singleItemVariantIndex}.name`)} value="Single" />
                             <div>
                                <Label>Price</Label>
                                <Input type="number" {...register(`variants.${singleItemVariantIndex}.price`)} step="0.01" />
                                {errors.variants?.[singleItemVariantIndex]?.price && <p className="text-sm text-destructive mt-1">{errors.variants[singleItemVariantIndex]?.price?.message}</p>}
                            </div>
                            <div>
                                <Label>Original Price (Optional)</Label>
                                <Input type="number" {...register(`variants.${singleItemVariantIndex}.originalPrice`)} step="0.01" />
                            </div>
                            <div>
                                <Label>Stock</Label>
                                <Input type="number" {...register(`variants.${singleItemVariantIndex}.stock`)} />
                                 {errors.variants?.[singleItemVariantIndex]?.stock && <p className="text-sm text-destructive mt-1">{errors.variants[singleItemVariantIndex]?.stock?.message}</p>}
                            </div>
                        </div>
                      )}
                    </Card>

                    <div className="space-y-4">
                        <h4 className="font-medium">Add Packs or Bundles</h4>
                        {fields.map((field, index) => {
                            if (field.name === 'Single') return null;
                            return (
                            <Card key={field.id || `variant-${index}-${field.name}`} className="p-4 bg-muted/20 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="lg:col-span-4">
                                        <Label>Pack/Bundle Name</Label>
                                        <Input {...register(`variants.${index}.name`)} placeholder="e.g., Large, Red, 12-Pack" />
                                        {errors.variants?.[index]?.name && <p className="text-sm text-destructive mt-1">{errors.variants?.[index]?.name?.message}</p>}
                                    </div>
                                    <div>
                                        <Label>Price</Label>
                                        <Input type="number" {...register(`variants.${index}.price`)} step="0.01" />
                                        {errors.variants?.[index]?.price && <p className="text-sm text-destructive mt-1">{errors.variants?.[index]?.price?.message}</p>}
                                    </div>
                                    <div>
                                        <Label>Original Price (Optional)</Label>
                                        <Input type="number" {...register(`variants.${index}.originalPrice`)} step="0.01" />
                                    </div>
                                    <div>
                                        <Label>Stock</Label>
                                        <Input type="number" {...register(`variants.${index}.stock`)} />
                                        {errors.variants?.[index]?.stock && <p className="text-sm text-destructive mt-1">{errors.variants?.[index]?.stock?.message}</p>}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                    onClick={() => remove(index)}
                                    disabled={fields.filter(f => f.name !== 'Single').length <= 0 && !isSoldAsSingleItem}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        )})}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: '', price: 0, stock: 0, id: generateUniqueId() })}
                    >
                        <PlusCircle className="mr-2" />
                        Add Pack/Bundle
                    </Button>
                </div>
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" form="product-form" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 animate-spin" />}
                {isUploading ? 'Uploading Image...' : editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       <Card>
         <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>
                Filter, sort, and manage all your products.
            </CardDescription>
            <div className="pt-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Search product name..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                    {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                 <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name-asc">Name: A-Z</SelectItem>
                        <SelectItem value="name-desc">Name: Z-A</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
         </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedProducts.length > 0 ? filteredAndSortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={(product.images && product.images.length > 0) ? product.images[0] : 'https://picsum.photos/60/60'}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                      data-ai-hint={product.dataAiHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{getProductPrice(product)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEditClick(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No products found.
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
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}".
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
