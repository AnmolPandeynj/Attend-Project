import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession, updateSession, subscribeToSession, subscribeToAttendance } from '@/lib/firebase';
import { QRGenerator } from '@/components/faculty/QRGenerator';
import { LiveStats } from '@/components/faculty/LiveStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, LogOut, Plus, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const sessionSchema = z.object({
  semester: z.string().min(1, 'Please select a semester'),
  branch: z.string().min(1, 'Please select a branch'),
  subject: z.string().min(1, 'Please select a subject'),
  geofencingEnabled: z.boolean().default(true),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface Session {
  id: string;
  semester: number;
  branch: string;
  subject: string;
  geofencingEnabled: boolean;
  isActive: boolean;
  createdAt: any;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: 'present' | 'absent';
  geofencingStatus: 'inside' | 'outside' | 'unknown';
  createdAt: any;
}

export default function FacultyDashboard() {
  const [, setLocation] = useLocation();
  const { user, userRole, loading, logout } = useAuth();
  const { toast } = useToast();

  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionDuration, setSessionDuration] = useState<string>('00:00');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const form = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      semester: '',
      branch: '',
      subject: '',
      geofencingEnabled: true,
    },
  });

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && (!user || userRole !== 'faculty')) {
      setLocation('/faculty/login');
    }
  }, [user, userRole, loading, setLocation]);

  // Subscribe to active session updates
  useEffect(() => {
    if (!activeSession?.id) return;
    const unsubscribe = subscribeToSession(activeSession.id, (sessionData) => {
      if (sessionData) setActiveSession(sessionData);
    });
    return unsubscribe;
  }, [activeSession?.id]);

  // Subscribe to attendance updates
  useEffect(() => {
    if (!activeSession?.id) return;
    const unsubscribe = subscribeToAttendance(activeSession.id, (records) => {
      setAttendanceRecords(records);
    });
    return unsubscribe;
  }, [activeSession?.id]);

  // Calculate session duration
  useEffect(() => {
    if (!activeSession?.createdAt) return;
    const updateDuration = () => {
      const start = activeSession.createdAt.toDate();
      const diff = new Date().getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setSessionDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    };
    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.createdAt]);

  const handleSignOut = async () => {
    try {
      await logout();
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

      const newSession: Session = {
        id: sessionId,
        semester: parseInt(data.semester),
        branch: data.branch,
        subject: data.subject,
        geofencingEnabled: data.geofencingEnabled,
        isActive: true,
        createdAt: new Date(),
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
      await updateSession(activeSession.id, { isActive: false, endedAt: new Date() });
      setActiveSession(null);
      setAttendanceRecords([]);
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

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const totalEnrolled = 45; // Replace with actual enrollment
  const attendancePercentage = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

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

  if (!user || userRole !== 'faculty') return null;

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
              <span className="text-sm text-muted-foreground">Welcome, {user.name || user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut} data-testid="button-sign-out">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Session Management */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5 text-primary" />
                {activeSession ? 'Active Session' : 'Create Session'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeSession ? (
                <form onSubmit={form.handleSubmit(onCreateSession)} className="space-y-4">
                  {/* Semester */}
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select value={form.watch('semester')} onValueChange={(v) => form.setValue('semester', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(sem => <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.semester && <p className="text-sm text-destructive">{form.formState.errors.semester.message}</p>}
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={form.watch('branch')} onValueChange={(v) => form.setValue('branch', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.branch && <p className="text-sm text-destructive">{form.formState.errors.branch.message}</p>}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={form.watch('subject')} onValueChange={(v) => form.setValue('subject', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>
                        {['Data Structures','Operating Systems','Database Management','Computer Networks','Software Engineering','Web Technologies']
                          .map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subject && <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>}
                  </div>

                  {/* Geofencing */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <span className="font-medium text-sm">Enable Geofencing</span>
                      <p className="text-xs text-muted-foreground">Restrict attendance to campus area</p>
                    </div>
                    <Switch checked={form.watch('geofencingEnabled')} onCheckedChange={v => form.setValue('geofencingEnabled', v)} />
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreatingSession}>
                    {isCreatingSession ? "Creating Session..." : "Start Session"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/10 rounded-md">
                    <p className="text-sm font-medium">Current Session</p>
                    <p className="text-sm">{activeSession.subject}<br/>{activeSession.branch} - Semester {activeSession.semester}</p>
                    <Badge variant="secondary">{activeSession.isActive ? 'Active' : 'Ended'}</Badge>
                    <Badge variant={activeSession.geofencingEnabled ? 'default' : 'outline'}>Geofencing: {activeSession.geofencingEnabled ? 'ON':'OFF'}</Badge>
                  </div>
                  <Button onClick={handleEndSession} variant="destructive" className="w-full">End Session</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Generator */}
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

        {/* Analytics */}
        {activeSession && (
          <LiveStats
            sessionId={activeSession.id}
            facultyId={user.id}
            totalEnrolled={totalEnrolled}
          />
        )}

        {/* Recent Activity */}
        {activeSession && attendanceRecords.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceRecords.slice(0,5).map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        record.status === 'present' 
                          ? record.geofencingStatus === 'outside' ? 'bg-accent' : 'bg-secondary'
                          : 'bg-destructive'
                      }`}>
                        {record.status === 'present' ? <CheckCircle className="w-4 h-4 text-white"/> : <XCircle className="w-4 h-4 text-white"/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Student {record.studentId}</p>
                        <p className="text-xs text-muted-foreground">{record.createdAt?.toDate()?.toLocaleString() || 'Just now'}</p>
                      </div>
                    </div>
                    <Badge className={record.status==='present'
                      ? record.geofencingStatus==='outside' ? 'bg-accent text-accent-foreground':'bg-secondary text-secondary-foreground'
                      : 'bg-destructive text-destructive-foreground'}>
                      {record.status==='present'? record.geofencingStatus==='outside'? 'Present (Outside)':'Present':'Absent'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
