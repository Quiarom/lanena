import { cn } from '@/lib/cn';
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            value === t.id ? 'border-brand-blue text-brand-deep' : 'border-transparent text-slate-500 hover:text-brand-deep',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
