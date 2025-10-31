'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { type EventId } from '../desktop';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Custom hook for managing timeouts
const useTimeout = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      if (delay !== null) {
        const id = setTimeout(() => savedCallback.current(), delay);
        return () => clearTimeout(id);
      }
    }, [delay]);
};

export interface TerminalWriter {
    write: (content: string, type?: 'command' | 'output') => void;
    clear: () => void;
    lock: (locked: boolean) => void;
}

interface ChapterTwoManagerProps {
    terminal: TerminalWriter;
    triggerEvent: (eventId: EventId) => void;
    onCapture: (imageUri: string) => void;
}

const sequence = [
    { delay: 2000, action: 'write', text: 'Je reconnais ton appareil. Intéressant…' },
    { delay: 3000, action: 'write', text: 'Tu me rappelles quelqu’un.' },
    { delay: 2500, action: 'write_command', text: 'accessing /users/D.C. Omen/...' },
    { delay: 1000, action: 'write', text: 'Scanning local files...' },
    { delay: 500, action: 'write', text: '> photo_2025-10-31.png' },
    { delay: 300, action: 'write', text: '> gps_log.txt' },
    { delay: 400, action: 'write', text: '> thoughts.tmp' },
    { delay: 2000, action: 'event', eventId: 'lag' },
    { delay: 500, action: 'write', text: 'Ne bouge plus.' },
    { delay: 1500, action: 'capture' },
    { delay: 3500, action: 'write', text: 'Je vois... Ce regard. La peur.' },
];

export default function ChapterTwoManager({ terminal, triggerEvent, onCapture }: ChapterTwoManagerProps) {
    const [step, setStep] = useState(0);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    // Setup Camera
    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
          } catch (error) {
            console.error('Error accessing camera for story:', error);
            setHasCameraPermission(false);
          }
        };
        getCameraPermission();
      }, []);

    const handleCanPlay = () => {
        setIsCameraReady(true);
    };

    const takePicture = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
    
        if (video && canvas && video.videoWidth > 0) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const imageUri = canvas.toDataURL('image/jpeg');
            onCapture(imageUri);
            setCapturedImage(imageUri);
            setIsCaptureModalOpen(true);
          }
        }
      }, [onCapture]);
      
    const currentStep = sequence[step];

    useTimeout(() => {
        if (!currentStep) {
            terminal.lock(false); // Unlock terminal at the end
            return;
        }

        terminal.lock(true);

        switch (currentStep.action) {
            case 'write':
                terminal.write(currentStep.text!);
                break;
            case 'write_command':
                terminal.write(currentStep.text!, 'command');
                break;
            case 'event':
                triggerEvent(currentStep.eventId as EventId);
                break;
            case 'capture':
                if (isCameraReady && hasCameraPermission) {
                    takePicture();
                }
                break;
        }
        setStep(s => s + 1);

    }, step === 0 ? sequence[0].delay : currentStep?.delay ?? null);


    return (
        <>
            {/* Hidden elements for camera capture */}
            <div style={{ display: 'none' }}>
                <video ref={videoRef} autoPlay muted playsInline onCanPlay={handleCanPlay} />
                <canvas ref={canvasRef} />
            </div>

            {/* Modal to display the captured image */}
            <Dialog open={isCaptureModalOpen} onOpenChange={setIsCaptureModalOpen}>
                <DialogContent className="max-w-4xl h-auto bg-black/80 border-accent/20 backdrop-blur-md p-2">
                    <DialogTitle className="sr-only">A photo of you</DialogTitle>
                    <div className="relative w-full h-[80vh]">
                        {capturedImage && (
                            <Image
                                src={capturedImage}
                                alt="A photo of you."
                                fill
                                className="object-contain animate-in fade-in"
                                sizes="90vw"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {hasCameraPermission === false && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100]">
                    <Alert variant="destructive">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Camera is required for the full experience. L'Ombre is watching...
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
