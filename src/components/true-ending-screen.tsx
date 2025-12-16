
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
    trail: { x: number, y: number }[] = [];
    trailLength: number = 5;

    constructor(x: number, y: number, char: string, color: string, speedMultiplier: number = 1) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 15 + 8;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() * 3 + 2) * speedMultiplier;
        this.char = char;
        this.color = color;
    }

    update(width: number, height: number, gravity: number, phase: number) {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }

        if (phase === 4) { // Implosion
            const dx = width / 2 - this.x;
            const dy = height / 2 - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (1 / (dist + 1)) * 50;
            this.speedX += dx * force / (this.size * 5);
            this.speedY += dy * force / (this.size * 5);

            this.speedX *= 0.95; // damping
            this.speedY *= 0.95; // damping
        } else {
            this.speedY += gravity;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y > height && phase !== 4) {
            this.y = 0 - this.size;
            this.x = Math.random() * width;
            this.trail = [];
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Draw trail
        ctx.globalAlpha = 0.5;
        this.trail.forEach((p, index) => {
            const alpha = (index + 1) / this.trailLength;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.font = `${this.size}px "Source Code Pro", monospace`;
            ctx.fillText(this.char, p.x, p.y);
        });

        // Draw particle
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.font = `${this.size}px "Source Code Pro", monospace`;
        ctx.fillText(this.char, this.x, this.y);
        ctx.shadowBlur = 0;
    }
}

export default function TrueEndingScreen({ onComplete, onSoundEvent }: TrueEndingScreenProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();
    const timeouts = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let phase = 0; // 0:init, 1:text, 2:grid, 3:cascade, 4:implosion, 5:flash
        
        // --- Text Phase ---
        let displayedText = '';
        let textToDisplay = '> schism.payload :: confirmed';
        let textIndex = 0;

        // --- Grid Phase ---
        let gridLines: { x1: number, y1: number, x2: number, y2: number, alpha: number, speed: number }[] = [];
        const gridVanishingPoint = { x: width / 2, y: height / 2 };

        // --- Cascade Phase ---
        let particles: Particle[] = [];
        const dataCascadeChars = '01';
        const keywords = ['MindBreak', 'PRISON', 'SCHISME', 'DOULEUR', 'Helios', 'Nyx', 'Omen', '...de mourir ?'];
        
        // --- Effects ---
        let scanlineY = 0;
        let scanlineSpeed = 2;
        let flashAlpha = 0;

        const drawScanlines = () => {
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#000';
            for (let i = 0; i < height; i += 4) {
                ctx.fillRect(0, i, width, 2);
            }
            ctx.globalAlpha = 1;
        };

        const drawVignette = () => {
            const gradient = ctx.createRadialGradient(width/2, height/2, width/2, width/2, height/2, width);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        };
        
        const drawGlowText = (text: string, x: number, y: number, color: string, size: number) => {
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.fillStyle = color;
            ctx.font = `${size}px "Source Code Pro", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(text, x, y);
            
            // Chromatic aberration
            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'red';
            ctx.fillText(text, x - 2, y);
            ctx.fillStyle = 'blue';
            ctx.fillText(text, x + 2, y);
            ctx.globalCompositeOperation = 'source-over';
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, width, height);
            
            if (phase === 1) { // Text
                drawGlowText(displayedText, width / 2, height / 2, '#0f0', 24);
            }
            
            if (phase === 2) { // Grid
                ctx.strokeStyle = '#fff';
                gridLines.forEach(line => {
                    ctx.globalAlpha = line.alpha;
                    ctx.beginPath();
                    ctx.moveTo(line.x1, line.y1);
                    ctx.lineTo(line.x2, line.y2);
                    ctx.stroke();

                    line.x1 += (line.x1 - gridVanishingPoint.x) * line.speed;
                    line.y1 += (line.y1 - gridVanishingPoint.y) * line.speed;
                    line.x2 += (line.x2 - gridVanishingPoint.x) * line.speed;
                    line.y2 += (line.y2 - gridVanishingPoint.y) * line.speed;
                    line.alpha -= 0.005;
                });
                gridLines = gridLines.filter(l => l.alpha > 0);
            }

            if (phase === 3 || phase === 4) { // Cascade & Implosion
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, width, height);
                particles.forEach(p => {
                    p.update(width, height, 0.05, phase);
                    p.draw(ctx);
                });
            }
            
            if (phase === 5) { // Flash
                 ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                 ctx.fillRect(0, 0, width, height);
                 flashAlpha -= 0.05;
                 if (flashAlpha <= 0) {
                     onComplete();
                     return; // Stop animation
                 }
            }
            
            drawScanlines();
            drawVignette();

            animationFrameId.current = requestAnimationFrame(animate);
        };

        const startSequence = () => {
            phase = 1;
            onSoundEvent('click');

            const typeText = () => {
                if (textIndex < textToDisplay.length) {
                    displayedText += textToDisplay[textIndex];
                    textIndex++;
                    timeouts.current.push(setTimeout(typeText, 60));
                } else {
                    timeouts.current.push(setTimeout(startGridPhase, 1000));
                }
            };
            typeText();
        };

        const startGridPhase = () => {
            phase = 2;
            onSoundEvent('grid-fracture');
            for(let i=0; i<50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 50 + 20;
                gridLines.push({
                    x1: gridVanishingPoint.x + Math.cos(angle) * dist,
                    y1: gridVanishingPoint.y + Math.sin(angle) * dist,
                    x2: gridVanishingPoint.x + Math.cos(angle) * (dist + Math.random() * 50),
                    y2: gridVanishingPoint.y + Math.sin(angle) * (dist + Math.random() * 50),
                    alpha: 1,
                    speed: 0.03
                });
            }
            timeouts.current.push(setTimeout(startCascadePhase, 4000));
        };

        const startCascadePhase = () => {
            phase = 3;
            onSoundEvent('data-cascade');
            for(let i=0; i<300; i++) {
                const char = dataCascadeChars[Math.floor(Math.random() * dataCascadeChars.length)];
                particles.push(new Particle(Math.random() * width, Math.random() * height, char, '#0f0', Math.random() * 0.5 + 0.8));
            }
            keywords.forEach(word => {
                particles.push(new Particle(Math.random() * width, 0, word, '#f00', 1.5));
            });
            timeouts.current.push(setTimeout(startImplosionPhase, 7000));
        };

        const startImplosionPhase = () => {
            phase = 4;
            onSoundEvent('implosion');
            timeouts.current.push(setTimeout(startFlashPhase, 2000));
        };
        
        const startFlashPhase = () => {
            phase = 5;
            flashAlpha = 1.0;
        }

        animate(0);
        timeouts.current.push(setTimeout(startSequence, 1000));

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            gridVanishingPoint.x = width / 2;
            gridVanishingPoint.y = height / 2;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            timeouts.current.forEach(clearTimeout);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas ref={canvasRef} className="w-full h-full bg-black cursor-none" />
    );
}
