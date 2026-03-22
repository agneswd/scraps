import PocketBase from 'pocketbase';

const configuredPocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.trim();

const normalizedPocketBaseUrl = configuredPocketBaseUrl
	?.replace(/\/api\/?$/, '')
	.replace(/\/$/, '');

const pocketbaseUrl =
	normalizedPocketBaseUrl ||
	(typeof window === 'undefined' ? 'http://127.0.0.1:8090' : window.location.origin);

export const pocketbase = new PocketBase(pocketbaseUrl);

/**
 * Validates that a value matches PocketBase's record ID format (15 lowercase
 * alphanumeric characters). Throws if the value does not match, preventing
 * untrusted strings from being interpolated directly into filter expressions.
 */
export function assertPbId(value: string, label = 'id'): string {
  if (!/^[a-z0-9]{15}$/.test(value)) {
    throw new Error(`invalid-pb-id:${label}`);
  }
  return value;
}
