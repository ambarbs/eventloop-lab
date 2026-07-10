import { PhaseBadge } from '@/components/PhaseBadge';
import type { RuntimeStep } from '@/lib/runtimeTrace';

type StepDetailProps = {
  step: RuntimeStep;
  stepNumber: number;
  totalSteps: number;
};

export function StepDetail({ step, stepNumber, totalSteps }: StepDetailProps) {
  return (
    <section className="border-t border-slate-800 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Step {stepNumber} of {totalSteps}
        </p>

        <PhaseBadge phase={step.phase} />
      </div>

      <h2 className="mt-2 text-xl font-semibold text-slate-100">
        {step.title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {step.explanation}
      </p>

      {step.events && step.events.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Runtime events
          </h3>

          <ol className="mt-2 space-y-1 text-sm text-slate-300">
            {step.events.map((event, index) => (
              <li key={`${event}-${index}`} className="flex gap-2">
                <span className="text-slate-600">{index + 1}.</span>
                <span>{event}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
