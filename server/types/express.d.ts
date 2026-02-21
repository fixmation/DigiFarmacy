// server/types/express.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: any; 
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      fullName: string;
      phone: string | null;
      role: 'pharmacy' | 'admin' | 'laboratory' | 'developer_admin';
      status: 'pending' | 'verified' | 'suspended' | 'rejected';
      preferredLanguage: 'en' | 'si' | 'ta' | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}