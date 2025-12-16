
'use client';

import { useEffect, useRef } from 'react';
import type { SoundEvent } from './audio-manager';

interface TrueEndingScreenProps {
  onComplete: () => void;
  onSoundEvent: (event: SoundEvent) => void;
}

class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    char: string;
    color: string;

    constructor(x: number, y: number, char: string, color: string) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 15 + 5;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * -15 - 5;
        this.char = char;
        this.color = color;
    }

    update(ctx: CanvasRenderingContext2D, width: number, height: number, gravity: number, phase: number) {
        if (phase === 4) { // Implosion
            const dx = width / 2 - this.x;
            const dy = height / 2 - this.y;
            this.speedX = dx / 20;
            this.speedY = dy / 20;
        } else {
            this.speedY += gravity;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y > height && phase !== 4) {
            this.y = 0 - this.size;
            this.x = Math.random() * width;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px "Source Code Pro", monospace`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

export default function TrueEndingScreen({ onComplete, onSoundEvent }: TrueEndingScreenProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();
    const timeoutIds = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let phase = 0; // 0: init, 1: text, 2: grid fracture, 3: data cascade, 4: implosion
        let lines: { x1: number, y1: number, x2: number, y2: number, alpha: number }[] = [];
        let particles: Particle[] = [];
        const dataCascadeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const keywords = ['MindBreak', 'PRISON', 'SCHISME', 'DOULEUR', 'Helios', 'Nyx', 'Omen', 'Est-ce que cela fait mal...'];
        
        const reset = () => {
            ctx.clearRect(0, 0, width, height);
            lines = [];
            particles = [];
            phase = 0;
        };

        const drawText = (text: string, onEnd: () => void) => {
            let i = 0;
            const interval = setInterval(() => {
                if (phase !== 1) {
                    clearInterval(interval);
                    return;
                }
                ctx.clearRect(0, 0, width, height);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#fff';
                ctx.font = '24px "Source Code Pro", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(text.substring(0, i), width / 2, height / 2);
                i++;
                if (i > text.length) {
                    clearInterval(interval);
                    setTimeout(onEnd, 1000);
                }
            }, 60);
            timeoutIds.current.push(interval as unknown as NodeJS.Timeout);
        };
        
        const animateGrid = () => {
            if (phase !== 2) return;
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#fff';
            
            lines.forEach(line => {
                ctx.globalAlpha = line.alpha;
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.stroke();
                line.alpha = Math.min(1, line.alpha + 0.01);
            });

            animationFrameId.current = requestAnimationFrame(animateGrid);
        };

        const animateCascade = () => {
            if (phase !== 3 && phase !== 4) return;
            
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;

            particles.forEach(p => {
                p.update(ctx, width, height, 0.05, phase);
                p.draw(ctx);
            });

            if (phase === 4 && particles.every(p => Math.abs(width/2 - p.x) < 5 && Math.abs(height/2 - p.y) < 5)) {
                if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
                return;
            }

            animationFrameId.current = requestAnimationFrame(animateCascade);
        };

        // --- Animation Sequence ---
        const startSequence = () => {
            reset();
            phase = 1;
            onSoundEvent('click');
            drawText('> schism.payload :: confirmed', () => {
                drawText('> running...', () => {
                    // Phase 2: Grid Fracture
                    phase = 2;
                    onSoundEvent('grid-fracture');
                    let i = 0;
                    const gridInterval = setInterval(() => {
                        const isHorizontal = Math.random() > 0.5;
                        if(isHorizontal) {
                            lines.push({ x1: 0, y1: Math.random() * height, x2: width, y2: Math.random() * height, alpha: 0 });
                        } else {
                            lines.push({ x1: Math.random() * width, y1: 0, x2: Math.random() * width, y2: height, alpha: 0 });
                        }
                        i++;
                        if (i > 50) clearInterval(gridInterval);
                    }, 50);
                    timeoutIds.current.push(gridInterval as unknown as NodeJS.Timeout);
                    animateGrid();

                    timeoutIds.current.push(setTimeout(() => {
                        // Phase 3: Data Cascade
                        phase = 3;
                        onSoundEvent('data-cascade');
                        for(let i=0; i<100; i++) {
                            const char = dataCascadeChars[Math.floor(Math.random() * dataCascadeChars.length)];
                            particles.push(new Particle(Math.random() * width, Math.random() * height, char, '#0f0'));
                        }
                        keywords.forEach(word => {
                            particles.push(new Particle(Math.random() * width, Math.random() * height, word, '#f00'));
                        });
                        animateCascade();

                        timeoutIds.current.push(setTimeout(() => {
                            // Phase 4: Implosion
                            phase = 4;
                            onSoundEvent('implosion');
                            
                            timeoutIds.current.push(setTimeout(() => {
                                onComplete();
                            }, 2000));

                        }, 7000));

                    }, 5000));
                });
            });
        };
        
        timeoutIds.current.push(setTimeout(startSequence, 1000));


        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            timeoutIds.current.forEach(clearTimeout);
            window.removeEventListener('resize', handleResize);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <canvas ref={canvasRef} className="w-full h-full bg-black" />
    );
}
