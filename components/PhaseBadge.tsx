import type { RuntimePhase } from '@/lib/runtimeTrace';

const phaseLabels: Record<RuntimePhase, string> = {
  sync: 'Sync',
  'web-api': 'Web API',
  microtask: 'Microtask',
  macrotask: 'Macrotask',
};

const phaseStyles: Record<RuntimePhase, string> = {
  sync: 'border-blue-400/40 bg-blue-500/10 text-blue-200',
  'web-api': 'border-purple-400/40 bg-purple-500/10 text-purple-200',
  microtask: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  macrotask: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
};

type PhaseBadgeProps = {
  phase: RuntimePhase;
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${phaseStyles[phase]}`}
    >
      {phaseLabels[phase]}
    </span>
  );
}
