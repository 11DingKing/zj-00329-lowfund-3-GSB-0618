import type { ApplicationStatus } from '../../shared/types';
import { statusLabel, statusColor } from '../utils/format';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`chip border ${statusColor(status)} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}
