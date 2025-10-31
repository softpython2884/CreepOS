'use client';

import { useEffect, useRef } from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | null;

interface AudioManagerProps {
  event: SoundEvent;
  onEnd: () => void;
}

// Base64 encoded silent WAV file to enable autoplay
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// Using free sound effects from Pixabay
const sounds: Record<NonNullable<SoundEvent>, { src: string; volume: number }> = {
    scream: { src: 'https://cdn.pixabay.com/audio/2022/10/24/audio_92452b4b3d.mp3', volume: 0.7 },
    glitch: { src: 'https://cdn.pixabay.com/audio/2022/11/17/audio_34b7f5a03d.mp3', volume: 0.3 },
    click: { src: 'https://cdn.pixabay.com/audio/2022/03/15/audio_24e03b1365.mp3', volume: 0.5 },
    close: { src: 'https://cdn.pixabay.com/audio/2022/03/22/audio_60370cb9ac.mp3', volume: 0.4 },
    bsod: { src: 'https://cdn.pixabay.com/audio/2022/11/19/audio_2c96cbe26b.mp3', volume: 0.5 },
};

const ambientSound = {
    src: 'https://cdn.pixabay.com/audio/2024/05/27/audio_96500f73f5.mp3',
    volume: 0.1
};

export default function AudioManager({ event, onEnd }: AudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement>(null);

  // Play ambient sound on mount
  useEffect(() => {
    const playAmbient = async () => {
        if (ambientAudioRef.current) {
            try {
                ambientAudioRef.current.src = ambientSound.src;
                ambientAudioRef.current.volume = ambientSound.volume;
                ambientAudioRef.current.loop = true;
                await ambientAudioRef.current.play();
            } catch (error) {
                console.warn('Could not play ambient sound:', error);
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
    if (event && audioRef.current) {
      const sound = sounds[event];
      if (sound) {
        audioRef.current.src = sound.src;
        audioRef.current.volume = sound.volume;
        audioRef.current.play().catch(error => console.warn(`Could not play sound (${event}):`, error));
      }
    }
  }, [event]);

  return (
    <>
      <audio ref={audioRef} onEnded={onEnd} />
      <audio ref={ambientAudioRef} loop />
    </>
  );
}
