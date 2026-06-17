import { create } from "zustand";
import type { Application, FundPool } from "../../shared/types";

type Role = "enterprise" | "reviewer" | null;

interface EnterpriseUser {
  companyName: string;
  contactPerson: string;
}

interface ReviewerUser {
  name: string;
}

type User = EnterpriseUser | ReviewerUser;

interface AppState {
  role: Role;
  user: User | null;
  fundPool: FundPool | null;
  applicationsCache: Record<string, Application>;

  setRole: (role: Role) => void;
  logout: () => void;
  setFundPool: (pool: FundPool | null) => void;
  loadFundPool: () => Promise<void>;
  setApplications: (apps: Application[]) => void;
  getApplications: () => Application[];
}

const defaultEnterpriseUser: EnterpriseUser = {
  companyName: "天航智造（深圳）有限公司",
  contactPerson: "李明",
};

const defaultReviewerUser: ReviewerUser = {
  name: "评审管理员-王芳",
};

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  user: null,
  fundPool: null,
  applicationsCache: {},

  setRole: (role) => {
    if (role === "enterprise") {
      set({ role, user: defaultEnterpriseUser });
    } else if (role === "reviewer") {
      set({ role, user: defaultReviewerUser });
    } else {
      set({ role: null, user: null });
    }
  },

  logout: () => {
    set({ role: null, user: null, fundPool: null, applicationsCache: {} });
  },

  setFundPool: (pool) => set({ fundPool: pool }),

  loadFundPool: async () => {
    try {
      const res = await fetch("/api/fund-pool");
      if (res.ok) {
        const json = await res.json();
        if (json.code === 0 && json.data) {
          set({ fundPool: json.data });
        }
      }
    } catch {
      // noop
    }
  },

  setApplications: (apps) => {
    const cache: Record<string, Application> = {};
    apps.forEach((app) => {
      cache[app.id] = app;
    });
    set({ applicationsCache: cache });
  },

  getApplications: () => {
    return Object.values(get().applicationsCache);
  },
}));
