import { useId, type ReactNode } from "react";
export function Field({
  label,
  value,
  onChange,
  max = 140,
  multi = false,
  type = "text",
  hint,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  multi?: boolean;
  type?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = useId(),
    props = {
      id,
      "aria-label": label,
      "aria-describedby": hint ? id + "-hint" : undefined,
      value,
      maxLength: max,
      required,
      placeholder,
      autoComplete: "off",
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => onChange(e.target.value),
    };
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multi ? (
        <textarea {...props} rows={max >= 1400 ? 4 : 2} />
      ) : (
        <input type={type} {...props} />
      )}{" "}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
export function StudioHeading({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="cms-heading">
      <div>
        <span className="cms-kicker mono">{kicker}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
