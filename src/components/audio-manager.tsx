'use client';

import { useEffect, useRef, useState }from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | 'stopScream' | 'email' | 'error' | null;
export type MusicEvent = 'calm' | 'calm2' | 'epic' | 'alarm' | 'creepy' | 'cinematic' | 'devyourself' | 'none';

interface AudioManagerProps {
  soundEvent: SoundEvent;
  musicEvent: MusicEvent;
  onEnd: (event: SoundEvent | null) => void;
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<NonNullable<Exclude<SoundEvent, 'stopScream'>>, { src: string | string[]; volume: number; loop?: boolean }> = {
    scream: { src: '/action.mp3', volume: 0.8 },
    glitch: { src: ['/glitch-sound-scary-mp3.mp3', '/error-glitch.mp3', '/glitch-sound-effect_FugN82U.mp3'], volume: 0.4 },
    click: { src: '/clicksoundeffect.mp3', volume: 0.6 },
    email: { src: '/mail.mp3', volume: 0.5 },
    close: { src: '/clicksoundeffect.mp3', volume: 0.4 },
    bsod: { src: '/bluescreen.mp3', volume: 0.5 },
    fan: { src: '/ventil.mp3', volume: 0.4, loop: true },
    error: { src: '/error-011.mp3', volume: 0.5 },
};

const musicTracks: Record<Exclude<MusicEvent, 'none'>, { src: string; volume: number; loop?: boolean }> = {
    calm: { src: '/trkl.mp3', volume: 0.3, loop: true },
    calm2: { src: '/music2.mp3', volume: 0.3, loop: true },
    epic: { src: '/start.mp3', volume: 0.4, loop: true },
    alarm: { src: '/alarm.mp3', volume: 0.6, loop: true },
    creepy: { src: '/30s-creepyBG.mp3', volume: 0.5 },
    cinematic: { src: '/Néo.mp3', volume: 0.8, loop: false },
    devyourself: { src: '/devyourself.mp3', volume: 0.5, loop: false },
};

const SFX_PLAYER_COUNT = 5;

export default function AudioManager({ soundEvent, musicEvent, onEnd }: AudioManagerProps) {
  const sfxPlayersRef = useRef<HTMLAudioElement[]>([]);
  const musicPlayerRef = useRef<HTMLAudioElement | null>(null);
  const screamPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentMusic = useRef<MusicEvent>('none');

  useEffect(() => {
    if (sfxPlayersRef.current.length === 0) {
        for (let i = 0; i < SFX_PLAYER_COUNT; i++) {
            sfxPlayersRef.current.push(new Audio());
        }
    }
    if (!musicPlayerRef.current) {
        musicPlayerRef.current = new Audio();
    }
    if (!screamPlayerRef.current) {
        screamPlayerRef.current = new Audio();
        screamPlayerRef.current.loop = true;
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
    if (!isInitialized) return;
    
    if (soundEvent === 'stopScream') {
        if (screamPlayerRef.current) {
            screamPlayerRef.current.pause();
            screamPlayerRef.current.currentTime = 0;
        }
        onEnd(null);
        return;
    }
    
    if (!soundEvent) return;

    if (soundEvent === 'scream') {
        if (screamPlayerRef.current && screamPlayerRef.current.paused) {
            const sound = sounds.scream;
            screamPlayerRef.current.src = Array.isArray(sound.src) ? sound.src[0] : sound.src;
            screamPlayerRef.current.volume = sound.volume;
            screamPlayerRef.current.play().catch(e => console.warn('Scream play failed', e));
        }
        onEnd(null);
        return;
    }

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
            if(player.loop) player.play(); // Restart loop
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
    
    if (musicEvent !== currentMusic.current) {
        currentMusic.current = musicEvent;
        
        const fadeOutAndStop = (callback: () => void) => {
            if (musicPlayer.paused) {
                callback();
                return;
            }
            let vol = musicPlayer.volume;
            const fadeOutInterval = setInterval(() => {
                vol -= 0.05;
                if (vol > 0) {
                    musicPlayer.volume = Math.max(0, vol);
                } else {
                    clearInterval(fadeOutInterval);
                    musicPlayer.pause();
                    musicPlayer.currentTime = 0;
                    callback();
                }
            }, 50);
        }

        fadeOutAndStop(() => {
            if (musicEvent !== 'none') {
                const track = musicTracks[musicEvent];
                musicPlayer.src = track.src;
                musicPlayer.volume = track.volume;
                musicPlayer.loop = track.loop ?? false;
                musicPlayer.play().catch(e => console.warn("Music play failed", e));
            }
        });
    }

  }, [musicEvent, isInitialized]);

  return null;
}
