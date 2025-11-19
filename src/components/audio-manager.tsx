
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type SoundEvent = 'scream' | 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | 'stopScream' | 'email' | 'error' | 'ringtone' | null;
export type MusicEvent = 'calm' | 'epic' | 'alarm' | 'creepy' | 'cinematic' | 'none';

interface AudioManagerProps {
  soundEvent: SoundEvent;
  musicEvent: MusicEvent;
  onEnd: (event: SoundEvent | null) => void;
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<NonNullable<Exclude<SoundEvent, 'stopScream'>>, { src: string | string[]; volume: number; loop?: boolean }> = {
    scream: { src: ['/action.mp3', '/NéoAttaque.mp3'], volume: 0.8, loop: true },
    glitch: { src: ['/glitch-sound-scary-mp3.mp3', '/error-glitch.mp3', '/glitch-sound-effect_FugN82U.mp3'], volume: 0.4 },
    click: { src: '/clicksoundeffect.mp3', volume: 0.6 },
    email: { src: '/email.mp3', volume: 0.5 },
    close: { src: '/clicksoundeffect.mp3', volume: 0.4 },
    bsod: { src: '/bluescreen.mp3', volume: 0.5 },
    fan: { src: '/ventil.mp3', volume: 0.4, loop: true },
    error: { src: '/error-011.mp3', volume: 0.5 },
    ringtone: { src: ['/call.mp3', '/remixcall.mp3'], volume: 0.7, loop: true },
};

const musicTracks: Record<Exclude<MusicEvent, 'none' | 'calm'>, { src: string; volume: number; loop?: boolean }> = {
    epic: { src: '/start.mp3', volume: 0.4, loop: true },
    alarm: { src: '/alarm.mp3', volume: 0.6, loop: true },
    creepy: { src: '/30s-creepyBG.mp3', volume: 0.5 },
    cinematic: { src: '/Néo.mp3', volume: 0.8, loop: false },
};

const calmPlaylist = [
    { src: '/trkl.mp3', volume: 0.3 },
    { src: '/music2.mp3', volume: 0.3 },
    { src: '/Néo-Principale.mp3', volume: 0.4 },
    { src: '/Néo2.mp3', volume: 0.4 },
];

const SFX_PLAYER_COUNT = 5;

// Function to select a sound source with weighted probability
const selectSoundSource = (src: string | string[]): string => {
    if (Array.isArray(src)) {
        // Special case for ringtone: 95% chance for call.mp3, 5% for remixcall.mp3
        if (src.includes('/call.mp3') && src.includes('/remixcall.mp3')) {
            return Math.random() < 0.05 ? '/remixcall.mp3' : '/call.mp3';
        }
        return src[Math.floor(Math.random() * src.length)];
    }
    return src;
};

export default function AudioManager({ soundEvent, musicEvent, onEnd }: AudioManagerProps) {
  const sfxPlayersRef = useRef<HTMLAudioElement[]>([]);
  const musicPlayerRef = useRef<HTMLAudioElement | null>(null);
  const specialLoopPlayerRef = useRef<HTMLAudioElement | null>(null); // For scream, fan, ringtone
  const [isInitialized, setIsInitialized] = useState(false);
  const currentMusic = useRef<MusicEvent>('none');
  const calmPlaylistIndex = useRef(0);

  const playNextCalmTrack = useCallback(() => {
    if (!musicPlayerRef.current || currentMusic.current !== 'calm') return;
    
    // Shuffle playlist on first play
    if (calmPlaylistIndex.current === 0) {
        for (let i = calmPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [calmPlaylist[i], calmPlaylist[j]] = [calmPlaylist[j], calmPlaylist[i]];
        }
    }
    
    const track = calmPlaylist[calmPlaylistIndex.current];
    musicPlayerRef.current.src = track.src;
    musicPlayerRef.current.volume = track.volume;
    musicPlayerRef.current.loop = false; // Important for playlist
    musicPlayerRef.current.play().catch(e => console.warn("Calm music play failed", e));
    
    calmPlaylistIndex.current = (calmPlaylistIndex.current + 1) % calmPlaylist.length;

  }, []);

  useEffect(() => {
    if (sfxPlayersRef.current.length === 0) {
        for (let i = 0; i < SFX_PLAYER_COUNT; i++) {
            sfxPlayersRef.current.push(new Audio());
        }
    }
    if (!musicPlayerRef.current) {
        const player = new Audio();
        player.onended = () => {
            if (currentMusic.current === 'calm') {
                playNextCalmTrack();
            }
        };
        musicPlayerRef.current = player;
    }
    if (!specialLoopPlayerRef.current) {
        specialLoopPlayerRef.current = new Audio();
        specialLoopPlayerRef.current.loop = true;
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
  }, [isInitialized, playNextCalmTrack]);

  useEffect(() => {
    if (!isInitialized) return;

    if (soundEvent === 'stopScream') {
        if (specialLoopPlayerRef.current) {
            specialLoopPlayerRef.current.pause();
            specialLoopPlayerRef.current.currentTime = 0;
        }
        onEnd(null);
        return;
    }
    
    const player = specialLoopPlayerRef.current;
    if (soundEvent === 'ringtone' || soundEvent === 'scream' || soundEvent === 'fan') {
        const sound = sounds[soundEvent];
        if (player && sound.loop) {
            const src = selectSoundSource(sound.src);
            player.src = src;
            player.volume = sound.volume;
            player.loop = sound.loop;
            player.play().catch(e => console.warn(`Loop sound ${soundEvent} play failed`, e));
        }
        onEnd(null); // Reset event immediately
        return;
    }
    
    // Stop looping sounds if event is null but not for stopping scream specifically
    if(soundEvent === null) {
        if (player) {
            player.pause();
            player.currentTime = 0;
        }
        onEnd(null);
        return;
    }


    // Handle one-shot sounds
    const sfxPlayer = sfxPlayersRef.current.find(p => p.paused);

    if (sfxPlayer) {
        const sound = sounds[soundEvent];
        if (!sound) return;

        const src = selectSoundSource(sound.src);
        sfxPlayer.src = src;
        sfxPlayer.volume = sound.volume;
        sfxPlayer.loop = sound.loop || false;
        
        sfxPlayer.onended = () => {
            onEnd(soundEvent);
            sfxPlayer.onended = null;
        };
        
        sfxPlayer.play().catch(error => {
            if ((error as Error).name !== 'AbortError') {
                console.warn(`Could not play sound (${soundEvent}):`, error);
            }
            onEnd(soundEvent); // Ensure onEnd is called even if play fails
        });
        
        onEnd(null); // Reset event immediately
    } else {
      // If no player is available, just end the event
      onEnd(soundEvent);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEvent, isInitialized]);


  useEffect(() => {
    if (!isInitialized || !musicPlayerRef.current) return;

    const musicPlayer = musicPlayerRef.current;
    
    if (musicEvent !== currentMusic.current) {
        currentMusic.current = musicEvent;
        
        const fadeOutAndStop = (callback: () => void) => {
            if (musicPlayer.paused || musicPlayer.volume === 0) {
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
            if (musicEvent === 'calm') {
                calmPlaylistIndex.current = 0; // Reset and shuffle playlist
                playNextCalmTrack();
            } else if (musicEvent !== 'none') {
                const track = musicTracks[musicEvent as Exclude<MusicEvent, 'none' | 'calm'>];
                musicPlayer.src = track.src;
                musicPlayer.volume = track.volume;
                musicPlayer.loop = track.loop ?? false;
                musicPlayer.play().catch(e => console.warn("Music play failed", e));
            }
        });
    }

  }, [musicEvent, isInitialized, playNextCalmTrack]);

  return null;
}
