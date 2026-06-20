import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

export function FilterPill({ label, value, onClear }: { label: string; value: string; onClear?: () => void }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-brand-blue/30 bg-brand-blue/5 px-2 py-0.5 text-xs text-brand-deep')}>
      <span className="font-medium">{label}:</span> {value}
      {onClear && (
        <button onClick={onClear} className="ml-0.5 hover:text-brand-alert" aria-label="Limpiar">
          <X size={12} />
        </button>
      )}
    </span>
  );
}
