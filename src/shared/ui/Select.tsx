import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string = string> = {
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
};

export function Select<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  className = '',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

  const selected = options.find((o) => o.value === value);

  function updateDropdownPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }

  function openDropdown() {
    updateDropdownPosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleViewportChange() {
      updateDropdownPosition();
    }

    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open]);

  const body = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : openDropdown}
        aria-expanded={open}
        className={[
          'flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm transition-all ease-spring outline-none',
          'focus:border-slate-400 focus:ring-4 focus:ring-slate-100',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800',
          open ? 'border-slate-400 ring-4 ring-slate-100 dark:border-slate-500 dark:ring-slate-800' : '',
          className,
        ].join(' ')}
      >
        <span className={selected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={['h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
          strokeWidth={2}
        />
      </button>

      {body
        ? createPortal(
            open ? (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
                style={dropdownStyle}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900"
              >
                <ul className="max-h-64 overflow-y-auto py-1">
                  {options.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            onChange(opt.value as T);
                            setOpen(false);
                          }}
                          className={[
                            'flex w-full items-center justify-between px-4 py-3 text-sm transition-colors',
                            isSelected
                              ? 'bg-slate-50 font-medium text-slate-900 dark:bg-slate-800 dark:text-white'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                          ].join(' ')}
                        >
                          {opt.label}
                          {isSelected ? (
                            <Check className="h-4 w-4 text-slate-900 dark:text-white" strokeWidth={2.5} />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ) : null,
            body,
          )
        : null}
    </>
  );
}
