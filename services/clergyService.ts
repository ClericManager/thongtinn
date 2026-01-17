import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  setDoc,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ClergyMember, AoSInfoData } from "../types";

const COLLECTION_NAME = "clergy";
const SETTINGS_COLLECTION = "settings"; // Collection riêng cho cấu hình
const AOS_INFO_DOC_ID = "aos_info";

export const subscribeToClergy = (
  onData: (data: ClergyMember[]) => void,
  onError: (error: Error) => void
) => {
  if (!db) {
      onError(new Error("Firebase not initialized"));
      return () => {};
  }

  const unsubscribe = onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot: QuerySnapshot<DocumentData>) => {
      const clergyList: ClergyMember[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClergyMember));
      onData(clergyList);
    },
    (error) => {
      console.error("Error fetching clergy:", error);
      onError(error);
    }
  );

  return unsubscribe;
};

export const addClergyMember = async (clergy: ClergyMember) => {
  if (!db) throw new Error("Firebase not initialized");
  // Remove ID if present to let Firestore generate it
  const { id, ...data } = clergy;
  await addDoc(collection(db, COLLECTION_NAME), data);
};

export const updateClergyMember = async (id: string, clergy: ClergyMember) => {
  if (!db) throw new Error("Firebase not initialized");
  if (!id) throw new Error("Missing Document ID for update");
  const clergyRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(clergyRef, { ...clergy });
};

export const deleteClergyMember = async (id: string) => {
  if (!db) throw new Error("Firebase not initialized");
  if (!id) throw new Error("Invalid ID: Cannot delete document without an ID.");
  
  const clergyRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(clergyRef);
};

// --- AOS INFO SERVICES ---

export const getAoSInfo = async (): Promise<AoSInfoData | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AOS_INFO_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AoSInfoData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching AoS Info:", error);
    return null;
  }
};

export const updateAoSInfo = async (data: AoSInfoData) => {
  if (!db) throw new Error("Firebase not initialized");
  const docRef = doc(db, SETTINGS_COLLECTION, AOS_INFO_DOC_ID);
  // Sử dụng setDoc với merge: true để tạo nếu chưa có hoặc cập nhật nếu đã có
  await setDoc(docRef, data, { merge: true });
};