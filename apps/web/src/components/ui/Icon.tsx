type IconProps = {
  className?: string;
  filled?: boolean;
  name: string;
};

export function Icon({ className, filled = false, name }: IconProps) {
  const classes = ["icon-symbol", filled ? "is-filled" : "", className].filter(Boolean).join(" ");

  return (
    <span aria-hidden="true" className={classes}>
      {name}
    </span>
  );
}
