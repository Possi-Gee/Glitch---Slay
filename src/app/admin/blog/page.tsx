'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  createdAt: string;
};

const postSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  author: z.string().min(2),
});

type PostForm = z.infer<typeof postSchema>;

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PostForm>({ resolver: zodResolver(postSchema), defaultValues: { title: '', slug: '', excerpt: '', content: '', author: 'Admin' } });

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: BlogPost[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() as Omit<BlogPost, 'id'> }));
      setPosts(data);
      setLoading(false);
    }, () => {
      setLoading(false);
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'blog_posts', operation: 'list' }));
    });
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.reset({ title: '', slug: '', excerpt: '', content: '', author: 'Admin' });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    form.reset({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, author: post.author });
    setDialogOpen(true);
  };

  const handleSave = async (data: PostForm) => {
    setSaving(true);
    try {
      const postId = editingId || doc(collection(db, 'blog_posts')).id;
      await setDoc(doc(db, 'blog_posts', postId), {
        ...data,
        publishedAt: editingId ? undefined : new Date().toISOString(),
        createdAt: editingId ? undefined : new Date().toISOString(),
      });
      toast({ title: editingId ? 'Post updated' : 'Post created' });
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save post.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', deleteId));
      setPosts(p => p.filter(post => post.id !== deleteId));
      toast({ title: 'Post deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Blog Posts</h1>
            <p className="text-muted-foreground">Manage your blog content.</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Post</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Author</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">/{post.slug}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell className="text-sm">{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(post.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No posts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input {...form.register('title')} placeholder="Post title" />
              {form.formState.errors.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <Label>Slug</Label>
              <Input {...form.register('slug')} placeholder="my-post-slug" />
              {form.formState.errors.slug && <p className="text-xs text-destructive mt-1">{form.formState.errors.slug.message}</p>}
            </div>
            <div>
              <Label>Author</Label>
              <Input {...form.register('author')} />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea {...form.register('excerpt')} rows={2} placeholder="Short summary" />
              {form.formState.errors.excerpt && <p className="text-xs text-destructive mt-1">{form.formState.errors.excerpt.message}</p>}
            </div>
            <div>
              <Label>Content</Label>
              <Textarea {...form.register('content')} rows={8} placeholder="Write your post content here..." />
              {form.formState.errors.content && <p className="text-xs text-destructive mt-1">{form.formState.errors.content.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Post</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
