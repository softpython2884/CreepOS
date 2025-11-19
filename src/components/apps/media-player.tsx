'use client';

import { Music, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface MediaPlayerProps {
  fileName: string;
  filePath: string;
}

const isAudio = (fileName: string) => /\.(mp3|wav|ogg|pm3)$/i.test(fileName);
const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

export default function MediaPlayer({ fileName, filePath }: MediaPlayerProps) {
  
  const renderContent = () => {
    if (isAudio(fileName)) {
      return (
        <div className="h-full flex flex-col justify-center items-center gap-4 p-4 text-center">
          <Music className="h-16 w-16 text-accent" />
          <p className="font-bold text-lg">{fileName}</p>
          <audio controls autoPlay className="w-full max-w-sm" key={filePath}>
            <source src={filePath} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (isImage(fileName)) {
      return (
        <div className="h-full flex justify-center items-center p-4">
          <img src={filePath} alt={fileName} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    return (
       <div className="h-full flex flex-col justify-center items-center gap-4 p-4 text-center text-destructive">
          <AlertTriangle className="h-16 w-16" />
          <p className="font-bold text-lg">Unsupported File Type</p>
          <p className="text-sm">{fileName}</p>
        </div>
    )
  };

  return (
    <div className="h-full bg-secondary text-foreground font-code">
      {renderContent()}
    </div>
  );
}
