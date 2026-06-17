import type { ApplicationStatus, SupportDirection } from '../../shared/types';

export function formatAmount(n: number): string {
  if (n >= 10000) {
    const yi = n / 10000;
    return `${yi.toFixed(2)}亿元`;
  }
  return `${n}万`;
}

export function formatDate(date?: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(d?: string | Date): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function directionLabel(d: SupportDirection): string {
  switch (d) {
    case 'testing_capability':
      return '检测能力提升';
    case 'tech_breakthrough':
      return '核心技术攻关';
    case 'production_expansion':
      return '产线扩建';
  }
}

export function statusLabel(s: ApplicationStatus): string {
  switch (s) {
    case 'pending_preliminary':
      return '待初审';
    case 'in_review':
      return '评审中';
    case 'queued':
      return '队列排队';
    case 'approved':
      return '已立项';
    case 'in_disbursement':
      return '拨付中';
    case 'completed':
      return '已结题';
    case 'rejected':
      return '已驳回';
  }
}

export function statusColor(s: ApplicationStatus): string {
  switch (s) {
    case 'pending_preliminary':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'in_review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'queued':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_disbursement':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'completed':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}
