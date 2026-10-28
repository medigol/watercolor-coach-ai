import type { ChecklistControlProps } from "./ChecklistControl";
import { colors } from "../theme";
export default function ChecklistControl({
  label,
  checked,
  onToggle,
}: ChecklistControlProps) {
  return (
    <label
      style={{
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
        minHeight: 48,
        padding: 13,
        borderRadius: 10,
        border: `1px solid ${checked ? colors.accent : colors.border}`,
        background: checked ? colors.pale : colors.paper,
        display: "flex",
        gap: 12,
        alignItems: "center",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          accentColor: colors.accent,
        }}
      />
      <span
        style={{ flex: 1, fontSize: 16, lineHeight: "26px", color: colors.ink }}
      >
        {label}
      </span>
    </label>
  );
}
