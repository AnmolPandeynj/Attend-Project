import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface SubjectAttendance {
  id: string;
  name: string;
  present: number;
  total: number;
  percentage: number;
  status: 'excellent' | 'good' | 'average' | 'low';
}

interface AttendanceChartProps {
  subjects: SubjectAttendance[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'hsl(210, 79%, 46%)'; // chart-1
    case 'good': return 'hsl(120, 39%, 54%)'; // chart-2  
    case 'average': return 'hsl(36, 77%, 49%)'; // chart-3
    case 'low': return 'hsl(0, 72%, 51%)'; // destructive
    default: return 'hsl(215, 16%, 47%)'; // muted-foreground
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'average': return 'Average';
    case 'low': return 'Low - Attention Required';
    default: return 'Unknown';
  }
};

export const AttendanceChart = ({ subjects }: AttendanceChartProps) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="grid-attendance-subjects">
      {subjects.map((subject) => (
        <Card key={subject.id} className="relative" data-testid={`card-subject-${subject.id}`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold" data-testid={`title-${subject.id}`}>
              {subject.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Circular Progress Chart */}
            <div className="relative w-20 h-20 mx-auto mb-4" data-testid={`chart-${subject.id}`}>
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="hsl(214, 32%, 91%)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke={getStatusColor(subject.status)}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - subject.percentage / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              {/* Percentage display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground" data-testid={`percentage-${subject.id}`}>
                  {subject.percentage}%
                </span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground" data-testid={`stats-${subject.id}`}>
                Present: <span className="font-medium">{subject.present}</span> / <span>{subject.total}</span>
              </p>
              <div className="flex items-center justify-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getStatusColor(subject.status) }}
                  data-testid={`indicator-${subject.id}`}
                ></div>
                <span className="text-xs text-muted-foreground" data-testid={`status-${subject.id}`}>
                  {getStatusLabel(subject.status)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Attendance Trend Chart Component
interface TrendPoint {
  week: string;
  percentage: number;
}

interface AttendanceTrendProps {
  trendData: TrendPoint[];
  currentAverage: number;
}

export const AttendanceTrend = ({ trendData, currentAverage }: AttendanceTrendProps) => {
  const maxPercentage = Math.max(...trendData.map(point => point.percentage));
  const chartHeight = 200;
  const chartWidth = 300;

  return (
    <Card data-testid="card-attendance-trend">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Attendance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart Container */}
        <div className="relative h-64 bg-muted rounded-md p-4" data-testid="container-trend-chart">
          <div className="absolute inset-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-8 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-rows-4 gap-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-b border-border"></div>
                ))}
              </div>
              
              {/* Trend line */}
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} data-testid="svg-trend-line">
                <polyline
                  fill="none"
                  stroke="hsl(210, 79%, 46%)"
                  strokeWidth="3"
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * chartWidth;
                    const y = chartHeight - (point.percentage / 100) * chartHeight;
                    return `${x},${y}`;
                  }).join(' ')}
                  className="drop-shadow-sm"
                />
                
                {/* Data points */}
                {trendData.map((point, index) => {
                  const x = (index / (trendData.length - 1)) * chartWidth;
                  const y = chartHeight - (point.percentage / 100) * chartHeight;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="hsl(210, 79%, 46%)"
                      className="drop-shadow-sm"
                      data-testid={`point-${index}`}
                    >
                      <title>{`${point.week}: ${point.percentage}%`}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-muted-foreground mt-2">
              {trendData.map((point, index) => (
                <span key={index} data-testid={`label-${index}`}>{point.week}</span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chart Stats */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-chart-1 rounded-full mr-2"></div>
              <span>Overall Trend</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            Current Average: <span className="font-semibold text-foreground" data-testid="text-current-average">{currentAverage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
