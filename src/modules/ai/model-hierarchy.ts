const DEFAULT_GEMINI_MODEL_HIERARCHY = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

function dedupeModels(models: string[]) {
  return models.filter((model, index) => model.length > 0 && models.indexOf(model) === index);
}

export function getGeminiModelHierarchy() {
  const preferredModel = import.meta.env.VITE_GEMINI_MODEL?.trim() ?? '';
  const configuredModels = (import.meta.env.VITE_GEMINI_MODEL_HIERARCHY?.split(',') ?? [])
    .map((model: string) => model.trim())
    .filter(Boolean);

  return dedupeModels([
    preferredModel,
    ...configuredModels,
    ...DEFAULT_GEMINI_MODEL_HIERARCHY,
  ]);
}

export function shouldRetryGeminiModel(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'gemini-empty-response' || message === 'invalid-json-response') {
    return true;
  }

  if (!message.startsWith('gemini-request-failed:')) {
    return false;
  }

  const status = Number(message.split(':')[1] ?? '0');
  if (Number.isNaN(status)) {
    return false;
  }

  return status === 404 || status === 408 || status === 409 || status === 429 || status >= 500;
}