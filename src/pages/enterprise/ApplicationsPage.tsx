import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Files,
  ChevronRight,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import { useAppStore } from "../../store";
import StatusBadge from "../../components/StatusBadge";
import DirectionIcon from "../../components/DirectionIcon";
import {
  formatAmount,
  formatDate,
  directionLabel,
  statusLabel,
} from "../../utils/format";
import type {
  Application,
  ApplicationStatus,
  SupportDirection,
} from "../../../shared/types";

interface TabItem {
  key: "all" | ApplicationStatus;
  label: string;
}

const STATUS_TABS: TabItem[] = [
  { key: "all", label: "全部" },
  { key: "pending_preliminary", label: "待初审" },
  { key: "in_review", label: "评审中" },
  { key: "approved", label: "已立项" },
  { key: "in_disbursement", label: "拨付中" },
  { key: "completed", label: "已结题" },
  { key: "rejected", label: "已驳回" },
];

const DIRECTION_OPTIONS: { key: "all" | SupportDirection; label: string }[] = [
  { key: "all", label: "全部方向" },
  { key: "testing_capability", label: "检测能力提升" },
  { key: "tech_breakthrough", label: "核心技术攻关" },
  { key: "production_expansion", label: "产线扩建" },
];

export default function ApplicationsPage() {
  const applicationsCache = useAppStore((state) => state.applicationsCache);
  const setApplications = useAppStore((state) => state.setApplications);
  const [activeTab, setActiveTab] = useState<"all" | ApplicationStatus>("all");
  const [selectedDirection, setSelectedDirection] = useState<
    "all" | SupportDirection
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/applications")
      .then((r) => r.json())
      .then((res) => {
        if (res.code === 0 && res.data) {
          setApplications(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setApplications]);

  const filteredApps = useMemo(() => {
    let apps = Object.values(applicationsCache);
    if (activeTab !== "all") {
      apps = apps.filter((a) => a.status === activeTab);
    }
    if (selectedDirection !== "all") {
      apps = apps.filter((a) => a.direction === selectedDirection);
    }
    return apps.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [applicationsCache, activeTab, selectedDirection]);

  const tabCounts = useMemo(() => {
    const apps = Object.values(applicationsCache);
    const counts: Record<string, number> = { all: apps.length };
    apps.forEach((a) => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });
    return counts;
  }, [applicationsCache]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">申报列表</h1>
        <p className="text-slate-500 mt-1">查看和管理所有的基金申报记录。</p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto -mx-4 md:-mx-5 px-4 md:px-5 lg:mx-0 lg:px-0 pb-2 lg:pb-0 min-w-0">
              {STATUS_TABS.map((tab) => {
                const count = tabCounts[tab.key] ?? 0;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? "bg-navy-600 text-white shadow-lg shadow-navy-600/20"
                        : count > 0
                          ? "text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                          : "text-slate-400 hover:text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value as any)}
                  className="input appearance-none pr-9 pl-4 py-2 min-w-[160px] text-sm cursor-pointer bg-white"
                >
                  {DIRECTION_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
              <Link
                to="/enterprise/apply"
                className="btn-teal whitespace-nowrap"
              >
                <Plus size={16} />
                新建申报
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              加载中...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-16 md:py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-5">
                <Files size={36} className="text-slate-300" />
              </div>
              <div className="text-lg font-semibold text-navy-800 mb-2">
                暂无符合条件的申报
              </div>
              <div className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                {activeTab !== "all" || selectedDirection !== "all"
                  ? "请尝试调整筛选条件，或者发起一笔新的申报"
                  : "您还没有申报记录，现在就去创建第一笔产业基金申请吧"}
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {(activeTab !== "all" || selectedDirection !== "all") && (
                  <button
                    onClick={() => {
                      setActiveTab("all");
                      setSelectedDirection("all");
                    }}
                    className="btn-outline"
                  >
                    <SlidersHorizontal size={14} />
                    清除筛选
                  </button>
                )}
                <Link to="/enterprise/apply" className="btn-primary">
                  <Plus size={16} />
                  新建申报
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app: Application) => (
                <Link
                  key={app.id}
                  to={`/enterprise/applications/${app.id}`}
                  className="card-hover block p-5 md:p-6 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-50 to-teal-50 flex items-center justify-center flex-shrink-0 border border-navy-100/50">
                        <DirectionIcon
                          direction={app.direction}
                          size={24}
                          className="text-navy-600"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-1.5">
                          <h3 className="font-bold text-navy-800 text-base md:text-lg truncate min-w-0">
                            {directionLabel(app.direction)}
                          </h3>
                          <StatusBadge status={app.status} />
                          {app.status === "queued" &&
                            app.approval?.queuePosition && (
                              <span className="chip bg-violet-50 text-violet-700 border border-violet-200">
                                队列第 {app.approval.queuePosition} 位
                              </span>
                            )}
                        </div>
                        <div className="text-sm text-slate-500 truncate mb-3 md:mb-0">
                          申报编号：
                          <span className="font-mono text-slate-600">
                            {app.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 lg:gap-10 flex-wrap md:flex-nowrap lg:flex-shrink-0">
                      <div className="flex flex-col">
                        <div className="text-xs text-slate-400 mb-1">
                          申请金额
                        </div>
                        <div className="font-bold text-navy-800 text-lg">
                          {formatAmount(app.requestedAmount / 10000)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-slate-400 mb-1">
                          核定金额
                        </div>
                        <div
                          className={`font-bold text-lg ${app.approvedAmount ? "text-teal-700" : "text-slate-300"}`}
                        >
                          {app.approvedAmount
                            ? formatAmount(app.approvedAmount / 10000)
                            : "—"}
                        </div>
                      </div>
                      <div className="flex flex-col hidden sm:flex">
                        <div className="text-xs text-slate-400 mb-1">
                          提交日期
                        </div>
                        <div className="font-semibold text-slate-700 text-sm">
                          {formatDate(app.submittedAt)}
                        </div>
                      </div>
                      <div className="flex items-center h-full pl-2 lg:pl-4 lg:ml-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0">
                        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 group-hover:text-navy-700 group-hover:gap-2.5 transition-all">
                          <span>查看详情</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
