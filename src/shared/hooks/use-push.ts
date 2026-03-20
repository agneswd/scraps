export function usePush() {
  return {
    isSupported: typeof window !== 'undefined' && 'PushManager' in window,
    isSubscribed: false,
  };
}