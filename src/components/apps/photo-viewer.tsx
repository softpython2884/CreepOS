'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


interface PhotoViewerProps {
  extraImages?: ImagePlaceholder[];
  highlightedImageId?: string;
  isSystemCollapsing?: boolean;
}

export default function PhotoViewer({ extraImages = [], highlightedImageId, isSystemCollapsing = false }: PhotoViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isImageDeforming, setIsImageDeforming] = useState(false);
  
  const allImages = useMemo(() => {
    const combined = [...PlaceHolderImages, ...extraImages];
    // Simple shuffle to make captured images appear at random positions
    return combined.sort(() => Math.random() - 0.5);
  }, [extraImages]);
  
  useMemo(() => {
    if (highlightedImageId) {
      setIsImageDeforming(true);
      const timer = setTimeout(() => {
        setIsImageDeforming(false);
      }, 4000); // Duration of the effect
      return () => clearTimeout(timer);
    }
  }, [highlightedImageId]);

  const getImageToDisplay = (image: ImagePlaceholder) => {
    if (isSystemCollapsing && image.id.startsWith('capture-')) {
        const lastCaptured = extraImages[extraImages.length - 1];
        if (lastCaptured) return lastCaptured;
    }
    return image;
  }

  return (
    <ScrollArea className="h-full bg-card">
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {allImages.map((image, index) => {
          const isHighlighted = image.id === highlightedImageId;
          const displayImage = getImageToDisplay(image);
          
          return (
            <Dialog key={`${displayImage.id}-${index}`} onOpenChange={(open) => !open && setZoomLevel(1)}>
              <DialogTrigger asChild>
                <div className={cn("aspect-square relative group cursor-pointer overflow-hidden rounded-md", 
                  isHighlighted && "animate-pulse-strong",
                  isSystemCollapsing && "animate-glitch"
                )}>
                  <Image
                    src={displayImage.imageUrl}
                    alt={displayImage.description}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-300 group-hover:scale-110",
                      isHighlighted && isImageDeforming && "animate-image-deform",
                      isSystemCollapsing && "animate-image-deform"
                    )}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    data-ai-hint={displayImage.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="text-white h-10 w-10" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-auto bg-black/80 border-accent/20 backdrop-blur-md p-2">
                <div className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center">
                   <Image
                      src={displayImage.imageUrl}
                      alt={displayImage.description}
                      fill
                      className="object-contain transition-transform duration-300"
                      style={{ transform: `scale(${zoomLevel})` }}
                      sizes="90vw"
                      data-ai-hint={displayImage.imageHint}
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
          )
        })}
      </div>
    </ScrollArea>
  );
}
