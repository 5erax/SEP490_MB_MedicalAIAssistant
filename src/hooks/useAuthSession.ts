import { useAuth } from '@/src/providers';

export function useAuthSession() {
  return useAuth();
}
