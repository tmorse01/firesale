import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, ...props },
  ref
) {
  return <input {...props} ref={ref} className={["ui-input", className].filter(Boolean).join(" ")} />;
});
