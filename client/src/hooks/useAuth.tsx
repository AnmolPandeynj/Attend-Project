import { useState, useEffect, createContext, useContext } from 'react';
import { auth, signOutUser, getUser } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'faculty' | 'student';
  name: string;
  semester: number | null;
  branch: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: 'faculty' | 'student' | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  userRole: null,
  login: () => {},
  logout: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid); // fetch from Firestore
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await signOutUser(); // sign out from Firebase
      setUser(null);
      localStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Firebase logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userRole: user?.role || null,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
