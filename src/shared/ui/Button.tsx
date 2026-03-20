import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-500',
  secondary:
    'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900',
};

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variantClassNames[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
