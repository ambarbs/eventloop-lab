type TraceControlsProps = {
  isPlaying: boolean;
  disabled: boolean;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onReset: () => void;
};

export function TraceControls({
  isPlaying,
  disabled,
  onPrevious,
  onPlayPause,
  onNext,
  onReset,
}: TraceControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        onClick={onPrevious}
        disabled={disabled}
        className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <button
        onClick={onPlayPause}
        disabled={disabled}
        className="rounded-lg cursor-pointer bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button
        onClick={onNext}
        disabled={disabled}
        className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>

      <button
        onClick={onReset}
        disabled={disabled}
        className="rounded-lg cursor-pointer bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reset
      </button>
    </div>
  );
}
