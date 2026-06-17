import type {
  Application,
  ApplicationStatus,
  FundPool,
  SupportDirection,
  Transaction,
} from "../../shared/types/index.js";
import {
  FUND_POOL_TOTAL,
  mockApplications,
  mockTransactions,
} from "./mockData.js";

const applicationsMap = new Map<string, Application>();
const transactionsMap = new Map<string, Transaction>();
let initialized = false;

const genId = () => Math.random().toString(36).slice(2, 10);

export function initStore(): void {
  if (initialized) return;
  mockApplications.forEach((app) => applicationsMap.set(app.id, app));
  mockTransactions.forEach((tx) => transactionsMap.set(tx.id, tx));
  initialized = true;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  direction?: SupportDirection;
}

export function getApplications(filters?: ApplicationFilters): Application[] {
  initStore();
  let apps = Array.from(applicationsMap.values());
  if (filters?.status) {
    apps = apps.filter((a) => a.status === filters.status);
  }
  if (filters?.direction) {
    apps = apps.filter((a) => a.direction === filters.direction);
  }
  return apps.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function getApplicationById(id: string): Application | undefined {
  initStore();
  return applicationsMap.get(id);
}

export function addApplication(
  app: Omit<Application, "id" | "status" | "submittedAt" | "milestones">,
): Application {
  initStore();
  const newApp: Application = {
    ...app,
    id: genId(),
    status: "pending_preliminary",
    submittedAt: new Date().toISOString(),
    milestones: [],
  };
  applicationsMap.set(newApp.id, newApp);
  return newApp;
}

export function updateApplication(
  id: string,
  patch: Partial<Application>,
): Application {
  initStore();
  const app = applicationsMap.get(id);
  if (!app) {
    throw new Error(`Application ${id} not found`);
  }
  const updated = { ...app, ...patch };
  applicationsMap.set(id, updated);
  return updated;
}

export function addTransaction(
  tx: Omit<Transaction, "id" | "createdAt"> & { createdAt?: string },
): Transaction {
  initStore();
  const newTx: Transaction = {
    ...tx,
    id: genId(),
    createdAt: tx.createdAt ?? new Date().toISOString(),
  };
  transactionsMap.set(newTx.id, newTx);
  return newTx;
}

export function getTransactions(): Transaction[] {
  initStore();
  return Array.from(transactionsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  "approved",
  "in_disbursement",
  "completed",
  "queued",
];

export function computeFundPool(): FundPool {
  initStore();
  const apps = Array.from(applicationsMap.values());

  let approvedTotal = 0;
  let disbursedTotal = 0;
  let queuedTotal = 0;

  const byDirection: Record<
    SupportDirection,
    { approved: number; disbursed: number; count: number }
  > = {
    testing_capability: { approved: 0, disbursed: 0, count: 0 },
    tech_breakthrough: { approved: 0, disbursed: 0, count: 0 },
    production_expansion: { approved: 0, disbursed: 0, count: 0 },
  };

  for (const app of apps) {
    if (ACTIVE_STATUSES.includes(app.status) && app.approvedAmount) {
      approvedTotal += app.approvedAmount;
      byDirection[app.direction].approved += app.approvedAmount;
      byDirection[app.direction].count += 1;

      if (app.status === "queued") {
        queuedTotal += app.approvedAmount;
      }

      for (const ms of app.milestones) {
        if (ms.status === "paid") {
          disbursedTotal += ms.amount;
          byDirection[app.direction].disbursed += ms.amount;
        }
      }
    }
  }

  return {
    total: FUND_POOL_TOTAL,
    approvedTotal,
    disbursedTotal,
    remaining: FUND_POOL_TOTAL - approvedTotal,
    queuedTotal,
    byDirection,
  };
}

export function getAvailableAmount(): number {
  const pool = computeFundPool();
  return pool.total - (pool.approvedTotal - pool.queuedTotal);
}

export function processQueue(): Application[] {
  initStore();
  const releasedApps: Application[] = [];
  const queuedApps = getApplications({ status: "queued" }).sort(
    (a, b) =>
      (a.approval?.queuePosition || 999) - (b.approval?.queuePosition || 999),
  );

  for (const app of queuedApps) {
    const available = getAvailableAmount();
    const approvedAmount = app.approvedAmount || 0;

    if (approvedAmount <= available && approvedAmount > 0) {
      const percentages = [30, 40, 30];
      const names = [
        "项目启动与方案设计",
        "核心研发与样机试制",
        "验收交付与成果转化",
      ];
      const milestones = percentages.map((p, i) => ({
        id: genId(),
        name: names[i],
        percentage: p,
        amount: Math.round((approvedAmount * p) / 100),
        status: "pending" as const,
      }));

      const updated = updateApplication(app.id, {
        status: "approved",
        milestones,
        approval: {
          ...app.approval!,
          queuePosition: undefined,
        },
      });

      const remainingQueued = getApplications({ status: "queued" }).sort(
        (a, b) =>
          (a.approval?.queuePosition || 999) -
          (b.approval?.queuePosition || 999),
      );
      remainingQueued.forEach((qApp, idx) => {
        if (qApp.approval) {
          updateApplication(qApp.id, {
            approval: {
              ...qApp.approval,
              queuePosition: idx + 1,
            },
          });
        }
      });

      addTransaction({
        type: "queue_release",
        amount: approvedAmount,
        applicationId: app.id,
        companyName: app.companyName,
        direction: app.direction,
        remark: `排队释放 - ${app.companyName} 额度已激活`,
      });

      releasedApps.push(updated);
    } else {
      break;
    }
  }

  return releasedApps;
}

export function recomputeQueuePositions(): void {
  initStore();
  const queuedApps = getApplications({ status: "queued" }).sort(
    (a, b) =>
      (a.approval?.queuePosition || 999) - (b.approval?.queuePosition || 999),
  );
  queuedApps.forEach((app, idx) => {
    if (app.approval) {
      updateApplication(app.id, {
        approval: {
          ...app.approval,
          queuePosition: idx + 1,
        },
      });
    }
  });
}
