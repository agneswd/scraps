import { useTranslation } from 'react-i18next';
import { usePreferences, type AiModelPreference } from '@/app/providers/PreferencesProvider';
import { Sparkles } from 'lucide-react';

const MODELS: { id: AiModelPreference; label: string; desc: string }[] = [
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Preview)', desc: 'Next-gen fast model preview' },
  { id: 'gemini-3.0-flash', label: 'Gemini 3.0 Flash', desc: 'Powerful new generation model' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Balanced speed and quality' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: 'Fastest model for quick tasks' },
];

export function AiModelPicker() {
  const { t } = useTranslation();
  const { aiModel, setAiModel } = usePreferences();

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {MODELS.map((model) => {
        const isActive = aiModel === model.id;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => setAiModel(model.id)}
            className={[
              'flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm transition-all',
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-white/15 dark:bg-slate-900/15' : 'bg-slate-200/50 dark:bg-slate-700'].join(' ')}>
                <Sparkles className={['h-4 w-4', isActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'].join(' ')} strokeWidth={2} />
              </div>
              <div>
                <span className="block font-medium">{model.label}</span>
                <span className={['block text-xs mt-0.5', isActive ? 'text-white/60 dark:text-slate-900/50' : 'text-slate-400 dark:text-slate-500'].join(' ')}>
                  {model.desc}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
