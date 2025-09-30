import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Presentation } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

interface FacultyLoginFormProps {
  onSuccess: () => void;
}

export const FacultyLoginForm = ({ onSuccess }: FacultyLoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll create a mock faculty user
      // In a real app, this would authenticate with your backend
      if (data.email && data.password.length >= 6) {
        const userData = {
          id: `faculty-${Date.now()}`,
          email: data.email,
          phoneNumber: null,
          role: 'faculty' as const,
          name: `Dr. ${data.email.split('@')[0]}`,
          semester: null,
          branch: null,
        };
        
        login(userData);
        
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        });
        
        onSuccess();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-faculty-login">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4" data-testid="icon-faculty">
          <Presentation className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Faculty Login</CardTitle>
        <p className="text-muted-foreground mt-2">Access your attendance management dashboard</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="faculty@university.edu"
              {...form.register('email')}
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              data-testid="input-password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                className="rounded border-border text-primary focus:ring-ring"
                {...form.register('rememberMe')}
                data-testid="checkbox-remember"
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
            <a href="#" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
              Forgot password?
            </a>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
            data-testid="button-signin"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
