import { auth, db } from "./config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Generate Initials + 5 Random Digits
const generateAccessCode = (name) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${initials}${digits}`;
};

export const registerUser = async (email, password, fullName, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const accessCode = generateAccessCode(fullName);

  // Store profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName,
    email,
    role,
    accessCode,
    isApproved: false, // Must be approved by TC/RC/Chair
    createdAt: new Date()
  });

  return { user, accessCode };
};