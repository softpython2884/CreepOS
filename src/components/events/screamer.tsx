'use client';

import Image from 'next/image';
import { useEffect } from 'react';

interface ScreamerProps {
    onFinish: () => void;
}

const screamerImage = {
    imageUrl: "https://i.ibb.co/C09H3sP/screamer.jpg",
    description: "A distorted, ghostly face screaming from the darkness."
};

export default function Screamer({ onFinish }: ScreamerProps) {

    useEffect(() => {
        const timer = setTimeout(onFinish, 700); // Display for 700ms
        return () => clearTimeout(timer);
    }, [onFinish]);

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
