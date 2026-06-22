/** +/- numeric stepper. Disables at bounds; delegates the value to the caller. */
export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;
  return (
    <span className="stepper">
      <button
        type="button"
        className="stepper-btn"
        disabled={atMin}
        aria-label="decrement"
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        className="stepper-btn"
        disabled={atMax}
        aria-label="increment"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </span>
  );
}
