'use client';

import { useState, useEffect, useReducer } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Review } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
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

type State = { reviews: Review[]; loading: boolean };
type Action = { type: 'SET_REVIEWS'; payload: Review[] } | { type: 'SET_LOADING'; payload: boolean } | { type: 'REMOVE_REVIEW'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_REVIEWS': return { reviews: action.payload, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'REMOVE_REVIEW': return { ...state, reviews: state.reviews.filter(r => r.id !== action.payload) };
    default: return state;
  }
};

export default function AdminReviewsPage() {
  const [state, dispatch] = useReducer(reducer, { reviews: [], loading: true });
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Review[] = [];
      snapshot.forEach(doc => data.push(doc.data() as Review));
      dispatch({ type: 'SET_REVIEWS', payload: data });
    }, () => {
      dispatch({ type: 'SET_LOADING', payload: false });
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'reviews', operation: 'list' }));
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'reviews', deleteId));
      dispatch({ type: 'REMOVE_REVIEW', payload: deleteId });
      toast({ title: 'Review deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete review.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Manage customer product reviews.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({state.reviews.length})</CardTitle>
          <CardDescription>View and manage customer feedback.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-mono text-xs">{review.productId.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{review.userName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span>{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{review.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{review.comment}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(review.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {state.reviews.length === 0 && !state.loading && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No reviews yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
