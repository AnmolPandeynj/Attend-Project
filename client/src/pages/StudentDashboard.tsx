import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { QRScanner } from '@/components/student/QRScanner';
import { AttendanceChart, AttendanceTrend } from '@/components/student/AttendanceChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signOutUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { QrCode, LogOut, History, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Mock data - replace with actual Firebase queries
const mockSubjects = [
  { id: '1', name: 'Data Structures', present: 17, total: 20, percentage: 85, status: 'excellent' as const },
  { id: '2', name: 'Operating Systems', present: 16, total: 20, percentage: 80, status: 'good' as const },
  { id: '3', name: 'Database Management', present: 14, total: 20, percentage: 70, status: 'average' as const },
  { id: '4', name: 'Computer Networks', present: 12, total: 20, percentage: 60, status: 'low' as const },
];

const mockRecentActivity = [
  { id: '1', subject: 'Data Structures', timestamp: 'Today, 10:30 AM', status: 'present' as const, geofencing: 'inside' },
  { id: '2', subject: 'Operating Systems', timestamp: 'Yesterday, 2:15 PM', status: 'present' as const, geofencing: 'outside' },
  { id: '3', subject: 'Database Management', timestamp: 'Yesterday, 11:45 AM', status: 'absent' as const, geofencing: null },
];

const mockTrendData = [
  { week: 'Week 1', percentage: 78 },
  { week: 'Week 2', percentage: 82 },
  { week: 'Week 3', percentage: 75 },
  { week: 'Week 4', percentage: 88 },
  { week: 'Week 5', percentage: 80 },
  { week: 'Week 6', percentage: 85 },
  { week: 'Current', percentage: 74 },
];

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user, userRole, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'student')) {
      setLocation('/student/login');
    }
  }, [user, userRole, loading, setLocation]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setLocation('/student/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAttendanceMarked = () => {
    setRefreshKey(prev => prev + 1);
    // Trigger refresh of attendance data
  };

  const getActivityIcon = (status: string, geofencing: string | null) => {
    if (status === 'present') {
      return geofencing === 'outside' 
        ? <AlertCircle className="w-4 h-4 text-white" />
        : <CheckCircle className="w-4 h-4 text-white" />;
    }
    return <XCircle className="w-4 h-4 text-white" />;
  };

  const getActivityColor = (status: string, geofencing: string | null) => {
    if (status === 'present') {
      return geofencing === 'outside' ? 'bg-accent' : 'bg-secondary';
    }
    return 'bg-destructive';
  };

  const getActivityStatus = (status: string, geofencing: string | null) => {
    if (status === 'present') {
      return geofencing === 'outside' ? 'Outside Campus' : 'Present';
    }
    return 'Absent';
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

  if (!user || userRole !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-student-dashboard">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Smart Attendance - Student</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name || user.phoneNumber}
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Student Dashboard</h2>
          <p className="text-muted-foreground">Scan QR codes and track your attendance</p>
        </div>

        {/* QR Scanner and Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* QR Scanner */}
          <QRScanner
            studentId={user.uid}
            onAttendanceMarked={handleAttendanceMarked}
          />

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center p-3 bg-muted rounded-md" data-testid={`activity-${activity.id}`}>
                    <div className={`w-10 h-10 ${getActivityColor(activity.status, activity.geofencing)} rounded-full flex items-center justify-center mr-3`}>
                      {getActivityIcon(activity.status, activity.geofencing)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm" data-testid={`activity-subject-${activity.id}`}>
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                        {activity.timestamp}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={
                          activity.status === 'present' 
                            ? activity.geofencing === 'outside' 
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-secondary text-secondary-foreground'
                            : 'bg-destructive text-destructive-foreground'
                        }
                        data-testid={`activity-status-${activity.id}`}
                      >
                        {getActivityStatus(activity.status, activity.geofencing)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Analytics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Subject-wise Attendance</h3>
          <AttendanceChart subjects={mockSubjects} />
        </div>

        {/* Attendance Trend */}
        <AttendanceTrend 
          trendData={mockTrendData}
          currentAverage={74}
        />
      </main>
    </div>
  );
}
