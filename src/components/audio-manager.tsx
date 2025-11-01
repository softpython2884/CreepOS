'use client';

import { useEffect, useRef, useState }from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | null;
export type MusicEvent = 'calm' | 'epic' | 'none';

interface AudioManagerProps {
  soundEvent: SoundEvent;
  musicEvent: MusicEvent;
  onEnd: () => void;
}

// Base64 encoded silent WAV file to enable autoplay
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<NonNullable<SoundEvent>, { src: string; volume: number; loop?: boolean }> = {
    scream: { src: '/action.mp3', volume: 0.8 },
    glitch: { src: '/glitch-sound-scary-mp3.mp3', volume: 0.3 },
    click: { src: '/clicksoundeffect.mp3', volume: 0.6 },
    close: { src: '/clicksoundeffect.mp3', volume: 0.4 },
    bsod: { src: '/bluescreen.mp3', volume: 0.5 },
    fan: { src: '/ventil.mp3', volume: 0.1, loop: true },
};

const musicTracks: Record<Exclude<MusicEvent, 'none'>, { src: string; volume: number; }> = {
    calm: { src: '/trkl.mp3', volume: 0.3 },
    epic: { src: '/start.mp3', volume: 0.4 },
};

export default function AudioManager({ soundEvent, musicEvent, onEnd }: AudioManagerProps) {
  const sfxPlayerRef = useRef<HTMLAudioElement>(null);
  const musicPlayerRef = useRef<HTMLAudioElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentMusic = useRef<MusicEvent>('none');


  useEffect(() => {
    const enableAudio = async () => {
        if (isInitialized) return;
        try {
            // Play silent audio to unlock autoplay
            const audio = new Audio(SILENT_WAV);
            await audio.play();
            setIsInitialized(true);
        } catch (e) {
            // Autoplay might still be blocked
        }
    };
    window.addEventListener('click', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });

    return () => {
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('keydown', enableAudio);
    }
  }, [isInitialized]);


  useEffect(() => {
    if (!isInitialized || !sfxPlayerRef.current) return;
    
    const sfxPlayer = sfxPlayerRef.current;

    if (soundEvent) {
      const sound = sounds[soundEvent];
      if (sound) {
        if (sfxPlayer.src !== sound.src) {
           sfxPlayer.src = sound.src;
        }
        sfxPlayer.volume = sound.volume;
        sfxPlayer.loop = sound.loop || false;
        sfxPlayer.play().catch(error => {
            if ((error as Error).name !== 'AbortError') {
                console.warn(`Could not play sound (${soundEvent}):`, error);
            }
        });
      }
    } else {
        if (!sfxPlayer.paused && sfxPlayer.loop === false) {
             // Let non-looping sounds finish, but we can add logic to stop them if needed
        }
    }
  }, [soundEvent, isInitialized]);


  useEffect(() => {
    if (!isInitialized || !musicPlayerRef.current) return;

    const musicPlayer = musicPlayerRef.current;
    
    if (musicEvent !== 'none' && musicEvent !== currentMusic.current) {
        currentMusic.current = musicEvent;
        const track = musicTracks[musicEvent];
        
        // Fade out current track
        let fadeOutInterval: NodeJS.Timeout;
        if (!musicPlayer.paused) {
            let vol = musicPlayer.volume;
            fadeOutInterval = setInterval(() => {
                vol -= 0.05;
                if (vol > 0) {
                    musicPlayer.volume = Math.max(0, vol);
                } else {
                    clearInterval(fadeOutInterval);
                    musicPlayer.pause();
                    musicPlayer.currentTime = 0;
                    // Play new track
                    musicPlayer.src = track.src;
                    musicPlayer.volume = track.volume;
                    musicPlayer.loop = true;
                    musicPlayer.play().catch(e => console.warn("Music play failed", e));
                }
            }, 100);
        } else {
            // If paused, just start new track
            musicPlayer.src = track.src;
            musicPlayer.volume = track.volume;
            musicPlayer.loop = true;
            musicPlayer.play().catch(e => console.warn("Music play failed", e));
        }

    } else if (musicEvent === 'none' && !musicPlayer.paused) {
        currentMusic.current = 'none';
        musicPlayer.pause();
    }

  }, [musicEvent, isInitialized]);

  return (
    <>
      <audio ref={sfxPlayerRef} onEnded={onEnd} />
      <audio ref={musicPlayerRef} loop />
    </>
  );
}