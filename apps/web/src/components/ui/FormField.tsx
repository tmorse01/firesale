import { Field } from "@base-ui/react/field";
import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string | null;
  hint?: string;
  htmlFor?: string;
  label: string;
  nativeLabel?: boolean;
  required?: boolean;
};

export function FormField({ children, error, hint, label, nativeLabel = true, required }: FormFieldProps) {
  return (
    <Field.Root className="ui-field" invalid={Boolean(error) || undefined}>
      <Field.Label className="ui-field-label" nativeLabel={nativeLabel}>
        {label}
        {required ? <span className="ui-required-indicator">Required</span> : null}
      </Field.Label>
      {children}
      {hint ? <Field.Description className="ui-field-message">{hint}</Field.Description> : null}
      {error ? (
        <Field.Error className="ui-field-error" match>
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
