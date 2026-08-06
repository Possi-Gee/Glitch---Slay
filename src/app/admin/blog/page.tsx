'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import Image from 'next/image';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage?: string;
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
  const [coverImage, setCoverImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        setCoverImage(data.url);
        toast({ title: 'Image uploaded', description: 'Cover image ready.' });
      } catch (err: any) {
        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const openCreate = () => {
    setEditingId(null);
    setCoverImage('');
    form.reset({ title: '', slug: '', excerpt: '', content: '', author: 'Admin' });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setCoverImage(post.coverImage || '');
    form.reset({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, author: post.author });
    setDialogOpen(true);
  };

  const handleSave = async (data: PostForm) => {
    setSaving(true);
    try {
      const postId = editingId || doc(collection(db, 'blog_posts')).id;
      const postData: Record<string, any> = {
        ...data,
        slug: data.slug.toLowerCase().trim().replace(/\s+/g, '-'), // Normalize slug
        ...(coverImage ? { coverImage } : {}),
      };
      if (!editingId) {
        postData.publishedAt = new Date().toISOString();
        postData.createdAt = new Date().toISOString();
      }
      await setDoc(doc(db, 'blog_posts', postId), postData, { merge: true });
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
              <TableRow><TableHead>Cover</TableHead><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Author</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.coverImage ? (
                      <Image src={post.coverImage} alt={post.title} width={48} height={48} className="rounded object-cover w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
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
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No posts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              {coverImage ? (
                <div className="relative w-full rounded-md overflow-hidden border aspect-video bg-muted">
                  <Image src={coverImage} alt="Cover preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload a cover image</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP supported</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
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
              <Button type="submit" disabled={saving || uploadingImage}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
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



