import type { RuntimeStep } from '@/lib/runtimeTrace';
import { PhaseBadge } from '@/components/PhaseBadge';

type StepTimelineProps = {
  steps: RuntimeStep[];
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
};

export function StepTimeline({
  steps,
  currentStepIndex,
  onSelectStep,
}: StepTimelineProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Execution timeline
      </h2>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;

          return (
            <button
              key={`${step.line}-${step.title}`}
              onClick={() => onSelectStep(index)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                isCurrent
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {index + 1}. {step.title}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <PhaseBadge phase={step.phase} />
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    Line {step.line}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
