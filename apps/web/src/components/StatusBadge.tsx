import type { DealStatus } from "@firesale/shared";

const statusCopy: Record<DealStatus, string> = {
  active: "Active",
  expiringSoon: "Expiring Soon",
  lowConfidence: "Low Confidence",
  expired: "Expired"
};

export function StatusBadge({ status }: { status: DealStatus }) {
  return <span className={`status-badge status-${status}`}>{statusCopy[status]}</span>;
}
