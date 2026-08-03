'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, User, ArrowLeft, Loader2 } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  author: string;
  publishedAt: string;
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setPost({ id: doc.id, ...doc.data() as Omit<BlogPost, 'id'> });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [slug]);

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Post Not Found</h1>
        <Button asChild className="mt-4"><Link href="/blog">Back to Blog</Link></Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
      </Button>

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(post.publishedAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.author}</span>
        </div>
      </header>

      <div className="prose prose-sm max-w-none">
        {post.content.split('\n').map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed text-foreground/80">{p}</p>
        ))}
      </div>
    </article>
  );
}
