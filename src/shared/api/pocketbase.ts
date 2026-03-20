import PocketBase from 'pocketbase';

const configuredPocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.trim();

const normalizedPocketBaseUrl = configuredPocketBaseUrl
	?.replace(/\/api\/?$/, '')
	.replace(/\/$/, '');

const pocketbaseUrl =
	normalizedPocketBaseUrl ||
	(typeof window === 'undefined' ? 'http://127.0.0.1:8090' : window.location.origin);

export const pocketbase = new PocketBase(pocketbaseUrl);
