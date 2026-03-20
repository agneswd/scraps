import { Router } from '@/app/Router';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { useOnlineStatus } from '@/shared/hooks/use-online-status';
import { OfflineBanner } from '@/shared/ui/OfflineBanner';

function AppFrame() {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline ? <OfflineBanner /> : null}
      <Router />
    </>
  );
}

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppFrame />
      </AuthProvider>
    </QueryProvider>
  );
}

