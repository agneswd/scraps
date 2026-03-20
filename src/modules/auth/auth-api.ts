import type { RecordAuthResponse, RecordModel } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<RecordAuthResponse<RecordModel>> {
  return pocketbase.collection('users').authWithPassword(email, password);
}

export function logoutUser() {
  pocketbase.authStore.clear();
}
