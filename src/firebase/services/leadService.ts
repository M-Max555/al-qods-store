import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firestore';
import { Lead } from '../../types';

const LEADS_COLLECTION = 'leads';

export const leadService = {
  async saveLead(phone: string, source: string = 'homepage_offer'): Promise<{ success: boolean; message: string }> {
    // 1. Validation: Accept Egyptian numbers only (010, 011, 012, 015 followed by 8 digits)
    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egyptPhoneRegex.test(phone)) {
      return { 
        success: false, 
        message: 'عذراً، يجب إدخال رقم هاتف مصري صحيح (مثال: 01012345678)' 
      };
    }

    try {
      // 2. Prevent duplicates
      const q = query(collection(db, LEADS_COLLECTION), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { 
          success: true, 
          message: 'رقمك مسجل لدينا بالفعل، سنقوم بالتواصل معك قريباً!' 
        };
      }

      // 3. Save to Firestore
      await addDoc(collection(db, LEADS_COLLECTION), {
        phone,
        source,
        createdAt: serverTimestamp(),
      });

      return { 
        success: true, 
        message: 'تم استلام طلبك بنجاح! سنتواصل معك بأفضل العروض قريباً.' 
      };
    } catch (error) {
      console.error('Error saving lead:', error);
      return { 
        success: false, 
        message: 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.' 
      };
    }
  },

  async getAllLeads(): Promise<Lead[]> {
    const querySnapshot = await getDocs(collection(db, LEADS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
    })) as Lead[];
  }
};
