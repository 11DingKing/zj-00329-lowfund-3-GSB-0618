import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Users,
  FileCheck,
  Wallet,
  ArrowRight,
  SearchCheck,
  PiggyBank,
  Receipt,
  Eye,
} from "lucide-react";
import type { Application, FundPool } from "../../../shared/types";
import { useAppStore } from "../../store";
import { formatAmount, formatDate, directionLabel } from "../../utils/format";
import { useToast } from "../../components/Toast";
import FundProgress from "../../components/FundProgress";
import StatusBadge from "../../components/StatusBadge";
import DirectionIcon from "../../components/DirectionIcon";

interface Stats {
  pendingPreliminary: number;
  inReview: number;
  pendingApproval: number;
  pendingDisbursement: number;
}

export default function ReviewerHome() {
  const navigate = useNavigate();
  const { user, fundPool, loadFundPool, setFundPool } = useAppStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pendingPreliminary: 0,
    inReview: 0,
    pendingApproval: 0,
    pendingDisbursement: 0,
  });
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [poolData, setPoolData] = useState<FundPool | null>(fundPool);

  const reviewerName = user && "name" in user ? user.name : "评审管理员";
  const today = formatDate(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!fundPool) {
          await loadFundPool();
        }

        const [appsRes, poolRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/fund-pool"),
        ]);

        if (appsRes.ok) {
          const appsJson = await appsRes.json();
          const apps: Application[] = appsJson.data || [];

          let pendingDisb = 0;
          apps.forEach((app) => {
            if (app.milestones) {
              pendingDisb += app.milestones.filter(
                (m) => m.status === "requested",
              ).length;
            }
          });

          setStats({
            pendingPreliminary: apps.filter(
              (a) => a.status === "pending_preliminary",
            ).length,
            inReview: apps.filter((a) => a.status === "in_review").length,
            pendingApproval: apps.filter(
              (a) => a.status === "in_review" && a.expertReview,
            ).length,
            pendingDisbursement: pendingDisb,
          });

          const sorted = [...apps]
            .sort(
              (a, b) =>
                new Date(b.submittedAt).getTime() -
                new Date(a.submittedAt).getTime(),
            )
            .map((app) => ({
              ...app,
              requestedAmount: app.requestedAmount / 10000,
              approvedAmount: app.approvedAmount
                ? app.approvedAmount / 10000
                : undefined,
            }));
          setRecentApps(sorted.slice(0, 6));
        }

        if (poolRes.ok) {
          const poolJson = await poolRes.json();
          const pool: FundPool = poolJson.data;
          const poolInWan: FundPool = {
            ...pool,
            total: pool.total / 10000,
            approvedTotal: pool.approvedTotal / 10000,
            disbursedTotal: pool.disbursedTotal / 10000,
            remaining: pool.remaining / 10000,
            queuedTotal: pool.queuedTotal / 10000,
            byDirection: Object.fromEntries(
              Object.entries(pool.byDirection).map(([k, v]) => [
                k,
                {
                  approved: v.approved / 10000,
                  disbursed: v.disbursed / 10000,
                  count: v.count,
                },
              ]),
            ) as FundPool["byDirection"],
          };
          setPoolData(poolInWan);
          setFundPool(pool);
        }
      } catch (e) {
        showToast("数据加载失败", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: "待初审",
      value: stats.pendingPreliminary,
      icon: ClipboardList,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      onClick: () => navigate("/reviewer/review?tab=pending_preliminary"),
    },
    {
      label: "待专家评审",
      value: stats.inReview,
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      onClick: () => navigate("/reviewer/review?tab=in_review"),
    },
    {
      label: "待立项",
      value: stats.pendingApproval,
      icon: FileCheck,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      onClick: () => navigate("/reviewer/review?tab=pending_approval"),
    },
    {
      label: "待拨付",
      value: stats.pendingDisbursement,
      icon: Wallet,
      color: "from-teal-500 to-cyan-500",
      bg: "bg-teal-50",
      iconBg: "bg-teal-100",
      onClick: () => navigate("/reviewer/disbursement"),
    },
  ];

  const quickActions = [
    {
      title: "批量初审",
      desc: "对待初审申报进行批量审核",
      icon: SearchCheck,
      color: "from-amber-500 to-orange-500",
      onClick: () => navigate("/reviewer/review?tab=pending_preliminary"),
    },
    {
      title: "基金池管理",
      desc: "查看基金池分配与流水",
      icon: PiggyBank,
      color: "from-emerald-500 to-teal-500",
      onClick: () => navigate("/reviewer/fund-pool"),
    },
    {
      title: "交易流水",
      desc: "查询资金进出明细记录",
      icon: Receipt,
      color: "from-blue-500 to-indigo-500",
      onClick: () => navigate("/reviewer/fund-pool"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">
            你好，{reviewerName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            今天是 {today}，欢迎回到评审工作台
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-100 mb-4" />
                <div className="h-4 w-20 bg-slate-100 rounded mb-2" />
                <div className="h-8 w-16 bg-slate-100 rounded" />
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  onClick={card.onClick}
                  className="card p-6 text-left group hover:-translate-y-1 transition-all duration-200 hover:shadow-xl border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    >
                      <Icon
                        className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}
                        size={22}
                      />
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-slate-300 group-hover:text-slate-500 transition-colors group-hover:translate-x-1"
                    />
                  </div>
                  <div className="text-sm text-slate-500 mb-1">
                    {card.label}
                  </div>
                  <div
                    className={`text-4xl font-bold font-display bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}
                  >
                    {card.value}
                  </div>
                </button>
              );
            })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-800">基金池概览</h3>
            <button
              onClick={() => navigate("/reviewer/fund-pool")}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              详情 <ArrowRight size={14} />
            </button>
          </div>
          {loading || !poolData ? (
            <div className="flex items-center justify-center h-[280px] animate-pulse">
              <div className="w-[260px] h-[260px] rounded-full bg-slate-100" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FundProgress
                total={poolData.total}
                used={poolData.approvedTotal}
                disbursed={poolData.disbursedTotal}
              />
              <div className="grid grid-cols-3 gap-3 mt-6 w-full">
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-slate-500 mb-1">总额度</div>
                  <div className="text-sm font-bold text-navy-700 font-display">
                    {formatAmount(poolData.total)}
                  </div>
                </div>
                <div className="text-center p-3 rounded-xl bg-navy-50">
                  <div className="text-xs text-slate-500 mb-1">已立项</div>
                  <div className="text-sm font-bold text-navy-700 font-display">
                    {formatAmount(poolData.approvedTotal)}
                  </div>
                </div>
                <div className="text-center p-3 rounded-xl bg-teal-50">
                  <div className="text-xs text-slate-500 mb-1">已拨付</div>
                  <div className="text-sm font-bold text-teal-700 font-display">
                    {formatAmount(poolData.disbursedTotal)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-800">最新申报</h3>
            <button
              onClick={() => navigate("/reviewer/review")}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              全部 <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-slate-100 rounded" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                  <div className="h-8 w-16 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-12 text-slate-400">暂无申报数据</div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="text-left font-medium py-2 px-2">
                      公司名称
                    </th>
                    <th className="text-left font-medium py-2 px-2">
                      支持方向
                    </th>
                    <th className="text-right font-medium py-2 px-2">
                      申请金额
                    </th>
                    <th className="text-center font-medium py-2 px-2">状态</th>
                    <th className="text-right font-medium py-2 px-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <DirectionIcon
                            direction={app.direction}
                            size={18}
                            className="text-navy-600"
                          />
                          <span className="font-medium text-navy-800 text-sm truncate max-w-[160px]">
                            {app.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-slate-600">
                          {directionLabel(app.direction)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-semibold text-navy-700 font-display text-sm">
                          {formatAmount(app.requestedAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() =>
                            navigate(`/reviewer/review?highlight=${app.id}`)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors hover:-translate-y-0.5"
                        >
                          <Eye size={14} />
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quickActions.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.title}
              onClick={qa.onClick}
              className="card p-5 text-left group hover:-translate-y-1 transition-all duration-200 hover:shadow-lg flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${qa.color} flex items-center justify-center shadow-lg shadow-slate-200 group-hover:shadow-xl transition-shadow`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy-800">{qa.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{qa.desc}</div>
              </div>
              <ArrowRight
                size={20}
                className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
