import { useEffect, useMemo, useState } from "react";
import {
  PiggyBank,
  FileCheck,
  Wallet,
  Banknote,
  Clock,
  AlertCircle,
  ListOrdered,
  Receipt,
  ArrowUpRight,
  RefreshCw,
  Play,
  AlertTriangle,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  Application,
  FundPool,
  SupportDirection,
  Transaction,
} from "../../../shared/types";
import { useAppStore } from "../../store";
import {
  formatAmount,
  formatDateTime,
  directionLabel,
} from "../../utils/format";
import { useToast } from "../../components/Toast";
import FundProgress from "../../components/FundProgress";
import DirectionIcon from "../../components/DirectionIcon";

export default function FundPoolPage() {
  const { fundPool, loadFundPool, setFundPool, getApplications } =
    useAppStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<FundPool | null>(fundPool);
  const [queuedApps, setQueuedApps] = useState<Application[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (!fundPool) await loadFundPool();

      const [poolRes, appsRes, txRes, availRes] = await Promise.all([
        fetch("/api/fund-pool"),
        fetch("/api/applications"),
        fetch("/api/fund-pool/transactions"),
        fetch("/api/fund-pool/available"),
      ]);

      if (poolRes.ok) {
        const json = await poolRes.json();
        const data: FundPool = json.data;
        const poolInWan: FundPool = {
          ...data,
          total: data.total / 10000,
          approvedTotal: data.approvedTotal / 10000,
          disbursedTotal: data.disbursedTotal / 10000,
          remaining: data.remaining / 10000,
          queuedTotal: data.queuedTotal / 10000,
          byDirection: Object.fromEntries(
            Object.entries(data.byDirection).map(([k, v]) => [
              k,
              {
                approved: v.approved / 10000,
                disbursed: v.disbursed / 10000,
                count: v.count,
              },
            ]),
          ) as FundPool["byDirection"],
        };
        setPool(poolInWan);
        setFundPool(data);
      }

      if (appsRes.ok) {
        const json = await appsRes.json();
        const data: Application[] = json.data || [];
        const queued = data
          .filter((a) => a.status === "queued")
          .map((a) => ({
            ...a,
            approvedAmount: a.approvedAmount
              ? a.approvedAmount / 10000
              : undefined,
          }))
          .sort(
            (a, b) =>
              (a.approval?.queuePosition || 0) -
              (b.approval?.queuePosition || 0),
          );
        setQueuedApps(queued);
      }

      if (txRes.ok) {
        const json = await txRes.json();
        const data: Transaction[] = (json.data || []).map(
          (tx: Transaction) => ({
            ...tx,
            amount: tx.amount / 10000,
          }),
        );
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setTransactions(data);
      }

      if (availRes.ok) {
        const json = await availRes.json();
        setAvailableAmount((json.data || 0) / 10000);
      }
    } catch {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await fetch("/api/fund-pool/process-queue", {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        const released = json.data || [];
        if (released.length > 0) {
          showToast(`已释放 ${released.length} 个排队项目`, "success");
        } else {
          showToast("暂无符合条件的排队项目可释放", "info");
        }
        await fetchData(true);
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "操作失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      setProcessingQueue(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const directionChartData = useMemo(() => {
    if (!pool) return [];
    const dirs: SupportDirection[] = [
      "testing_capability",
      "tech_breakthrough",
      "production_expansion",
    ];
    return dirs.map((d) => ({
      direction: directionLabel(d),
      directionKey: d,
      已立项: pool.byDirection[d]?.approved || 0,
      已拨付: pool.byDirection[d]?.disbursed || 0,
    }));
  }, [pool]);

  const statCards = [
    {
      label: "基金总额度",
      value: pool?.total || 0,
      icon: PiggyBank,
      color: "from-navy-700 to-blue-600",
      bg: "bg-navy-50",
      sub: "5亿元专项基金",
    },
    {
      label: "已立项额度",
      value: pool?.approvedTotal || 0,
      icon: FileCheck,
      color: "from-blue-600 to-indigo-600",
      bg: "bg-blue-50",
      sub: `${pool ? (pool.byDirection ? Object.values(pool.byDirection).reduce((s, d) => s + d.count, 0) : 0) : 0} 个项目`,
    },
    {
      label: "已拨付金额",
      value: pool?.disbursedTotal || 0,
      icon: Wallet,
      color: "from-teal-600 to-emerald-600",
      bg: "bg-teal-50",
      sub:
        pool && pool.approvedTotal
          ? `${((pool.disbursedTotal / pool.approvedTotal) * 100).toFixed(1)}% 拨付率`
          : "0% 拨付率",
    },
    {
      label: "剩余可用额度",
      value: pool?.remaining || 0,
      icon: Banknote,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      sub:
        pool && pool.total
          ? `${((pool.remaining / pool.total) * 100).toFixed(1)}% 可用`
          : "0% 可用",
    },
  ];

  const availablePct =
    pool && pool.total > 0 ? (availableAmount / pool.total) * 100 : 0;
  const isLowWarning = availablePct < 10 && availablePct > 0;
  const isCriticalWarning = availablePct < 5 && availablePct > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">基金池仪表盘</h1>
          <p className="text-slate-500 mt-1">
            查看基金池分配情况、排队项目及资金流水
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            刷新数据
          </button>
          {queuedApps.length > 0 && (
            <button
              onClick={handleProcessQueue}
              disabled={processingQueue || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              <Play size={16} />
              {processingQueue ? "处理中..." : "释放排队项目"}
            </button>
          )}
        </div>
      </div>

      {(isLowWarning || isCriticalWarning) && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            isCriticalWarning
              ? "bg-rose-50 border-rose-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <AlertTriangle
            size={20}
            className={`flex-shrink-0 mt-0.5 ${
              isCriticalWarning ? "text-rose-600" : "text-amber-600"
            }`}
          />
          <div className="flex-1">
            <div
              className={`font-semibold mb-0.5 ${
                isCriticalWarning ? "text-rose-800" : "text-amber-800"
              }`}
            >
              {isCriticalWarning ? "额度严重不足预警" : "额度不足预警"}
            </div>
            <div
              className={`text-sm ${
                isCriticalWarning ? "text-rose-700" : "text-amber-700"
              }`}
            >
              当前可分配额度仅剩 {formatAmount(availableAmount)}（
              {availablePct.toFixed(1)}%），
              {isCriticalWarning
                ? "请及时补充基金或减少立项额度。"
                : "请谨慎审批新的立项申请。"}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-100 mb-4" />
                <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
                <div className="h-10 w-36 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="card p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200 hover:shadow-xl"
                >
                  <div
                    className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${card.bg} opacity-50 blur-2xl`}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shadow-inner`}
                      >
                        <Icon size={24} className="text-slate-600" />
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="text-sm text-slate-500 mb-1.5">
                      {card.label}
                    </div>
                    <div
                      className={`text-4xl font-bold font-display bg-gradient-to-r ${card.color} bg-clip-text text-transparent leading-tight`}
                    >
                      {formatAmount(card.value)}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <span>{card.sub}</span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">
          <div className="card p-6">
            <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <PiggyBank size={18} className="text-navy-600" />
              基金池使用概览
            </h3>
            {loading || !pool ? (
              <div className="flex items-center justify-center h-[320px] animate-pulse">
                <div className="w-[280px] h-[280px] rounded-full bg-slate-100" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="flex justify-center">
                  <FundProgress
                    total={pool.total}
                    used={pool.approvedTotal}
                    disbursed={pool.disbursedTotal}
                    size={300}
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">
                        排队项目
                      </div>
                      <div className="text-2xl font-bold font-display text-amber-600">
                        {queuedApps.length}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        等待额度释放
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">
                        排队占用
                      </div>
                      <div className="text-2xl font-bold font-display text-amber-600">
                        {formatAmount(pool.queuedTotal)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        暂不可用
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#0B3D91]" />
                      <span className="text-sm text-slate-600">已立项</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#00D4AA]" />
                      <span className="text-sm text-slate-600">已拨付</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#EAF1FB]" />
                      <span className="text-sm text-slate-600">剩余额度</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-navy-50 to-teal-50 border border-navy-100">
                      <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                        <Info size={12} />
                        当前可分配额度
                      </div>
                      <div className="text-3xl font-bold font-display bg-gradient-to-r from-navy-700 to-teal-600 bg-clip-text text-transparent">
                        {formatAmount(availableAmount)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        占总额度 {availablePct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                      <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                        <TrendingDown size={12} />
                        已分配未拨付
                      </div>
                      <div className="text-2xl font-bold font-display bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {formatAmount(pool.approvedTotal - pool.disbursedTotal)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        = 已立项 - 已拨付
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <ListOrdered size={18} className="text-teal-600" />
              支持方向资金分布
            </h3>
            {loading ? (
              <div className="h-[320px] bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={directionChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    barGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="direction"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 10000).toFixed(0)}亿`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatAmount(value), ""]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="已立项" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {directionChartData.map((_, i) => (
                        <Cell key={i} fill="url(#navyGradient)" />
                      ))}
                    </Bar>
                    <Bar dataKey="已拨付" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {directionChartData.map((_, i) => (
                        <Cell key={i} fill="url(#tealGradient)" />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient
                        id="navyGradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#0B3D91" />
                        <stop offset="100%" stopColor="#1E6FD9" />
                      </linearGradient>
                      <linearGradient
                        id="tealGradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#00D4AA" />
                        <stop offset="100%" stopColor="#0FB391" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 to-orange-50/80">
              <h3 className="font-semibold text-navy-800 flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                队列排队项目
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                {queuedApps.length} 个项目
              </span>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : queuedApps.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-amber-50/30">
                <AlertCircle size={40} className="mx-auto mb-2 opacity-40" />
                <div className="text-sm">当前无排队项目，额度充足</div>
              </div>
            ) : (
              <div className="divide-y divide-amber-100 bg-amber-50/20">
                {queuedApps.map((app) => (
                  <div
                    key={app.id}
                    className="px-6 py-4 hover:bg-amber-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold font-display text-amber-700">
                          #{app.approval?.queuePosition || "-"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <DirectionIcon
                            direction={app.direction}
                            size={14}
                            className="text-navy-600"
                          />
                          <span className="font-semibold text-navy-800 truncate">
                            {app.companyName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          <span>{directionLabel(app.direction)}</span>
                          <span>·</span>
                          <span className="font-bold text-amber-700 font-display text-sm">
                            核定 {formatAmount(app.approvedAmount || 0)}
                          </span>
                        </div>
                        {app.approval?.comment && (
                          <div className="text-xs text-slate-500 bg-white/70 px-3 py-2 rounded-lg border border-amber-100 line-clamp-2">
                            💡 {app.approval.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy-800 flex items-center gap-2">
                <Receipt size={18} className="text-teal-600" />
                交易流水
              </h3>
              <span className="text-xs text-slate-400">
                共 {transactions.length} 条
              </span>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-slate-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Receipt size={40} className="mx-auto mb-2 opacity-40" />
                <div className="text-sm">暂无交易记录</div>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 sticky top-0">
                    <tr className="text-xs text-slate-500">
                      <th className="text-left font-medium py-2.5 px-4">
                        时间
                      </th>
                      <th className="text-left font-medium py-2.5 px-4">
                        类型/公司
                      </th>
                      <th className="text-right font-medium py-2.5 px-4">
                        金额
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => {
                      const isReserve = tx.type === "approve_reserve";
                      const isRelease = tx.type === "queue_release";
                      const amountColor = isReserve
                        ? "text-orange-600"
                        : isRelease
                          ? "text-violet-600"
                          : "text-emerald-600";
                      const bgColor = isReserve
                        ? "bg-orange-50"
                        : isRelease
                          ? "bg-violet-50"
                          : "bg-emerald-50";
                      const borderColor = isReserve
                        ? "border-orange-100"
                        : isRelease
                          ? "border-violet-100"
                          : "border-emerald-100";
                      const typeLabel = isReserve
                        ? "额度预留"
                        : isRelease
                          ? "排队释放"
                          : "资金拨付";
                      const sign = isReserve || isRelease ? "-" : "-";
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 align-top">
                            <span className="text-xs text-slate-400 font-mono block">
                              {formatDateTime(tx.createdAt).split(" ")[0]}
                            </span>
                            <span className="text-xs text-slate-300 font-mono">
                              {formatDateTime(tx.createdAt).split(" ")[1]}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="mb-1">
                              <span
                                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border ${bgColor} ${amountColor} ${borderColor}`}
                              >
                                {typeLabel}
                              </span>
                            </div>
                            {tx.companyName && (
                              <div className="text-sm text-navy-700 font-medium truncate max-w-[180px]">
                                {tx.companyName}
                              </div>
                            )}
                            {tx.direction && (
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <DirectionIcon
                                  direction={tx.direction}
                                  size={10}
                                />
                                {directionLabel(tx.direction)}
                              </div>
                            )}
                            {tx.remark && (
                              <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {tx.remark}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right align-top">
                            <div
                              className={`text-base font-bold font-display ${amountColor}`}
                            >
                              {sign}
                              {formatAmount(tx.amount)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
