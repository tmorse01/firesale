import type { DealStatus } from "@firesale/shared";
import { Icon } from "./ui/Icon";

const statusMeta: Record<DealStatus, { icon: string; label: string }> = {
  active: { icon: "check_circle", label: "Active" },
  expiringSoon: { icon: "schedule", label: "Expiring Soon" },
  lowConfidence: { icon: "error", label: "Low Confidence" },
  expired: { icon: "block", label: "Expired" }
};

export function StatusBadge({ status }: { status: DealStatus }) {
  const meta = statusMeta[status];

  return (
    <span className={`status-badge status-${status}`}>
      <Icon name={meta.icon} />
      {meta.label}
    </span>
  );
}
