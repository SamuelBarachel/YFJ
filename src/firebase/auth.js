import { auth, db } from "./config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Logic for the random initials + 5 digits code
const generateAccessCode = (name) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${initials}${digits}`;
};

export const registerUser = async (email, password, fullName, role) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const accessCode = generateAccessCode(fullName);
    
    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      fullName,
      email,
      role,
      accessCode,
      authorized: false, // For Leader/EY roles
      status: 'pending', // Waiting for TC/RC/Chair
      createdAt: new Date()
    });
    
    return { user: res.user, accessCode };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const logout = () => signOut(auth);