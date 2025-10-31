'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (imageUri: string) => void;
  enabled: boolean;
}

const CAPTURE_INTERVAL = 30000; 

export default function CameraCapture({ onCapture, enabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isReadyForCapture, setIsReadyForCapture] = useState(false);
  const { toast } = useToast();
  const streamRef = useRef<MediaStream | null>(null);

  const capture = useCallback(() => {
    if (!enabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip the image horizontally
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageUri = canvas.toDataURL('image/jpeg');
        onCapture(imageUri);
      }
    }
  }, [onCapture, enabled]);


  useEffect(() => {
    const getCameraPermission = async () => {
      if (enabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
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
      } else {
        // If not enabled, stop the camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      }
    };

    getCameraPermission();

    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, enabled]);

  useEffect(() => {
    if (!isReadyForCapture || !enabled) return;

    // Take a picture after a short delay, then set an interval
    const initialTimeout = setTimeout(capture, 2000); 
    const intervalId = setInterval(capture, CAPTURE_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [isReadyForCapture, capture, enabled]);
  
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
