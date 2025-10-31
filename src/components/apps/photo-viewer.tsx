'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PhotoViewer() {
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <ScrollArea className="h-full bg-card">
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {PlaceHolderImages.map((image) => (
          <Dialog key={image.id} onOpenChange={(open) => !open && setZoomLevel(1)}>
            <DialogTrigger asChild>
              <div className="aspect-square relative group cursor-pointer overflow-hidden rounded-md">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  data-ai-hint={image.imageHint}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="text-white h-10 w-10" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-auto bg-black/80 border-accent/20 backdrop-blur-md p-2">
              <div className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center">
                 <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-contain transition-transform duration-300"
                    style={{ transform: `scale(${zoomLevel})` }}
                    data-ai-hint={image.imageHint}
                  />
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))}>
                  <ZoomIn />
                </Button>
                <Button size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}>
                  <ZoomOut />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </ScrollArea>
  );
}
