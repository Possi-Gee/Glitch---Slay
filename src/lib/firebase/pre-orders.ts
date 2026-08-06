import { db } from "../firebase";
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { PreOrder } from "@/types/pre-order";

const PRE_ORDERS_COLLECTION = "preOrders";

export const createPreOrder = async (orderData: Omit<PreOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, PRE_ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating pre-order: ", error);
    throw error;
  }
};

export const getPreOrderById = async (id: string) => {
  const docRef = doc(db, PRE_ORDERS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PreOrder;
  }
  return null;
};

export const updatePreOrderStatus = async (id: string, status: PreOrder['orderStatus']) => {
  const docRef = doc(db, PRE_ORDERS_COLLECTION, id);
  await updateDoc(docRef, {
    orderStatus: status,
    updatedAt: serverTimestamp(),
  });
};
