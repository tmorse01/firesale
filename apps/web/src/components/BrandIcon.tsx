import { brandIconName } from "../lib/brand";
import { Icon } from "./ui/Icon";

type BrandIconProps = {
  className?: string;
};

export function BrandIcon({ className }: BrandIconProps) {
  return <Icon className={className} filled name={brandIconName} />;
}
