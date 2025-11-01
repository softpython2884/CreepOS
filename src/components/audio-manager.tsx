'use client';

import { useEffect, useRef } from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | null;

interface AudioManagerProps {
  event: SoundEvent;
  onEnd: () => void;
}

// Base64 encoded silent WAV file to enable autoplay
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// TODO: Replace these placeholders with the final audio file URLs
const sounds: Record<NonNullable<SoundEvent>, { src: string; volume: number; loop?: boolean }> = {
    scream: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.8 }, // Placeholder
    glitch: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.3 }, // Placeholder
    click: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.5 }, // Placeholder
    close: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.4 }, // Placeholder
    bsod: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.5 }, // Placeholder
    fan: { src: 'https://i.cloudup.com/36zS5f2D-G.mp3', volume: 0.1, loop: true }, // Placeholder
};

const ambientSound = {
    src: 'https://i.cloudup.com/36zS5f2D-G.mp3', // Placeholder
    volume: 0.1
};

export default function AudioManager({ event, onEnd }: AudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fanAudioRef = useRef<HTMLAudioElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const isPlayingAmbient = useRef(false);

  // Play ambient sound on mount
  useEffect(() => {
    const playAmbient = async () => {
        if (ambientAudioRef.current && !isPlayingAmbient.current) {
            try {
                isPlayingAmbient.current = true;
                ambientAudioRef.current.src = ambientSound.src;
                ambientAudioRef.current.volume = ambientSound.volume;
                ambientAudioRef.current.loop = true;
                await ambientAudioRef.current.play();
            } catch (error) {
                isPlayingAmbient.current = false;
                if ((error as Error).name !== 'AbortError' && (error as Error).name !== 'NotSupportedError') {
                    console.warn('Could not play ambient sound:', error);
                }
            }
        }
    };
    
    const enableAutoplay = () => {
        const audio = new Audio(SILENT_WAV);
        audio.play().catch(() => {});
        playAmbient();
        window.removeEventListener('click', enableAutoplay);
        window.removeEventListener('keydown', enableAutoplay);
    };
    window.addEventListener('click', enableAutoplay);
    window.addEventListener('keydown', enableAutoplay);
    
    playAmbient();

    return () => {
        window.removeEventListener('click', enableAutoplay);
        window.removeEventListener('keydown', enableAutoplay);
    }
  }, []);

  useEffect(() => {
    const fanAudio = fanAudioRef.current;
    if (!fanAudio) return;

    const playFanSound = async () => {
        try {
            const sound = sounds['fan'];
            fanAudio.src = sound.src;
            fanAudio.volume = sound.volume;
            fanAudio.loop = sound.loop || false;
            await fanAudio.play();
        } catch (error) {
            if ((error as Error).name !== 'AbortError' && (error as Error).name !== 'NotSupportedError') {
                console.warn('Could not play fan sound:', error);
            }
        }
    };
    
    const stopFanSound = () => {
        if (!fanAudio.paused) {
            fanAudio.pause();
            fanAudio.currentTime = 0;
        }
    }

    if (event === 'fan') {
        playFanSound();
    } else {
        stopFanSound();
    }

  }, [event]);


  useEffect(() => {
    if (event && audioRef.current && event !== 'fan') {
      const sound = sounds[event];
      if (sound) {
        audioRef.current.src = sound.src;
        audioRef.current.volume = sound.volume;
        audioRef.current.play().catch(error => {
            if ((error as Error).name !== 'AbortError' && (error as Error).name !== 'NotSupportedError') {
                console.warn(`Could not play sound (${event}):`, error);
            }
        });
      }
    }
  }, [event]);

  return (
    <>
      <audio ref={audioRef} onEnded={onEnd} />
      <audio ref={fanAudioRef} loop />
      <audio ref={ambientAudioRef} loop />
    </>
  );
}
