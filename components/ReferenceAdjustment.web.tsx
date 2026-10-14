import { colors } from "./theme";
import type { ReferenceAdjustmentProps } from "./ReferenceAdjustment";

export default function ReferenceAdjustment({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: ReferenceAdjustmentProps) {
  return (
    <input
      type="range"
      aria-label={label}
      aria-valuetext={`${value}%`}
      min={min}
      max={max}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      style={{
        width: "100%",
        height: 44,
        margin: 0,
        accentColor: colors.accent,
      }}
    />
  );
}
