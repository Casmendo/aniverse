'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Network } from '@capacitor/network';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    Network.getStatus().then(status => {
      setIsOffline(!status.connected);
    }).catch(() => {
      // Fallback for non-capacitor environments
      setIsOffline(!navigator.onLine);
    });

    // Listen for changes
    const listener = Network.addListener('networkStatusChange', status => {
      setIsOffline(!status.connected);
    });

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      listener.then(l => l.remove()).catch(() => {});
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff size={14} />
      <span>You are offline. Showing cached content and library.</span>
    </div>
  );
}
