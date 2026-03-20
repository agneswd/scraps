import { Router } from '@/app/Router';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryProvider>
  );
}
