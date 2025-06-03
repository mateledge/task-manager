// lib/firestore.ts
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

const TASKS_COLLECTION = "tasks";

// データ追加
export const saveTaskToFirestore = async (task: any) => {
  await addDoc(collection(db, TASKS_COLLECTION), task);
};

// データ取得
export const fetchTasksFromFirestore = async () => {
  const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// データ更新
export const updateTaskInFirestore = async (id: string, updatedTask: any) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(taskRef, updatedTask);
};

// データ削除
export const deleteTaskFromFirestore = async (id: string) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
};
