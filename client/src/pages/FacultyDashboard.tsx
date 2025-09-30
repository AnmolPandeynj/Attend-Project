import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession, updateSession } from '@/lib/firebase';
import { QRGenerator } from '@/components/faculty/QRGenerator';
import { LiveStats } from '@/components/faculty/LiveStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { QrCode, LogOut, Plus } from 'lucide-react';

const sessionSchema = z.object({
  semester: z.string().min(1, 'Please select a semester'),
  branch: z.string().min(1, 'Please select a branch'),
  subject: z.string().min(1, 'Please select a subject'),
  geofencingEnabled: z.boolean().default(true),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface ActiveSession {
  id: string;
  semester: number;
  branch: string;
  subject: string;
  geofencingEnabled: boolean;
  isActive: boolean;
}

export default function FacultyDashboard() {
  const [, setLocation] = useLocation();
  const { user, userRole, loading, logout } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { toast } = useToast();

  const form = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      semester: '',
      branch: '',
      subject: '',
      geofencingEnabled: true,
    },
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'faculty')) {
      setLocation('/faculty/login');
    }
  }, [user, userRole, loading, setLocation]);

  const handleSignOut = async () => {
    try {
      await logout(); // ✅ Use context logout
      setLocation('/faculty/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const onCreateSession = async (data: SessionForm) => {
    if (!user?.id) return;

    setIsCreatingSession(true);
    try {
      const sessionId = await createSession({
        facultyId: user.id,
        semester: parseInt(data.semester),
        branch: data.branch,
        subject: data.subject,
        geofencingEnabled: data.geofencingEnabled,
      });

      const newSession: ActiveSession = {
        id: sessionId,
        semester: parseInt(data.semester),
        branch: data.branch,
        subject: data.subject,
        geofencingEnabled: data.geofencingEnabled,
        isActive: true,
      };

      setActiveSession(newSession);

      toast({
        title: "Session Created",
        description: `Attendance session started for ${data.subject}`,
      });
    } catch (error) {
      console.error('Session creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    }
    setIsCreatingSession(false);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await updateSession(activeSession.id, {
        isActive: false,
        endedAt: new Date(),
      });

      setActiveSession(null);

      toast({
        title: "Session Ended",
        description: "Attendance session has been ended successfully.",
      });
    } catch (error) {
      console.error('End session error:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'faculty') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-faculty-dashboard">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Smart Attendance - Faculty</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name || user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                data-testid="button-sign-out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Faculty Dashboard</h2>
          <p className="text-muted-foreground">Manage attendance sessions and view analytics</p>
        </div>

        {/* Session Management */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Session Creation/Control */}
          <Card data-testid="card-session-control">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5 text-primary" />
                {activeSession ? 'Active Session' : 'Create Session'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeSession ? (
                <form onSubmit={form.handleSubmit(onCreateSession)} className="space-y-4">
                  {/* Semester Select */}
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select 
                      value={form.watch('semester')} 
                      onValueChange={(value) => form.setValue('semester', value)}
                    >
                      <SelectTrigger data-testid="select-semester">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.semester && (
                      <p className="text-sm text-destructive">{form.formState.errors.semester?.message}</p>
                    )}
                  </div>

                  {/* Branch Select */}
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select 
                      value={form.watch('branch')} 
                      onValueChange={(value) => form.setValue('branch', value)}
                    >
                      <SelectTrigger data-testid="select-branch">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.branch && (
                      <p className="text-sm text-destructive">{form.formState.errors.branch?.message}</p>
                    )}
                  </div>

                  {/* Subject Select */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={form.watch('subject')} 
                      onValueChange={(value) => form.setValue('subject', value)}
                    >
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Data Structures">Data Structures</SelectItem>
                        <SelectItem value="Operating Systems">Operating Systems</SelectItem>
                        <SelectItem value="Database Management">Database Management</SelectItem>
                        <SelectItem value="Computer Networks">Computer Networks</SelectItem>
                        <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                        <SelectItem value="Web Technologies">Web Technologies</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subject && (
                      <p className="text-sm text-destructive">{form.formState.errors.subject?.message}</p>
                    )}
                  </div>

                  {/* Geofencing Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <span className="font-medium text-sm">Enable Geofencing</span>
                      <p className="text-xs text-muted-foreground">Restrict attendance to campus area</p>
                    </div>
                    <Switch
                      checked={form.watch('geofencingEnabled')}
                      onCheckedChange={(checked) => form.setValue('geofencingEnabled', checked)}
                      data-testid="switch-geofencing"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isCreatingSession}
                    data-testid="button-start-session"
                  >
                    {isCreatingSession ? "Creating Session..." : "Start Session"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/10 rounded-md">
                    <h4 className="font-semibold text-secondary mb-2">Current Session</h4>
                    <p className="text-sm" data-testid="text-active-session">
                      <strong>{activeSession.subject}</strong><br />
                      {activeSession.branch} - Semester {activeSession.semester}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Geofencing: {activeSession.geofencingEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleEndSession}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-end-session"
                  >
                    End Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Generator */}
          <QRGenerator
            sessionId={activeSession?.id || ''}
            sessionData={{
              subject: activeSession?.subject || '',
              semester: activeSession?.semester || 0,
              branch: activeSession?.branch || '',
            }}
            isActive={!!activeSession}
          />
        </div>

        {/* Analytics Section */}
        {activeSession && (
          <LiveStats
            sessionId={activeSession.id}
            facultyId={user.id}
            totalEnrolled={45} // Replace with actual enrollment data
          />
        )}
      </main>
    </div>
  );
}
