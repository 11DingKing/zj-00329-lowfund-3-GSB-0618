export type ApplicationStatus =
  | "pending_preliminary"
  | "in_review"
  | "queued"
  | "approved"
  | "in_disbursement"
  | "completed"
  | "rejected";

export type SupportDirection =
  | "testing_capability"
  | "tech_breakthrough"
  | "production_expansion";

export type MilestoneStatus =
  | "pending"
  | "requested"
  | "approved"
  | "paid"
  | "rejected";

export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  status: MilestoneStatus;
  requestDate?: string;
  requestRemark?: string;
  reviewDate?: string;
  reviewer?: string;
  reviewComment?: string;
  approveDate?: string;
  approver?: string;
  approveComment?: string;
  paidDate?: string;
  paidAmount?: number;
  rejectDate?: string;
  rejector?: string;
  rejectReason?: string;
  remark?: string;
}

export interface Application {
  id: string;
  companyName: string;
  unifiedCreditCode: string;
  contactPerson: string;
  contactPhone: string;
  direction: SupportDirection;
  requestedAmount: number;
  approvedAmount?: number;
  purposeDescription: string;
  attachments: { name: string; url: string; size: number }[];
  status: ApplicationStatus;
  submittedAt: string;
  preliminaryReview?: {
    reviewer: string;
    qualificationScore: number;
    complianceScore: number;
    totalScore: number;
    recommendedAmount?: number;
    pass: boolean;
    comment: string;
    reviewedAt: string;
  };
  expertReview?: {
    reviewer: string;
    technicalScore: number;
    feasibilityScore: number;
    economicScore: number;
    totalScore: number;
    recommendedAmount?: number;
    pass: boolean;
    comment: string;
    reviewedAt: string;
  };
  approval?: {
    approver: string;
    queuePosition?: number;
    approvedAmount: number;
    pass: boolean;
    comment: string;
    approvedAt: string;
  };
  rejection?: { reason: string; rejectedAt: string; rejectedBy: string };
  milestones: Milestone[];
}

export interface FundPool {
  total: number;
  approvedTotal: number;
  disbursedTotal: number;
  remaining: number;
  queuedTotal: number;
  byDirection: Record<
    SupportDirection,
    { approved: number; disbursed: number; count: number }
  >;
}

export interface Transaction {
  id: string;
  type: "approve_reserve" | "disbursement" | "queue_release";
  amount: number;
  applicationId?: string;
  companyName?: string;
  direction?: SupportDirection;
  remark: string;
  createdAt: string;
}
