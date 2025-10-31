'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScreamerProps {
    onFinish: () => void;
}

export default function Screamer({ onFinish }: ScreamerProps) {
    const screamerImage = PlaceHolderImages.find(img => img.id === 'screamer-face');

    useEffect(() => {
        const timer = setTimeout(onFinish, 700); // Display for 700ms
        return () => clearTimeout(timer);
    }, [onFinish]);

    if (!screamerImage) {
        // Fallback in case the image is not found
        onFinish();
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black animate-in fade-in">
            <div className="relative w-full h-full animate-scream">
                 <Image
                    src={screamerImage.imageUrl}
                    alt={screamerImage.description}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
            </div>
        </div>
    );
}
