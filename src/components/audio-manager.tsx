'use client';

import { useEffect, useRef } from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | null;

interface AudioManagerProps {
  event: SoundEvent;
  onEnd: () => void;
}

// Base64 encoded silent WAV file to enable autoplay
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// Using free sound effects from various sources
const sounds: Record<NonNullable<SoundEvent>, { src: string; volume: number; loop?: boolean }> = {
    scream: { src: 'https://www.myinstants.com/media/sounds/funtime-josh-screamer.mp3', volume: 0.8 },
    glitch: { src: 'https://cdn.freesound.org/previews/25/25921_37876-lq.mp3', volume: 0.3 },
    click: { src: 'https://cdn.freesound.org/previews/434/434818_6472661-lq.mp3', volume: 0.5 },
    close: { src: 'https://cdn.freesound.org/previews/434/434819_6472661-lq.mp3', volume: 0.4 },
    bsod: { src: 'https://cdn.freesound.org/previews/36/36991_130343-lq.mp3', volume: 0.5 },
    fan: { src: 'https://cdn.freesound.org/previews/34/344379_5121236-lq.mp3', volume: 0.1, loop: true },
};

const ambientSound = {
    src: 'https://cdn.freesound.org/previews/702/702752_13282424-lq.mp3',
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
                if ((error as Error).name !== 'AbortError') {
                    console.warn('Could not play ambient sound:', error);
                }
            }
        }
    };
    
    // We need a user interaction to start audio, but we can try to play it here.
    // In many browsers it will fail until the user clicks something.
    // The "Start System" button click should enable it.
    playAmbient();

    // A hack to enable autoplay on Chrome by playing a silent sound on first interaction
    const enableAutoplay = () => {
        const audio = new Audio(SILENT_WAV);
        audio.play().catch(() => {});
        playAmbient(); // Try to play ambient again after interaction
        window.removeEventListener('click', enableAutoplay);
        window.removeEventListener('keydown', enableAutoplay);
    };
    window.addEventListener('click', enableAutoplay);
    window.addEventListener('keydown', enableAutoplay);
    
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
            if ((error as Error).name !== 'AbortError') {
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
            if ((error as Error).name !== 'AbortError') {
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
