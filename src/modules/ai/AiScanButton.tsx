import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AiScanButtonProps = {
  label?: string;
  isLoading?: boolean;
  onClick: () => void;
};

export function AiScanButton({ label, isLoading = false, onClick }: AiScanButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-all duration-300 ease-spring hover:bg-slate-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
    >
      <Sparkles className={['h-4 w-4', isLoading ? 'animate-pulse' : ''].join(' ')} strokeWidth={2.2} />
      {label ?? t('ai.scanButton')}
    </button>
  );
}
