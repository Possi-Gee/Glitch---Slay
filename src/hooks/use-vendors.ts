'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vendor } from '@/lib/vendor';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vendorsCol = collection(db, 'vendors');
    const unsubscribe = onSnapshot(vendorsCol, (snapshot) => {
      const list: Vendor[] = [];
      snapshot.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as Vendor);
      });
      setVendors(list);
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveVendor = async (vendor: Vendor) => {
    const { uid, ...data } = vendor;
    await setDoc(doc(db, 'vendors', uid), data, { merge: true });
  };

  const deleteVendor = async (uid: string) => {
    await deleteDoc(doc(db, 'vendors', uid));
  };

  return { vendors, loading, saveVendor, deleteVendor };
}
