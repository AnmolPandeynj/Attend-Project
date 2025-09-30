import { useState, useEffect, useRef } from 'react';

interface QRScannerState {
  isScanning: boolean;
  result: string | null;
  error: string | null;
  cameraPermission: boolean | null;
}

export const useQRScanner = () => {
  const [state, setState] = useState<QRScannerState>({
    isScanning: false,
    result: null,
    error: null,
    cameraPermission: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setState(prev => ({ ...prev, cameraPermission: true }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        cameraPermission: false,
        error: 'Camera permission denied or not available'
      }));
      return false;
    }
  };

  const startScanning = async () => {
    if (!state.cameraPermission) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      
      // Start QR code detection
      detectQRCode();
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start camera: ' + (error instanceof Error ? error.message : 'Unknown error'),
        isScanning: false
      }));
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setState(prev => ({ ...prev, isScanning: false }));
  };

  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Here you would use a QR code detection library like jsQR
      // For now, we'll simulate QR detection
      // In a real implementation, you'd use: const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Simulate QR code detection for demo purposes
      // This should be replaced with actual QR scanning library
      
    } catch (error) {
      console.error('QR detection error:', error);
    }
    
    if (state.isScanning) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode);
    }
  };

  const simulateQRScan = (qrData: string) => {
    setState(prev => ({ ...prev, result: qrData }));
    stopScanning();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return {
    ...state,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    simulateQRScan,
  };
};
