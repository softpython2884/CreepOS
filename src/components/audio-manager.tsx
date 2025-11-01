'use client';

import { useEffect, useRef, useState }from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | null;
export type MusicEvent = 'calm' | 'epic' | 'none';

interface AudioManagerProps {
  soundEvent: SoundEvent;
  musicEvent: MusicEvent;
  onEnd: (event: SoundEvent) => void;
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<NonNullable<SoundEvent>, { src: string | string[]; volume: number; loop?: boolean }> = {
    scream: { src: '/action.mp3', volume: 0.8 },
    glitch: { src: ['/glitch-sound-scary-mp3.mp3', '/error-glitch.mp3', '/glitch-sound-effect_FugN82U.mp3'], volume: 0.4 },
    click: { src: '/clicksoundeffect.mp3', volume: 0.6 },
    close: { src: '/clicksoundeffect.mp3', volume: 0.4 },
    bsod: { src: '/bluescreen.mp3', volume: 0.5 },
    fan: { src: '/ventil.mp3', volume: 0.1, loop: true },
};

const musicTracks: Record<Exclude<MusicEvent, 'none'>, { src: string; volume: number; }> = {
    calm: { src: '/trkl.mp3', volume: 0.3 },
    epic: { src: '/start.mp3', volume: 0.4 },
};

const SFX_PLAYER_COUNT = 5;

export default function AudioManager({ soundEvent, musicEvent, onEnd }: AudioManagerProps) {
  const sfxPlayersRef = useRef<HTMLAudioElement[]>([]);
  const musicPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentMusic = useRef<MusicEvent>('none');

  useEffect(() => {
    // Initialize audio players
    if (sfxPlayersRef.current.length === 0) {
        for (let i = 0; i < SFX_PLAYER_COUNT; i++) {
            sfxPlayersRef.current.push(new Audio());
        }
    }
    if (!musicPlayerRef.current) {
        musicPlayerRef.current = new Audio();
    }

    const enableAudio = async () => {
        if (isInitialized) return;
        try {
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
    if (!isInitialized || !soundEvent) return;

    const sound = sounds[soundEvent];
    if (!sound) return;

    const player = sfxPlayersRef.current.find(p => p.paused);

    if (player) {
        let src = '';
        if (Array.isArray(sound.src)) {
            src = sound.src[Math.floor(Math.random() * sound.src.length)];
        } else {
            src = sound.src;
        }

        if (player.src !== window.location.origin + src) {
            player.src = src;
        }
        player.volume = sound.volume;
        player.loop = sound.loop || false;
        
        player.onended = () => {
            onEnd(soundEvent);
        };
        
        player.play().catch(error => {
            if ((error as Error).name !== 'AbortError') {
                console.warn(`Could not play sound (${soundEvent}):`, error);
            }
        });
        
        // Reset the event so it can be triggered again
        onEnd(null);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEvent, isInitialized]);


  useEffect(() => {
    if (!isInitialized || !musicPlayerRef.current) return;

    const musicPlayer = musicPlayerRef.current;
    
    if (musicEvent !== 'none' && musicEvent !== currentMusic.current) {
        currentMusic.current = musicEvent;
        const track = musicTracks[musicEvent];
        
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
                    
                    musicPlayer.src = track.src;
                    musicPlayer.volume = track.volume;
                    musicPlayer.loop = true;
                    musicPlayer.play().catch(e => console.warn("Music play failed", e));
                }
            }, 100);
        } else {
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

  return null;
}
