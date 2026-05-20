'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { syncWithBackend } = useWatchlistStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // We are on the client, user state is hydrated.
    if (!user && pathname !== '/auth') {
      router.replace('/auth');
    } else if (user && pathname === '/auth') {
      router.replace('/');
    }

    if (user) {
      syncWithBackend();
    }
  }, [user, pathname, router, mounted, syncWithBackend]);

  // If not mounted, or if not logged in and not on auth page, don't render children to avoid layout flashes
  if (!mounted || (!user && pathname !== '/auth')) return null;

  return <>{children}</>;
}
