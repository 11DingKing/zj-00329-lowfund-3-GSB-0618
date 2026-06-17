import type { Application, ApplicationStatus } from '../../shared/types';
import {
  FileText,
  ClipboardCheck,
  Users,
  CheckCircle2,
  Wallet,
  Trophy,
  XCircle,
} from 'lucide-react';
import { formatDateTime } from '../utils/format';

interface TimelineProps {
  application: Application;
}

interface TimelineNode {
  key: string;
  title: string;
  icon: typeof FileText;
  date?: string;
  completed: boolean;
  current: boolean;
  color: string;
}

function getStatusIndex(status: ApplicationStatus): number {
  switch (status) {
    case 'pending_preliminary':
      return 0;
    case 'in_review':
      return 1;
    case 'queued':
      return 2;
    case 'approved':
      return 3;
    case 'in_disbursement':
      return 4;
    case 'completed':
      return 5;
    case 'rejected':
      return -1;
  }
}

function getLastDisbursementDate(app: Application): string | undefined {
  if (!app.milestones || app.milestones.length === 0) return undefined;
  const paidMilestones = app.milestones.filter((m) => m.paidDate);
  if (paidMilestones.length === 0) return undefined;
  return paidMilestones[paidMilestones.length - 1].paidDate;
}

function getCompletedAt(app: Application): string | undefined {
  if (app.status !== 'completed') return undefined;
  return getLastDisbursementDate(app);
}

export default function Timeline({ application }: TimelineProps) {
  const isRejected = application.status === 'rejected';
  const statusIdx = getStatusIndex(application.status);

  const hasPreliminary = !!application.preliminaryReview?.reviewedAt;
  const hasExpert = !!application.expertReview?.reviewedAt;
  const hasApproval = !!application.approval?.approvedAt;
  const hasDisbursement = (application.milestones?.filter((m) => m.paidDate).length ?? 0) > 0;

  const nodesBase: TimelineNode[] = [
    {
      key: 'submit',
      title: '提交申报',
      icon: FileText,
      date: application.submittedAt,
      completed: true,
      current: statusIdx === 0,
      color: 'text-navy-600',
    },
    {
      key: 'preliminary',
      title: '初审',
      icon: ClipboardCheck,
      date: application.preliminaryReview?.reviewedAt,
      completed: hasPreliminary || statusIdx > 0,
      current: statusIdx === 0,
      color: 'text-amber-600',
    },
    {
      key: 'expert',
      title: '专家评审',
      icon: Users,
      date: application.expertReview?.reviewedAt,
      completed: hasExpert || statusIdx > 1,
      current: statusIdx === 1,
      color: 'text-blue-600',
    },
    {
      key: 'approval',
      title: '立项',
      icon: CheckCircle2,
      date: application.approval?.approvedAt,
      completed: hasApproval || statusIdx > 2,
      current: statusIdx === 2 || statusIdx === 3,
      color: 'text-emerald-600',
    },
    {
      key: 'milestone',
      title: '里程碑拨付',
      icon: Wallet,
      date: getLastDisbursementDate(application),
      completed: hasDisbursement || statusIdx > 3,
      current: statusIdx === 4,
      color: 'text-teal-600',
    },
    {
      key: 'complete',
      title: '结题',
      icon: Trophy,
      date: getCompletedAt(application),
      completed: application.status === 'completed',
      current: false,
      color: 'text-slate-600',
    },
  ];

  let nodes = nodesBase;
  if (isRejected) {
    nodes = [
      ...nodesBase.slice(0, Math.max(1, statusIdx + 2)).filter((n) => n.completed || n.current),
      {
        key: 'reject',
        title: '已驳回',
        icon: XCircle,
        date: application.rejection?.rejectedAt,
        completed: true,
        current: false,
        color: 'text-rose-600',
      },
    ];
  }

  const visibleNodes = nodes.filter((n, i) => {
    if (isRejected) return true;
    return n.completed || n.current || i <= Math.max(statusIdx + 1, 1);
  });

  return (
    <div className="py-2">
      {visibleNodes.map((node, index) => {
        const isLast = index === visibleNodes.length - 1;
        const Icon = node.icon;
        return (
          <div key={node.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  node.current
                    ? 'bg-white border-teal-500 ring-4 ring-teal-500/20 shadow-lg shadow-teal-500/20'
                    : node.completed
                    ? 'bg-navy-600 border-navy-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                {node.completed && !node.current ? (
                  <CheckCircle2 size={18} className="text-white" />
                ) : (
                  <Icon
                    size={18}
                    className={
                      node.current ? 'text-teal-600' : node.completed ? 'text-white' : 'text-slate-400'
                    }
                  />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-10 ${
                    node.completed ? 'bg-navy-200' : 'bg-slate-100'
                  }`}
                />
              )}
            </div>
            <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={`font-semibold text-base ${
                      node.current
                        ? 'text-teal-700'
                        : node.completed
                        ? 'text-navy-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {node.title}
                  </div>
                  {node.current && (
                    <div className="text-xs text-teal-600 mt-0.5 font-medium">进行中</div>
                  )}
                </div>
                {node.date && (
                  <div className="text-xs text-slate-400 font-mono">
                    {formatDateTime(node.date)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
