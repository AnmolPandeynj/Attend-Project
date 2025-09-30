import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw } from 'lucide-react';

interface QRGeneratorProps {
  sessionId: string;
  sessionData: {
    subject: string;
    semester: number;
    branch: string;
  };
  isActive: boolean;
}

export const QRGenerator = ({ sessionId, sessionData, isActive }: QRGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(2);

  const generateQRToken = () => {
    const timestamp = Date.now();
    const token = `TK_${timestamp}_${sessionData.subject.replace(/\s+/g, '')}_${sessionData.branch}_S${sessionData.semester}`;
    return token;
  };

  const generateQRCode = async (token: string) => {
    try {
      const qrData = JSON.stringify({
        sessionId,
        token,
        timestamp: Date.now(),
        subject: sessionData.subject,
        semester: sessionData.semester,
        branch: sessionData.branch
      });
      
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrUrl);
      setCurrentToken(token);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const updateQR = () => {
      const token = generateQRToken();
      generateQRCode(token);
    };

    // Initial generation
    updateQR();

    // Set up refresh interval
    const interval = setInterval(() => {
      updateQR();
      setTimeLeft(2); // Reset countdown
    }, 2000);

    // Countdown timer
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 2;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [sessionId, sessionData, isActive]);

  if (!isActive) {
    return (
      <Card className="lg:col-span-2" data-testid="card-qr-inactive">
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5 text-muted-foreground" />
            QR Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <QrCode className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No Active Session</p>
            <p className="text-sm text-muted-foreground mt-2">Create a session to generate QR codes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2" data-testid="card-qr-generator">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5 text-primary" />
            Live QR Code
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" data-testid="indicator-live"></div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span data-testid="text-countdown">Refreshing in {timeLeft}s</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="inline-block p-6 bg-white rounded-lg shadow-inner" data-testid="container-qr">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Attendance QR Code"
                className="w-64 h-64 qr-animation"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg" data-testid="placeholder-qr"></div>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-md" data-testid="container-session-info">
            <p className="text-sm font-medium text-foreground">Current Session</p>
            <p className="text-lg font-bold text-primary" data-testid="text-session-details">
              {sessionData.subject} - {sessionData.branch} Semester {sessionData.semester}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Token: <span className="font-mono bg-accent/20 px-2 py-1 rounded" data-testid="text-current-token">{currentToken}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
