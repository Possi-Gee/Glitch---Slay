'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { Vendor } from '@/lib/vendor';

export function useVendorSession() {
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setVendor(null);
      setLoading(false);
      return;
    }

    const vendorsRef = collection(db, 'vendors');
    const q = query(vendorsRef, where('email', '==', user.email), limit(1));

    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setVendor({ uid: docSnap.id, ...docSnap.data() } as Vendor);
      } else {
        setVendor(null);
      }
    }).catch(() => {
      setVendor(null);
    }).finally(() => {
      setLoading(false);
    });
  }, [user, authLoading]);

  return { vendor, loading, isVendor: !!vendor };
}
