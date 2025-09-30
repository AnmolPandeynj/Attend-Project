import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Users, CheckCircle, XCircle, MapPin } from 'lucide-react';

interface AttendanceStatsProps {
  present: number;
  absent: number;
  total: number;
  outsideCampus?: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  previousPercentage?: number;
  className?: string;
}

export const AttendanceStats = ({
  present,
  absent,
  total,
  outsideCampus = 0,
  percentage: propPercentage,
  trend,
  previousPercentage,
  className = '',
}: AttendanceStatsProps) => {
  const percentage = propPercentage ?? (total > 0 ? Math.round((present / total) * 100) : 0);
  const percentageChange = previousPercentage ? percentage - previousPercentage : 0;

  const getTrendIcon = () => {
    if (trend === 'up' || percentageChange > 0) {
      return <TrendingUp className="w-4 h-4 text-secondary" />;
    } else if (trend === 'down' || percentageChange < 0) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (trend === 'up' || percentageChange > 0) return 'text-secondary';
    if (trend === 'down' || percentageChange < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getPercentageColor = () => {
    if (percentage >= 85) return 'text-secondary';
    if (percentage >= 75) return 'text-primary';
    if (percentage >= 65) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <Card className={className} data-testid="attendance-stats-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Attendance Overview</span>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            {percentageChange !== 0 && (
              <span className={`text-sm ${getTrendColor()}`} data-testid="percentage-change">
                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Percentage Display */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getPercentageColor()}`} data-testid="main-percentage">
            {percentage}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
        </div>

        {/* Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="52"
              stroke="hsl(var(--border))"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="52"
              stroke={percentage >= 75 ? "hsl(var(--secondary))" : percentage >= 65 ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
              className="transition-all duration-500"
              data-testid="progress-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium text-foreground" data-testid="center-present">
                {present}
              </div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-secondary/10 rounded-md">
            <CheckCircle className="w-5 h-5 text-secondary mr-2" />
            <div>
              <p className="text-sm font-medium">Present</p>
              <p className="text-lg font-bold text-secondary" data-testid="present-count">
                {present}
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-muted rounded-md">
            <XCircle className="w-5 h-5 text-muted-foreground mr-2" />
            <div>
              <p className="text-sm font-medium">Absent</p>
              <p className="text-lg font-bold text-muted-foreground" data-testid="absent-count">
                {absent}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-background rounded border">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm">Total Students</span>
            </div>
            <Badge variant="outline" data-testid="total-count">
              {total}
            </Badge>
          </div>

          {outsideCampus > 0 && (
            <div className="flex items-center justify-between p-2 bg-accent/5 rounded border border-accent/20">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-accent mr-2" />
                <span className="text-sm">Outside Campus</span>
              </div>
              <Badge className="bg-accent text-accent-foreground" data-testid="outside-campus-count">
                {outsideCampus}
              </Badge>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            className={`px-4 py-1 ${
              percentage >= 85 
                ? 'bg-secondary text-secondary-foreground' 
                : percentage >= 75 
                  ? 'bg-primary text-primary-foreground'
                  : percentage >= 65
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-destructive text-destructive-foreground'
            }`}
            data-testid="status-badge"
          >
            {percentage >= 85 && 'Excellent Attendance'}
            {percentage >= 75 && percentage < 85 && 'Good Attendance'}
            {percentage >= 65 && percentage < 75 && 'Average Attendance'}
            {percentage < 65 && 'Low Attendance - Action Required'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Simplified version for smaller displays
export const CompactAttendanceStats = ({
  present,
  total,
  percentage: propPercentage,
  className = '',
}: Pick<AttendanceStatsProps, 'present' | 'total' | 'percentage' | 'className'>) => {
  const percentage = propPercentage ?? (total > 0 ? Math.round((present / total) * 100) : 0);

  return (
    <div className={`flex items-center space-x-4 p-4 bg-card rounded-lg border ${className}`} data-testid="compact-stats">
      <div className="relative">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="hsl(var(--border))"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 26}`}
            strokeDashoffset={`${2 * Math.PI * 26 * (1 - percentage / 100)}`}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-primary" data-testid="compact-percentage">
            {percentage}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Present</p>
        <p className="text-lg font-bold" data-testid="compact-present">
          {present}/{total}
        </p>
      </div>
    </div>
  );
};
