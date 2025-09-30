import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSessionAttendance } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from './QRScanner';
import { AttendanceChart, AttendanceTrend } from './AttendanceChart';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  sessionId: string;
  status: 'present' | 'absent';
  geofencingStatus: 'inside' | 'outside' | 'unknown';
  createdAt: any;
  subject?: string;
  semester?: number;
  branch?: string;
}

interface SubjectStats {
  id: string;
  name: string;
  present: number;
  total: number;
  percentage: number;
  status: 'excellent' | 'good' | 'average' | 'low';
  lastAttended?: string;
}

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAttendanceData = async () => {
      try {
        // For now, we'll use an empty array since we need to implement student-specific attendance fetching
        const records: AttendanceRecord[] = [];
        setAttendanceRecords(records);
        
        // Process records into subject statistics
        const subjectMap = new Map<string, {
          present: number;
          total: number;
          lastAttended?: string;
        }>();

        records.forEach((record: any) => {
          const subject = record.subject || 'Unknown Subject';
          const current = subjectMap.get(subject) || { present: 0, total: 0 };
          
          current.total += 1;
          if (record.status === 'present') {
            current.present += 1;
            const attendedDate = record.createdAt?.toDate()?.toLocaleDateString();
            if (!current.lastAttended || attendedDate > current.lastAttended) {
              current.lastAttended = attendedDate;
            }
          }
          
          subjectMap.set(subject, current);
        });

        const stats: SubjectStats[] = Array.from(subjectMap.entries()).map(([name, data], index) => {
          const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
          let status: 'excellent' | 'good' | 'average' | 'low';
          
          if (percentage >= 85) status = 'excellent';
          else if (percentage >= 75) status = 'good';
          else if (percentage >= 65) status = 'average';
          else status = 'low';

          return {
            id: `subject-${index}`,
            name,
            present: data.present,
            total: data.total,
            percentage,
            status,
            lastAttended: data.lastAttended,
          };
        });

        setSubjectStats(stats);
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [user?.uid, toast]);

  const handleAttendanceMarked = () => {
    // Refresh attendance data after marking
    if (user?.uid) {
      const fetchUpdatedData = async () => {
        try {
          // For now, we'll use an empty array since we need to implement student-specific attendance fetching
        const records: AttendanceRecord[] = [];
          setAttendanceRecords(records);
        } catch (error) {
          console.error('Failed to refresh attendance data:', error);
        }
      };
      fetchUpdatedData();
    }
  };

  const getRecentActivity = () => {
    return attendanceRecords
      .slice(0, 5)
      .map(record => ({
        id: record.id,
        subject: record.subject || 'Unknown Subject',
        timestamp: record.createdAt?.toDate()?.toLocaleString() || 'Recently',
        status: record.status,
        geofencing: record.geofencingStatus,
      }));
  };

  const generateTrendData = () => {
    // Group attendance by week for trend analysis
    const weeklyData: Record<string, { present: number; total: number }> = {};
    
    attendanceRecords.forEach(record => {
      const date = record.createdAt?.toDate();
      if (!date) return;
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { present: 0, total: 0 };
      }
      
      weeklyData[weekKey].total += 1;
      if (record.status === 'present') {
        weeklyData[weekKey].present += 1;
      }
    });

    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([week, data], index) => ({
        week: index === 6 ? 'Current' : `Week ${index + 1}`,
        percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      }));
  };

  const overallAttendance = attendanceRecords.length > 0 
    ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)
    : 0;

  const lowAttendanceSubjects = subjectStats.filter(subject => subject.status === 'low');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="student-dashboard">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="overall-attendance-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                <p className="text-2xl font-bold text-primary" data-testid="overall-percentage">
                  {overallAttendance}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-classes-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-secondary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold" data-testid="total-classes">
                  {attendanceRecords.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="present-classes-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-secondary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-secondary" data-testid="present-classes">
                  {attendanceRecords.filter(r => r.status === 'present').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="low-attendance-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Low Attendance</p>
                <p className="text-2xl font-bold text-destructive" data-testid="low-attendance-count">
                  {lowAttendanceSubjects.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Attendance Warning */}
      {lowAttendanceSubjects.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5" data-testid="low-attendance-warning">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The following subjects have low attendance (below 65%):
            </p>
            <div className="flex flex-wrap gap-2">
              {lowAttendanceSubjects.map(subject => (
                <Badge key={subject.id} variant="destructive" data-testid={`warning-${subject.id}`}>
                  {subject.name}: {subject.percentage}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner and Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <QRScanner
          studentId={user?.uid || ''}
          onAttendanceMarked={handleAttendanceMarked}
        />

        <Card data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {getRecentActivity().length > 0 ? (
              <div className="space-y-4">
                {getRecentActivity().map((activity) => (
                  <div key={activity.id} className="flex items-center p-3 bg-muted rounded-md" data-testid={`activity-${activity.id}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      activity.status === 'present' 
                        ? activity.geofencing === 'outside' 
                          ? 'bg-accent' 
                          : 'bg-secondary'
                        : 'bg-destructive'
                    }`}>
                      {activity.status === 'present' ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm" data-testid={`activity-subject-${activity.id}`}>
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                        {activity.timestamp}
                      </p>
                    </div>
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
                      {activity.status === 'present' 
                        ? activity.geofencing === 'outside' 
                          ? 'Outside Campus' 
                          : 'Present'
                        : 'Absent'
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6" data-testid="no-activity">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No attendance records yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start scanning QR codes to mark attendance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      {subjectStats.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-6">Subject-wise Attendance</h3>
          <AttendanceChart subjects={subjectStats} />
        </div>
      )}

      {/* Attendance Trend */}
      {attendanceRecords.length > 0 && (
        <AttendanceTrend 
          trendData={generateTrendData()}
          currentAverage={overallAttendance}
        />
      )}
    </div>
  );
};
