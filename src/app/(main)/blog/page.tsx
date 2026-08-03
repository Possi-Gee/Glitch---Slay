'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, ArrowRight, Loader2 } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  author: string;
  publishedAt: string;
  createdAt: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: BlogPost[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() as Omit<BlogPost, 'id'> }));
      setPosts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">Style tips, news, and updates from Glitch & Slay.</p>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.author}</span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
                  <CardDescription className="mt-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    Read More <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
