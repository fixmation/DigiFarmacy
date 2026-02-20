import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'customer' | 'pharmacy' | 'laboratory' | 'admin' | 'developer_admin';
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  preferred_language: 'en' | 'si' | 'ta';
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const { user } = await res.json();
          console.log("Auth: checkSession - received user from API:", user);
          if (user) {
            const profile: UserProfile = {
              id: user.id,
              email: user.email,
              full_name: user.fullName,
              phone: user.phone,
              role: user.role,
              status: user.status,
              preferred_language: user.preferredLanguage,
            };
            setUser({id: user.id, email: user.email});
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // For now, create a simple mock user
      // In a real implementation, this would call your backend API
      const newUser: AuthUser = {
        id: `user_${Date.now()}`,
        email
      };
      
      const newProfile: UserProfile = {
        id: newUser.id,
        email,
        full_name: userData.fullName || '',
        phone: userData.phone || null,
        role: userData.role || 'customer',
        status: 'pending',
        preferred_language: 'en'
      };

      // Store in localStorage for demo purposes
      localStorage.setItem('digiFarmacy_user', JSON.stringify(newUser));
      localStorage.setItem('digiFarmacy_profile', JSON.stringify(newProfile));
      
      setUser(newUser);
      setProfile(newProfile);
      
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Failed to create account');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!res.ok) {
        throw new Error('Sign in failed');
      }

      const { user } = await res.json();
      console.log("Auth: signIn - received user from API:", user);
      
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        preferred_language: user.preferredLanguage,
      };

      setUser({id: user.id, email: user.email});
      setProfile(profile);
      console.log("Auth: signIn - user and profile set:", user, profile);
      
      toast.success('Signed in successfully!');
    } catch (error) {
      toast.error('Failed to sign in');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully!');
    } catch (error) {
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};