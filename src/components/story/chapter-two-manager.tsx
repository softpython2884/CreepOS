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
    onFinish: () => void;
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
    { delay: 1500, action: 'capture' }, // This will now show live feed and take a pic in background
    { delay: 3500, action: 'write', text: 'Je vois... Ce regard. La peur.' },
    { delay: 2000, action: 'scream_and_close'},
];

export default function ChapterTwoManager({ terminal, triggerEvent, onCapture, onFinish }: ChapterTwoManagerProps) {
    const [step, setStep] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const hiddenVideoRef = useRef<HTMLVideoElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const isFinishedRef = useRef(false);

    // Setup Camera
    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            mediaStreamRef.current = stream;
            if (hiddenVideoRef.current) {
              hiddenVideoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
          } catch (error) {
            console.error('Error accessing camera for story:', error);
            setHasCameraPermission(false);
          }
        };
        getCameraPermission();
      }, []);

    // When the modal video element is available, attach the stream
    useEffect(() => {
        if (isModalOpen && liveVideoRef.current && mediaStreamRef.current) {
            liveVideoRef.current.srcObject = mediaStreamRef.current;
        }
    }, [isModalOpen]);

    const takePicture = useCallback(() => {
        const video = hiddenVideoRef.current;
        const canvas = canvasRef.current;
    
        if (video && canvas && video.videoWidth > 0 && hasCameraPermission) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const imageUri = canvas.toDataURL('image/jpeg');
            onCapture(imageUri);
          }
        }
      }, [onCapture, hasCameraPermission]);
      
    const currentStep = sequence[step];

    useTimeout(() => {
        if (isFinishedRef.current || !currentStep) return;
        
        const executeStep = () => {
            if (step >= sequence.length -1 ) {
                isFinishedRef.current = true;
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
                    if (hasCameraPermission) {
                        setIsModalOpen(true);
                        // Also take a picture for chapter 3 in the background
                        setTimeout(takePicture, 500);
                    } else {
                       console.warn("Camera not ready or no permission, skipping capture.");
                    }
                    break;
                case 'scream_and_close':
                    setIsModalOpen(false);
                    triggerEvent('scream');
                    setTimeout(() => {
                        onFinish();
                    }, 700); // match screamer duration
                    return; // Don't advance step, onFinish will unmount
            }
            
            setStep(s => s + 1);
        }

        executeStep();

    }, currentStep?.delay ?? null);


    return (
        <>
            {/* Hidden elements for camera capture */}
            <div style={{ display: 'none' }}>
                <video ref={hiddenVideoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} />
            </div>

            {/* Modal to display the live feed */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl h-auto bg-black/80 border-accent/20 backdrop-blur-md p-2">
                    <DialogTitle className="sr-only">You are being watched.</DialogTitle>
                    <div className="relative w-full h-[80vh]">
                       <video ref={liveVideoRef} className="w-full h-full object-contain animate-in fade-in" autoPlay muted playsInline />
                    </div>
                </DialogContent>
            </Dialog>

            {hasCameraPermission === false && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100]">
                    <Alert variant="destructive">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Camera is required for the full experience. Néo is watching...
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
