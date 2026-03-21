import { Router } from '@/app/Router';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { PreferencesProvider } from '@/app/providers/PreferencesProvider';
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
      <PreferencesProvider>
        <AuthProvider>
          <AppFrame />
        </AuthProvider>
      </PreferencesProvider>
    </QueryProvider>
  );
}

