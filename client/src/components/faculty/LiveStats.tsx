import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { markAttendance, subscribeToAttendance } from '@/lib/firebase';
import { TrendingUp, Users, UserCheck, MapPin, UserPlus } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: 'present' | 'absent';
  geofencingStatus: 'inside' | 'outside' | 'unknown';
  markedBy?: string;
  createdAt: any;
}

interface LiveStatsProps {
  sessionId: string;
  facultyId: string;
  totalEnrolled: number;
}

const manualAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Please enter student ID'),
  action: z.enum(['present', 'absent'], {
    required_error: 'Please select an action'
  })
});

type ManualAttendanceForm = z.infer<typeof manualAttendanceSchema>;

export const LiveStats = ({ sessionId, facultyId, totalEnrolled }: LiveStatsProps) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualAttendanceForm>({
    resolver: zodResolver(manualAttendanceSchema),
    defaultValues: {
      studentId: '',
      action: 'present'
    }
  });

  // Subscribe to attendance updates
  useEffect(() => {
    const unsubscribe = subscribeToAttendance(sessionId, (records) => {
      setAttendanceRecords(records);
    });

    return unsubscribe;
  }, [sessionId]);

  // Calculate stats
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const attendancePercentage = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;
  const outsideCampusCount = attendanceRecords.filter(
    record => record.status === 'present' && record.geofencingStatus === 'outside'
  ).length;

  const onManualAttendance = async (data: ManualAttendanceForm) => {
    setIsLoading(true);
    try {
      // Check if student already marked
      const existingRecord = attendanceRecords.find(record => record.studentId === data.studentId);
      
      if (existingRecord) {
        toast({
          title: "Already Marked",
          description: `Student ${data.studentId} already has attendance marked for this session.`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      await markAttendance({
        sessionId,
        studentId: data.studentId,
        status: data.action,
        geofencingStatus: 'unknown', // Manual entries don't have location
        latitude: null,
        longitude: null,
        markedBy: facultyId
      });

      toast({
        title: "Attendance Updated",
        description: `Student ${data.studentId} marked as ${data.action}.`,
      });

      form.reset();
    } catch (error) {
      console.error('Manual attendance error:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Live Statistics */}
      <Card data-testid="card-live-stats">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Live Session Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-md">
              <span className="text-sm font-medium flex items-center">
                <UserCheck className="mr-2 h-4 w-4 text-secondary" />
                Present
              </span>
              <Badge className="text-lg font-bold bg-secondary text-secondary-foreground" data-testid="stat-present">
                {presentCount}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                Total Enrolled
              </span>
              <Badge variant="outline" className="text-lg font-bold" data-testid="stat-total">
                {totalEnrolled}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-accent/10 rounded-md">
              <span className="text-sm font-medium">Attendance %</span>
              <Badge 
                className="text-lg font-bold bg-accent text-accent-foreground"
                data-testid="stat-percentage"
              >
                {attendancePercentage}%
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-md">
              <span className="text-sm font-medium flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-destructive" />
                Outside Campus
              </span>
              <Badge 
                variant="destructive" 
                className="text-lg font-bold"
                data-testid="stat-outside-campus"
              >
                {outsideCampusCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Pie Chart */}
      <Card data-testid="card-attendance-chart">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Attendance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Chart */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="hsl(214, 32%, 91%)"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="hsl(210, 79%, 46%)"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - attendancePercentage / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground" data-testid="chart-percentage">
                    {attendancePercentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-chart-1 rounded-full mr-2"></div>
                <span className="text-sm">Present</span>
              </div>
              <span className="text-sm font-medium" data-testid="legend-present">{presentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-border rounded-full mr-2"></div>
                <span className="text-sm">Absent</span>
              </div>
              <span className="text-sm font-medium" data-testid="legend-absent">{totalEnrolled - presentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Attendance Override */}
      <Card data-testid="card-manual-attendance">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
            Manual Override
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onManualAttendance)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter student ID"
                {...form.register('studentId')}
                data-testid="input-student-id"
              />
              {form.formState.errors.studentId && (
                <p className="text-sm text-destructive">{form.formState.errors.studentId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Action</Label>
              <Select 
                value={form.watch('action')} 
                onValueChange={(value: 'present' | 'absent') => form.setValue('action', value)}
              >
                <SelectTrigger data-testid="select-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Mark Present</SelectItem>
                  <SelectItem value="absent">Mark Absent</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.action && (
                <p className="text-sm text-destructive">{form.formState.errors.action.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid="button-update-attendance"
            >
              {isLoading ? "Updating..." : "Update Attendance"}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground flex items-start">
              <UserPlus className="mr-1 h-3 w-3 mt-0.5 flex-shrink-0" />
              Manual changes will be logged with timestamp and faculty ID for audit purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
