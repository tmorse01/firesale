import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string | null;
  hint?: string;
  htmlFor?: string;
  label: string;
  required?: boolean;
};

export function FormField({ children, error, hint, htmlFor, label, required }: FormFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-field-label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ui-required-indicator">Required</span> : null}
      </label>
      <div data-invalid={error ? "true" : undefined}>{children}</div>
      {hint ? <span className="ui-field-message">{hint}</span> : null}
      {error ? <span className="ui-field-error">{error}</span> : null}
    </div>
  );
}
