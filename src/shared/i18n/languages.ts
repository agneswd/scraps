import i18n from '@/shared/i18n/i18n';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espanol' },
  { code: 'fr', label: 'French', nativeLabel: 'Francais' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Russkiy' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska' },
  { code: 'tl', label: 'Filipino', nativeLabel: 'Filipino' },
  { code: 'ceb', label: 'Cebuano', nativeLabel: 'Cebuano' },
  { code: 'mni', label: 'Meitei', nativeLabel: 'Meitei' },
] as const;

export async function loadLanguageResources(code: string) {
  const response = await fetch(`/locales/${code}/translation.json`);

  if (!response.ok) {
    throw new Error(`Unable to load language: ${code}`);
  }

  const translations = (await response.json()) as Record<string, unknown>;
  i18n.addResourceBundle(code, 'translation', translations, true, true);
}