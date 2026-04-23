import { Field } from "@base-ui/react/field";
import { forwardRef } from "react";
import type { Ref, TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, rows = 5, ...props },
  ref
) {
  return (
    <Field.Control
      {...(props as unknown as Field.Control.Props)}
      ref={ref as Ref<HTMLElement>}
      className={["ui-input", "ui-textarea", className].filter(Boolean).join(" ")}
      render={<textarea rows={rows} />}
    />
  );
});
