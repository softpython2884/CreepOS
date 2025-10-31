'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface CameraCaptureProps {
  onCapture: (imageUri: string) => void;
}

// Capture an image every 30 seconds
const CAPTURE_INTERVAL = 30000; 

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  useEffect(() => {
    if (!hasCameraPermission) return;

    const capture = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current video frame to the canvas
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          
          // Get the image as a data URI and pass it to the parent
          const imageUri = canvas.toDataURL('image/jpeg');
          onCapture(imageUri);
        }
      }
    };
    
    // Take a picture after a short delay, then set an interval
    const initialTimeout = setTimeout(capture, 5000); 
    const intervalId = setInterval(capture, CAPTURE_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [hasCameraPermission, onCapture]);
  
  // We render the video and canvas but keep them hidden
  // They are necessary for capturing the frames
  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay muted />
      <canvas ref={canvasRef} />
    </div>
  );
}
