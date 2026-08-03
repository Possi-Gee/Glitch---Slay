
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, runTransaction, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { Product, Review } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Please select a rating." }).max(5),
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ProductReviewsProps {
  product: Product;
}

const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => onChange(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                ratingValue <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewForm = ({ productId, onReviewSubmit }: { productId: string, onReviewSubmit: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: '', comment: '' }
  });

  if (!user) {
    return (
      <div className="p-4 border rounded-lg text-center">
        <p className="text-muted-foreground">
          You must be <Link href={`/login?redirect=/product/${productId}`} className="text-primary underline">logged in</Link> to write a review.
        </p>
      </div>
    )
  }

  const onSubmit = async (data: ReviewFormValues) => {
    if (!user) return;

    const reviewId = doc(collection(db, 'reviews')).id;
    const reviewRef = doc(db, 'reviews', reviewId);
    const productRef = doc(db, 'products', productId);

    const newReview: Review = {
      id: reviewId,
      productId: productId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userImage: user.photoURL || undefined,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };

    try {
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw "Product not found!";
            }

            // Create the new review
            transaction.set(reviewRef, newReview);

            // Calculate the new average rating
            const currentReviews = productDoc.data().reviews || 0;
            const currentRating = productDoc.data().rating || 0;
            const newReviewsCount = currentReviews + 1;
            const newAverageRating = ((currentRating * currentReviews) + data.rating) / newReviewsCount;
            
            // Update the product with the new review count and average rating
            transaction.update(productRef, {
                reviews: newReviewsCount,
                rating: newAverageRating
            });
        });
        
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      reset();
      onReviewSubmit();
    } catch (e) {
      console.error("Error submitting review: ", e);
      toast({ title: "Submission Failed", description: "Could not submit your review. Please try again.", variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your thoughts about this product with other customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Your Rating</Label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
            />
            {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
          </div>
          <div>
            <Label htmlFor="title">Review Title</Label>
            <Input id="title" {...control.register('title')} placeholder="e.g., Best purchase ever!" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="comment">Your Review</Label>
            <Textarea id="comment" {...control.register('comment')} placeholder="Tell us more about your experience..." />
            {errors.comment && <p className="text-sm text-destructive mt-1">{errors.comment.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReviews: Review[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push(doc.data() as Review);
      });

      // Sort client-side to avoid requiring a Firestore composite index
      fetchedReviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setReviews(fetchedReviews);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [product.id]);

  const ratingSummary = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleReviewSubmit = () => {
    // This is a placeholder to potentially refetch data if needed,
    // but onSnapshot handles it automatically.
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        <div className="flex items-center gap-2">
            <StarRatingInput value={Math.round(product.rating)} onChange={() => {}} />
            <span className="font-bold">{product.rating.toFixed(1)} out of 5</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Based on {reviews.length} reviews</p>
        <div className="space-y-1 mt-4">
            {[5, 4, 3, 2, 1].map(star => {
                const count = ratingSummary[star] || 0;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                        <span>{star} star</span>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="w-8 text-right">{Math.round(percentage)}%</span>
                    </div>
                );
            })}
        </div>
        <Separator className="my-6" />
        <ReviewForm productId={product.id} onReviewSubmit={handleReviewSubmit} />
      </div>
      <div className="lg:col-span-2">
        <h3 className="text-xl font-bold mb-4">Showing {reviews.length} Reviews</h3>
        {loading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">There are no reviews for this product yet. Be the first!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="flex gap-4">
                <Avatar>
                  <AvatarImage src={review.userImage} alt={review.userName} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                     <h4 className="font-semibold">{review.userName}</h4>
                     <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                   <div className="flex items-center gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                    ))}
                  </div>
                  <h5 className="font-semibold">{review.title}</h5>
                  <p className="text-muted-foreground text-sm mt-1">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
