import { db } from './config';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs, where
} from 'firebase/firestore';

export const COLLECTIONS = {
  MEETINGS: 'meetings',
  NOTES: 'notes',
  ANNOUNCEMENTS: 'announcements',
  ROSTER: 'roster',
  USERS: 'users',
};

export const userReportsRef = (uid) =>
  collection(db, COLLECTIONS.USERS, uid, 'reports');

export const userDocRef = (uid) =>
  doc(db, COLLECTIONS.USERS, uid);

export async function getUserDoc(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : {};
}

export async function saveUserDoc(uid, data) {
  await setDoc(userDocRef(uid), data, { merge: true });
}

export function watchCollection(collectionName, onData, queryConstraints = []) {
  const q = query(collection(db, collectionName), ...queryConstraints);
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    createdAtISO: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateDocument(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function addUserReport(uid, data) {
  const ref = await addDoc(userReportsRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    createdAtISO: new Date().toISOString(),
  });
  return ref.id;
}

export function watchUserReports(uid, onData) {
  const q = query(userReportsRef(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function updateUserReport(uid, id, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid, 'reports', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserReport(uid, id) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid, 'reports', id));
}

export async function getPublishedReports() {
  const snap = await getDocs(query(collection(db, 'publishedReports'), orderBy('publishedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function publishReport(uid, report, authorName, authorRole) {
  await setDoc(doc(db, 'publishedReports', report.id), {
    ...report,
    publishedBy: authorName,
    publishedByRole: authorRole,
    publishedAt: serverTimestamp(),
    publishedAtISO: new Date().toISOString(),
  });
  await updateUserReport(uid, report.id, { published: true, publishedAt: serverTimestamp() });
}
