import { FacultyLoginForm } from '@/components/faculty/LoginForm';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function FacultyLogin() {
  const [, setLocation] = useLocation();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && userRole === 'faculty') {
      setLocation('/faculty/dashboard');
    }
  }, [user, userRole, loading, setLocation]);

  const handleLoginSuccess = () => {
    setLocation('/faculty/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="page-faculty-login">
      <FacultyLoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
}
