import { useId, type ReactNode } from "react";

export function Range({
  label,
  value,
  onChange,
  unit = "%",
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="o-range">
      <label htmlFor={id}>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </label>
      <input id={id} type="range" min="0" max={max} value={value} onChange={(event) => onChange(+event.target.value)} />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="o-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="o-switch" aria-hidden="true" />
    </label>
  );
}

export function Result({
  title,
  children,
  status = "EXAMPLE OUTPUT",
}: {
  title: string;
  children: ReactNode;
  status?: string;
}) {
  return (
    <div className="o-result" role="status">
      <span className="o-micro">{status}</span>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}
