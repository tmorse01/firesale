import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, ...props },
  ref
) {
  return <textarea {...props} ref={ref} className={["ui-input", "ui-textarea", className].filter(Boolean).join(" ")} />;
});
