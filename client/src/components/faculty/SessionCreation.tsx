import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const sessionSchema = z.object({
  semester: z.string().min(1, 'Please select a semester'),
  branch: z.string().min(1, 'Please select a branch'),
  subject: z.string().min(1, 'Please select a subject'),
  geofencingEnabled: z.boolean().default(true),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface SessionCreationProps {
  onSessionCreated: (session: any) => void;
}

const BRANCHES = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology'
];

const SUBJECTS_BY_SEMESTER: Record<string, string[]> = {
  '1': ['Mathematics I', 'Physics', 'Chemistry', 'Engineering Graphics', 'Communication Skills', 'Programming Fundamentals'],
  '2': ['Mathematics II', 'Engineering Mechanics', 'Material Science', 'Electronic Devices', 'Environmental Science', 'Data Structures'],
  '3': ['Data Structures', 'Digital Logic Design', 'Computer Organization', 'Operating Systems', 'Database Management', 'Software Engineering'],
  '4': ['Algorithms', 'Computer Networks', 'System Programming', 'Web Technologies', 'Machine Learning', 'Compiler Design'],
  '5': ['Distributed Systems', 'Artificial Intelligence', 'Computer Graphics', 'Mobile Computing', 'Cloud Computing', 'Cybersecurity'],
  '6': ['Advanced Algorithms', 'Natural Language Processing', 'Blockchain Technology', 'IoT Systems', 'Big Data Analytics', 'Software Testing'],
  '7': ['Project Management', 'Enterprise Applications', 'Advanced Databases', 'Parallel Computing', 'DevOps', 'Research Methodology'],
  '8': ['Capstone Project', 'Industry Internship', 'Advanced Topics', 'Entrepreneurship', 'Ethics in Technology', 'Professional Skills']
};

export const SessionCreation = ({ onSessionCreated }: SessionCreationProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
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

  const selectedSemester = form.watch('semester');
  const availableSubjects = selectedSemester ? SUBJECTS_BY_SEMESTER[selectedSemester] || [] : [];

  const onSubmit = async (data: SessionForm) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create a session.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const sessionId = await createSession({
        facultyId: user.uid,
        semester: parseInt(data.semester),
        branch: data.branch,
        subject: data.subject,
        geofencingEnabled: data.geofencingEnabled,
      });

      const newSession = {
        id: sessionId,
        semester: parseInt(data.semester),
        branch: data.branch,
        subject: data.subject,
        geofencingEnabled: data.geofencingEnabled,
        isActive: true,
        createdAt: new Date(),
      };

      onSessionCreated(newSession);
      
      toast({
        title: "Session Created",
        description: `Attendance session started for ${data.subject}`,
      });

      form.reset();
    } catch (error) {
      console.error('Session creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card data-testid="card-session-creation">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="mr-2 h-5 w-5 text-primary" />
          Create Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Semester Selection */}
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select 
              value={form.watch('semester')} 
              onValueChange={(value) => {
                form.setValue('semester', value);
                form.setValue('subject', ''); // Reset subject when semester changes
              }}
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
              <p className="text-sm text-destructive">{form.formState.errors.semester.message}</p>
            )}
          </div>
          
          {/* Branch Selection */}
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
                {BRANCHES.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.branch && (
              <p className="text-sm text-destructive">{form.formState.errors.branch.message}</p>
            )}
          </div>
          
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select 
              value={form.watch('subject')} 
              onValueChange={(value) => form.setValue('subject', value)}
              disabled={!selectedSemester}
            >
              <SelectTrigger data-testid="select-subject">
                <SelectValue placeholder={selectedSemester ? "Select Subject" : "Select Semester First"} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subject && (
              <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>
          
          {/* Geofencing Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-md" data-testid="geofencing-toggle">
            <div className="space-y-0.5">
              <Label className="font-medium">Enable Geofencing</Label>
              <p className="text-sm text-muted-foreground">
                Restrict attendance to campus boundaries
              </p>
            </div>
            <Switch
              checked={form.watch('geofencingEnabled')}
              onCheckedChange={(checked) => form.setValue('geofencingEnabled', checked)}
              data-testid="switch-geofencing"
            />
          </div>

          {/* Session Information */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
            <h4 className="font-medium text-sm mb-2 text-primary">Session Details</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• QR codes will refresh every 2 seconds</p>
              <p>• Students can mark attendance via QR scan</p>
              <p>• Manual attendance override available</p>
              <p>• {form.watch('geofencingEnabled') ? 'Location verification enabled' : 'Location verification disabled'}</p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isCreating}
            size="lg"
            data-testid="button-create-session"
          >
            {isCreating ? "Creating Session..." : "Start Attendance Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
