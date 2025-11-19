'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type SoundEvent = 'glitch' | 'click' | 'close' | 'bsod' | 'fan' | 'email' | 'error' | null;
export type MusicEvent = 'calm' | 'epic' | 'cinematic' | 'none';
export type AlertEvent = 'scream' | 'ringtone' | 'alarm' | 'stopScream' | 'stopRingtone' | 'stopAlarm';

interface AudioManagerProps {
  soundEvent: SoundEvent;
  musicEvent: MusicEvent;
  alertEvent: AlertEvent | null;
  onSoundEnd: (event: SoundEvent | null) => void;
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<NonNullable<SoundEvent>, { src: string | string[]; volume: number; loop?: boolean }> = {
    glitch: { src: ['/glitch-sound-scary-mp3.mp3', '/error-glitch.mp3', '/glitch-sound-effect_FugN82U.mp3'], volume: 0.4 },
    click: { src: '/clicksoundeffect.mp3', volume: 0.6 },
    email: { src: '/email.mp3', volume: 0.5 },
    close: { src: '/clicksoundeffect.mp3', volume: 0.4 },
    bsod: { src: '/bluescreen.mp3', volume: 0.5 },
    fan: { src: '/ventil.mp3', volume: 0.4, loop: true },
    error: { src: '/error-011.mp3', volume: 0.5 },
};

const musicTracks: Record<Exclude<MusicEvent, 'none' | 'calm'>, { src: string; volume: number; loop?: boolean }> = {
    epic: { src: '/start.mp3', volume: 0.4, loop: true },
    cinematic: { src: '/Néo.mp3', volume: 0.8, loop: false },
};

const alertSounds: Record<Extract<AlertEvent, 'scream' | 'ringtone' | 'alarm'>, { src: string; volume: number; loop?: boolean }> = {
    scream: { src: '/NéoAttaque.mp3', volume: 0.8, loop: true },
    ringtone: { src: '/call.mp3', volume: 0.7, loop: true },
    alarm: { src: '/alarm.mp3', volume: 0.6, loop: true },
};

const calmPlaylist = [
    { src: '/trkl.mp3', volume: 0.3 },
    { src: '/music2.mp3', volume: 0.3 },
    { src: '/Néo-Principale.mp3', volume: 0.4 },
    { src: '/Néo2.mp3', volume: 0.4 },
];

const SFX_PLAYER_COUNT = 5;

const selectSoundSource = (src: string | string[]): string => {
    if (Array.isArray(src)) {
        return src[Math.floor(Math.random() * src.length)];
    }
    return src;
};

export default function AudioManager({ soundEvent, musicEvent, alertEvent, onSoundEnd }: AudioManagerProps) {
  const sfxPlayersRef = useRef<HTMLAudioElement[]>([]);
  const musicPlayerRef = useRef<HTMLAudioElement | null>(null);
  const screamPlayerRef = useRef<HTMLAudioElement | null>(null);
  const alertPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const currentMusic = useRef<MusicEvent>('none');
  const calmPlaylistIndex = useRef(0);
  const musicPausedByScream = useRef(false);

  const playNextCalmTrack = useCallback(() => {
    if (!musicPlayerRef.current || currentMusic.current !== 'calm') return;
    
    if (calmPlaylistIndex.current === 0) {
        for (let i = calmPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [calmPlaylist[i], calmPlaylist[j]] = [calmPlaylist[j], calmPlaylist[i]];
        }
    }
    
    const track = calmPlaylist[calmPlaylistIndex.current];
    musicPlayerRef.current.src = track.src;
    musicPlayerRef.current.volume = track.volume;
    musicPlayerRef.current.loop = false;
    musicPlayerRef.current.play().catch(e => console.warn("Calm music play failed", e));
    
    calmPlaylistIndex.current = (calmPlaylistIndex.current + 1) % calmPlaylist.length;
  }, []);

  useEffect(() => {
    if (!isInitialized) {
        sfxPlayersRef.current = Array.from({ length: SFX_PLAYER_COUNT }, () => new Audio());
        
        const musicPlayer = new Audio();
        musicPlayer.onended = () => {
            if (currentMusic.current === 'calm') {
                playNextCalmTrack();
            }
        };
        musicPlayerRef.current = musicPlayer;

        screamPlayerRef.current = new Audio();
        alertPlayerRef.current = new Audio();
    }

    const enableAudio = async () => {
        if (isInitialized) return;
        try {
            const audio = new Audio(SILENT_WAV);
            await audio.play();
            setIsInitialized(true);
            console.log("Audio context unlocked.");
        } catch (e) {
            console.warn("Audio context unlock failed.", e);
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
    if (!isInitialized || soundEvent === null) return;
    
    const sound = sounds[soundEvent];
    if (!sound) {
        onSoundEnd(null);
        return;
    }

    const sfxPlayer = sfxPlayersRef.current.find(p => p.paused);

    if (sfxPlayer) {
        const src = selectSoundSource(sound.src);
        sfxPlayer.src = src;
        sfxPlayer.volume = sound.volume;
        sfxPlayer.loop = sound.loop || false;
        
        sfxPlayer.onended = () => { sfxPlayer.onended = null; }
        
        sfxPlayer.play().catch(error => {
            if ((error as Error).name !== 'AbortError') {
                console.warn(`Could not play sound (${soundEvent}):`, error);
            }
        });
    }
    onSoundEnd(null);

  }, [soundEvent, isInitialized, onSoundEnd]);

  useEffect(() => {
    if (!isInitialized || !musicPlayerRef.current) return;
    if (musicEvent === currentMusic.current && !musicPlayerRef.current.paused) return;
    
    const musicPlayer = musicPlayerRef.current;
    
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
    
    // Don't change music if a scream is active
    if (musicPausedByScream.current) {
        currentMusic.current = musicEvent;
        return;
    }

    fadeOutAndStop(() => {
        currentMusic.current = musicEvent;
        if (musicEvent === 'calm') {
            calmPlaylistIndex.current = 0;
            playNextCalmTrack();
        } else if (musicEvent !== 'none') {
            const track = musicTracks[musicEvent as Exclude<MusicEvent, 'none' | 'calm'>];
            if (track) {
                musicPlayer.src = track.src;
                musicPlayer.volume = track.volume;
                musicPlayer.loop = track.loop ?? false;
                musicPlayer.play().catch(e => {
                     if ((e as Error).name !== 'AbortError') {
                        console.warn(`Music play failed for ${musicEvent}:`, e);
                    }
                });
            }
        }
    });

  }, [musicEvent, isInitialized, playNextCalmTrack]);

  useEffect(() => {
    if (!isInitialized || !screamPlayerRef.current || !alertPlayerRef.current || !musicPlayerRef.current) return;
    
    const screamPlayer = screamPlayerRef.current;
    const alertPlayer = alertPlayerRef.current;
    const musicPlayer = musicPlayerRef.current;

    switch(alertEvent) {
        case 'scream':
            if (!musicPlayer.paused) {
                musicPlayer.pause();
                musicPausedByScream.current = true;
            }
            const screamTrack = alertSounds.scream;
            screamPlayer.src = screamTrack.src;
            screamPlayer.volume = screamTrack.volume;
            screamPlayer.loop = screamTrack.loop ?? true;
            screamPlayer.play().catch(e => console.warn('Scream play failed', e));
            break;
        
        case 'ringtone':
        case 'alarm':
            const alertTrack = alertSounds[alertEvent];
            alertPlayer.src = alertTrack.src;
            alertPlayer.volume = alertTrack.volume;
            alertPlayer.loop = alertTrack.loop ?? true;
            alertPlayer.play().catch(e => console.warn(`${alertEvent} play failed`, e));
            break;
            
        case 'stopScream':
            if (!screamPlayer.paused) {
                screamPlayer.pause();
                screamPlayer.currentTime = 0;
            }
            if (musicPausedByScream.current) {
                const eventToPlay = currentMusic.current;
                 if (eventToPlay === 'calm') {
                    playNextCalmTrack();
                } else if (eventToPlay !== 'none') {
                    const track = musicTracks[eventToPlay as Exclude<MusicEvent, 'none'|'calm'>];
                    musicPlayer.src = track.src;
                    musicPlayer.volume = track.volume;
                    musicPlayer.loop = track.loop ?? false;
                    musicPlayer.play().catch(e => console.warn("Music resume failed", e));
                }
                musicPausedByScream.current = false;
            }
            break;

        case 'stopRingtone':
        case 'stopAlarm':
            if (!alertPlayer.paused) {
                alertPlayer.pause();
                alertPlayer.currentTime = 0;
            }
            break;
    }
  }, [alertEvent, isInitialized, playNextCalmTrack]);


  return null;
}
