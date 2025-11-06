
'use client';

import { useState } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PC } from '@/lib/network/types';

interface WebBrowserProps {
  network: PC[];
}

const defaultHomePage = `
<div class='h-full flex flex-col justify-center items-center text-center text-muted-foreground p-8'>
    <h1 class='text-4xl mb-4 font-bold text-foreground'>Hypnet Explorer</h1>
    <p class='text-lg'>Welcome to the Hypnet. Enter a domain in the address bar to begin.</p>
</div>
`;

export default function WebBrowser({ network }: WebBrowserProps) {
  const [address, setAddress] = useState('');
  const [currentContent, setCurrentContent] = useState(defaultHomePage);
  const [currentDomain, setCurrentDomain] = useState('home');

  const navigate = () => {
    const targetDomain = address.trim().toLowerCase();
    if (!targetDomain) return;

    const targetServer = network.find(pc => pc.type === 'WebServer' && pc.domain?.toLowerCase() === targetDomain);
    
    if (targetServer && targetServer.websiteContent) {
      setCurrentContent(targetServer.websiteContent);
      setCurrentDomain(targetServer.domain || 'unknown');
    } else {
      setCurrentContent(`
        <div class='h-full flex flex-col justify-center items-center text-center text-red-400 p-8'>
            <h1 class='text-2xl mb-4'>ERR_NAME_NOT_RESOLVED</h1>
            <p>The domain '${targetDomain}' could not be found on the Hypnet.</p>
        </div>
      `);
      setCurrentDomain('error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-card font-sans">
      <div className="flex items-center p-2 border-b gap-2">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <Input 
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate()}
            placeholder="Enter a domain... (e.g., proxy.corp)"
            className="h-8 bg-secondary border-input"
          />
        </div>
        <Button size="sm" className="h-8" onClick={navigate}>
          <ArrowRight />
        </Button>
      </div>
      <div className="flex-grow bg-gray-100 dark:bg-gray-900 overflow-y-auto">
        <iframe
          srcDoc={currentContent}
          sandbox="allow-scripts" // Be careful with this in a real app
          className="w-full h-full border-0"
          title={currentDomain}
        />
      </div>
    </div>
  );
}

    