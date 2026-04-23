import { Input } from "@base-ui/react/input";
import { forwardRef } from "react";
import type { InputHTMLAttributes, Ref } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, ...props },
  ref
) {
  return <Input {...props} ref={ref as Ref<HTMLElement>} className={["ui-input", className].filter(Boolean).join(" ")} />;
});
