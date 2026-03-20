import { Plus } from 'lucide-react';

type FabProps = {
  label: string;
  onClick: () => void;
};

export function Fab({ label, onClick }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <Plus className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}