import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { auth } from '../auth';
import { db } from '../firestore';
import type { LoginCredentials, RegisterData, User } from '../../types';

export const userService = {
  async register(data: RegisterData): Promise<User> {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password!);
    
    const newUser: User = {
      id: firebaseUser.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      location: data.location ?? { lat: 0, lng: 0, address: '' },
      role: 'user',
      hasUsedCoupon: false,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
    return this.getUserData(firebaseUser.uid);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getUserData(uid: string): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    return userDoc.data() as User;
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.getUserData(firebaseUser.uid);
          callback(user);
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  async getAllUsers(): Promise<User[]> {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as User;
  },

  async updateUserRole(uid: string, role: 'admin' | 'user' | 'owner'): Promise<void> {

    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { role });
  },

  async getUserByPhone(phone: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as User;
  }
};
