
'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PC } from '@/lib/network/types';

interface WebBrowserProps {
  network: PC[];
  initialUrl?: string; // To open a specific URL on launch
}

const defaultHomePageContent = (network: PC[]): string => {
    const searchServer = network.find(pc => pc.domain === 'hyp.net');
    return searchServer?.websiteContent || `
        <div class='h-full flex flex-col justify-center items-center text-center text-red-400 p-8'>
            <h1 class='text-2xl mb-4'>CRITICAL ERROR</h1>
            <p>Hypnet Search (hyp.net) could not be found. The network may be unstable.</p>
        </div>
    `;
};


export default function WebBrowser({ network, initialUrl }: WebBrowserProps) {
  const [address, setAddress] = useState(initialUrl || 'hyp.net');
  const [currentContent, setCurrentContent] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInitialMount = useRef(true);

  const navigate = (targetDomain?: string) => {
    const domain = (targetDomain || address).trim().toLowerCase();
    if (!domain) return;
    
    if (domain.startsWith('/')) {
        // Handle local file paths
        setAddress(domain);
        setCurrentDomain(domain.split('/').pop() || 'file');

        fetch(domain)
            .then(res => res.text())
            .then(text => setCurrentContent(text))
            .catch(() => setCurrentContent(`
                <div class='h-full flex flex-col justify-center items-center text-center text-red-400 p-8 font-code'>
                    <h1 class='text-2xl mb-4'>ERR_FILE_NOT_FOUND</h1>
                    <p>The file '${domain}' could not be loaded.</p>
                </div>`
            ));
        return;
    }

    const targetServer = network.find(pc => pc.type === 'WebServer' && pc.domain?.toLowerCase() === domain);
    
    if (targetServer && targetServer.websiteContent) {
      setCurrentContent(targetServer.websiteContent);
      setCurrentDomain(targetServer.domain || 'unknown');
      setAddress(domain);
    } else {
      setCurrentContent(`
        <div class='h-full flex flex-col justify-center items-center text-center text-red-400 p-8 font-code'>
            <h1 class='text-2xl mb-4'>ERR_NAME_NOT_RESOLVED</h1>
            <p>The domain '${domain}' could not be found on the Hypnet.</p>
        </div>
      `);
      setCurrentDomain('error');
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
        if(initialUrl) {
            navigate(initialUrl);
        } else {
             // Set home page on initial load
            const homeContent = defaultHomePageContent(network);
            setCurrentContent(homeContent);
            setCurrentDomain('hyp.net');
            setAddress('hyp.net');
        }
        isInitialMount.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        // IMPORTANT: Add origin check in a real app
        // if (event.origin !== "expected-origin") return;
        
        if (event.data && event.data.type === 'hypnet-navigate') {
            const domain = event.data.domain;
            navigate(domain);
        }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
        window.removeEventListener('message', handleMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]); 


  const injectedScript = `
    <script>
        document.addEventListener('click', function(e) {
            let target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }

            if (target && target.hasAttribute('data-internal-link')) {
                e.preventDefault();
                const domain = target.getAttribute('data-internal-link');
                window.parent.postMessage({ type: 'hypnet-navigate', domain: domain }, '*');
            }
        });
    </script>
  `;
  
  const contentWithScript = currentContent + injectedScript;

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
        <Button size="sm" className="h-8" onClick={() => navigate()}>
          <ArrowRight />
        </Button>
      </div>
      <div className="flex-grow bg-gray-100 dark:bg-gray-900 overflow-y-auto">
        <iframe
          ref={iframeRef}
          srcDoc={contentWithScript}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          title={currentDomain}
        />
      </div>
    </div>
  );
}

    

    

