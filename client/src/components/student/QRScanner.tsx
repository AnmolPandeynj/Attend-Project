import { useState, useRef } from 'react';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { markAttendance } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, CheckCircle, XCircle } from 'lucide-react';

interface QRScannerProps {
  studentId: string;
  onAttendanceMarked: () => void;
}

export const QRScanner = ({ studentId, onAttendanceMarked }: QRScannerProps) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const {
    isScanning,
    result,
    error: scannerError,
    cameraPermission,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    simulateQRScan
  } = useQRScanner();

  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    checkGeofence,
    requestLocation
  } = useGeolocation();

  const handleStartScan = async () => {
    await requestLocation();
    await startScanning();
  };

  const processQRCode = async (qrData: string) => {
    setIsProcessing(true);
    
    try {
      const parsedData = JSON.parse(qrData);
      
      if (!parsedData.sessionId || !parsedData.token) {
        throw new Error('Invalid QR code format');
      }

      // Check geofencing if location is available
      let geofencingStatus: 'inside' | 'outside' | 'unknown' = 'unknown';
      
      if (latitude && longitude) {
        const geofenceResult = checkGeofence(latitude, longitude);
        geofencingStatus = geofenceResult.status;
      }

      // Mark attendance
      await markAttendance({
        sessionId: parsedData.sessionId,
        studentId,
        status: 'present',
        geofencingStatus,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        markedBy: null // Student self-marking
      });

      setScanResult(qrData);
      stopScanning();
      
      toast({
        title: "Attendance Marked Successfully",
        description: `Present for ${parsedData.subject}${geofencingStatus === 'outside' ? ' (Outside Campus)' : ''}`,
      });
      
      onAttendanceMarked();
      
    } catch (error) {
      console.error('QR processing error:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Invalid QR code. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  // Simulate QR scan for demo purposes
  const handleDemoScan = () => {
    const demoQRData = JSON.stringify({
      sessionId: 'demo_session_123',
      token: `TK_${Date.now()}_DataStructures_CS_S3`,
      timestamp: Date.now(),
      subject: 'Data Structures',
      semester: 3,
      branch: 'Computer Science'
    });
    
    simulateQRScan(demoQRData);
    processQRCode(demoQRData);
  };

  return (
    <Card data-testid="card-qr-scanner">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="mr-2 h-5 w-5 text-primary" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Scanner Interface */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" data-testid="container-scanner">
          <div className="aspect-square bg-gray-800 relative">
            {/* Video element for camera feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              data-testid="video-camera"
            />
            
            {/* Canvas for QR detection */}
            <canvas
              ref={canvasRef}
              className="hidden"
              data-testid="canvas-detection"
            />
            
            {/* Scanner overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center" data-testid="overlay-scanner">
                <div className="relative w-48 h-48 border-2 border-primary rounded-lg">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {/* Scanning line */}
                  <div className="absolute inset-0 scanner-overlay"></div>
                </div>
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2" data-testid="status-indicator">
              <Badge className="bg-black/70 text-white">
                <Camera className="w-3 h-3 mr-1" />
                {isScanning ? 'Scanning for QR code...' : 'Camera ready'}
              </Badge>
            </div>
            
            {/* Error state */}
            {scannerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50" data-testid="error-display">
                <div className="text-center text-white p-4">
                  <XCircle className="mx-auto h-8 w-8 mb-2 text-red-400" />
                  <p className="text-sm">{scannerError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="space-y-3">
          {!isScanning ? (
            <Button 
              onClick={handleStartScan}
              className="w-full"
              size="lg"
              disabled={cameraPermission === false || isProcessing}
              data-testid="button-start-scan"
            >
              <Camera className="mr-2 h-4 w-4" />
              {cameraPermission === false ? 'Camera Access Denied' : 'Start Scanning'}
            </Button>
          ) : (
            <Button 
              onClick={stopScanning}
              variant="destructive"
              className="w-full"
              size="lg"
              data-testid="button-stop-scan"
            >
              Stop Scanning
            </Button>
          )}
          
          {/* Demo button for testing */}
          <Button 
            onClick={handleDemoScan}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
            data-testid="button-demo-scan"
          >
            {isProcessing ? "Processing..." : "Demo Scan (Testing)"}
          </Button>
        </div>
        
        {/* Location Status */}
        <div className="mt-4 p-3 bg-secondary/10 rounded-md" data-testid="container-location-status">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <MapPin className="w-4 h-4 text-secondary mr-2" />
              Location Status
            </span>
            <Badge 
              variant={locationError ? "destructive" : "secondary"}
              data-testid="badge-location-status"
            >
              {locationLoading ? (
                "Detecting..."
              ) : locationError ? (
                "Location Unavailable"
              ) : latitude && longitude ? (
                checkGeofence(latitude, longitude).isInsideCampus ? "Inside Campus" : "Outside Campus"
              ) : (
                "Unknown"
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {locationError 
              ? "GPS coordinates unavailable - attendance will still be recorded"
              : "GPS coordinates verified for attendance validation"
            }
          </p>
        </div>
        
        {/* Success State */}
        {scanResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md" data-testid="container-success">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Attendance Marked Successfully!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
