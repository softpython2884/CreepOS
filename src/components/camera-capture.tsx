'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (imageUri: string) => void;
}

const CAPTURE_INTERVAL = 30000; 

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isReadyForCapture, setIsReadyForCapture] = useState(false);
  const { toast } = useToast();

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageUri = canvas.toDataURL('image/jpeg');
        onCapture(imageUri);
      }
    }
  }, [onCapture]);


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
    if (!isReadyForCapture) return;

    // Take a picture after a short delay, then set an interval
    const initialTimeout = setTimeout(capture, 2000); 
    const intervalId = setInterval(capture, CAPTURE_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [isReadyForCapture, capture]);
  
  const handleCanPlay = () => {
    setIsReadyForCapture(true);
  };
  
  // We render the video and canvas but keep them hidden
  // They are necessary for capturing the frames
  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay muted playsInline onCanPlay={handleCanPlay} />
      <canvas ref={canvasRef} />
    </div>
  );
}
