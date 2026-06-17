import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  CheckCircle,
  X,
  Building2,
  Target,
  Calendar,
  Clock,
  AlertTriangle,
  Ban,
  FileCheck,
  TrendingUp,
  User,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import type {
  Application,
  FundPool,
  Milestone,
  SupportDirection,
} from "../../../shared/types";
import { useAppStore } from "../../store";
import {
  formatAmount,
  formatDateTime,
  directionLabel,
} from "../../utils/format";
import { useToast } from "../../components/Toast";
import DirectionIcon from "../../components/DirectionIcon";
import ModalShell from "../../components/ModalShell";

type FilterStatus = "all" | "requested" | "approved" | "paid";

interface DisbursementItem {
  appId: string;
  companyName: string;
  direction: SupportDirection;
  approvedAmount: number;
  milestone: Milestone;
  application?: Application;
}

interface HistoryItem {
  appId: string;
  companyName: string;
  direction: SupportDirection;
  milestone: Milestone;
}

export default function DisbursementPage() {
  const { user, fundPool, loadFundPool, setFundPool } = useAppStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<FundPool | null>(fundPool);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [reviewingItem, setReviewingItem] = useState<DisbursementItem | null>(
    null,
  );
  const [payingItem, setPayingItem] = useState<DisbursementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [operator, setOperator] = useState(
    user && "name" in user ? user.name : "",
  );
  const [reviewComment, setReviewComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [payRemark, setPayRemark] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectType, setRejectType] = useState<"review" | "pay">("review");

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!fundPool) await loadFundPool();

      const [poolRes, disbRes, appsRes] = await Promise.all([
        fetch("/api/fund-pool"),
        fetch(
          `/api/disbursements?status=${filterStatus === "all" ? "" : filterStatus}`,
        ),
        fetch("/api/applications"),
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

      let apps: Application[] = [];
      if (appsRes.ok) {
        const json = await appsRes.json();
        apps = json.data || [];
      }

      if (disbRes.ok) {
        const json = await disbRes.json();
        const raw: {
          appId: string;
          companyName: string;
          approvedAmount: number;
          direction: SupportDirection;
          milestone: Milestone;
        }[] = json.data || [];
        const processed: DisbursementItem[] = raw.map((r) => {
          const app = apps.find((a) => a.id === r.appId);
          return {
            ...r,
            approvedAmount: r.approvedAmount / 10000,
            milestone: {
              ...r.milestone,
              amount: r.milestone.amount / 10000,
              paidAmount: r.milestone.paidAmount
                ? r.milestone.paidAmount / 10000
                : undefined,
            },
            application: app,
          };
        });
        setItems(processed);
      }

      const historyItems: HistoryItem[] = [];
      apps.forEach((app) => {
        if (!app.milestones) return;
        app.milestones.forEach((ms) => {
          if (
            ms.status === "paid" ||
            ms.status === "approved" ||
            ms.status === "rejected"
          ) {
            historyItems.push({
              appId: app.id,
              companyName: app.companyName,
              direction: app.direction,
              milestone: {
                ...ms,
                amount: ms.amount / 10000,
                paidAmount: ms.paidAmount ? ms.paidAmount / 10000 : undefined,
              },
            });
          }
        });
      });
      historyItems.sort((a, b) => {
        const getDate = (ms: Milestone) => {
          return (
            ms.paidDate ||
            ms.approveDate ||
            ms.reviewDate ||
            ms.rejectDate ||
            ms.requestDate ||
            ""
          );
        };
        return (
          new Date(getDate(b.milestone)).getTime() -
          new Date(getDate(a.milestone)).getTime()
        );
      });
      setHistory(historyItems);
    } catch {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const pendingReviewTotal = useMemo(
    () =>
      items
        .filter((i) => i.milestone.status === "requested")
        .reduce((sum, item) => sum + item.milestone.amount, 0),
    [items],
  );

  const pendingPayTotal = useMemo(
    () =>
      items
        .filter((i) => i.milestone.status === "approved")
        .reduce((sum, item) => sum + item.milestone.amount, 0),
    [items],
  );

  const openReview = (item: DisbursementItem) => {
    setReviewingItem(item);
    setOperator(user && "name" in user ? user.name : "");
    setReviewComment("");
    setShowReject(false);
    setRejectType("review");
  };

  const openPay = (item: DisbursementItem) => {
    setPayingItem(item);
    setOperator(user && "name" in user ? user.name : "");
    setApproveComment("");
    setPaidAmount(String(item.milestone.amount));
    setPayRemark("");
    setShowReject(false);
    setRejectType("pay");
  };

  const handleReview = async (pass: boolean) => {
    if (!reviewingItem) return;
    if (!operator.trim()) {
      showToast("请输入审核人", "error");
      return;
    }
    if (!reviewComment.trim()) {
      showToast("请填写审核意见", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/disbursements/${reviewingItem.milestone.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewer: operator,
            reviewComment,
            pass,
          }),
        },
      );
      if (res.ok) {
        showToast(
          pass ? "审核通过，可进行放款" : "审核不通过，已退回",
          "success",
        );
        setReviewingItem(null);
        await fetchData();
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "操作失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!payingItem) return;
    if (!operator.trim()) {
      showToast("请输入放款人", "error");
      return;
    }
    if (!paidAmount || paidAmount.trim() === "") {
      showToast("请填写实际放款金额", "error");
      return;
    }
    const paidNum = Number(paidAmount);
    if (Number.isNaN(paidNum) || !Number.isFinite(paidNum)) {
      showToast("实际放款金额必须是合法数值", "error");
      return;
    }
    if (paidNum <= 0) {
      showToast("实际放款金额必须大于0", "error");
      return;
    }
    if (paidNum > payingItem.milestone.amount) {
      showToast(
        `实际放款金额不能超过该里程碑应拨额（${formatAmount(payingItem.milestone.amount)}万元）`,
        "error",
      );
      return;
    }
    if (pool) {
      const availableBalance = pool.total - pool.disbursedTotal;
      if (paidNum > availableBalance) {
        showToast(
          `实际放款金额不能超过资金池可用余额（${formatAmount(availableBalance)}万元）`,
          "error",
        );
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/disbursements/${payingItem.milestone.id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approver: operator,
            approveComment,
            paidAmount: Number(paidAmount) * 10000,
            remark: payRemark,
          }),
        },
      );
      if (res.ok) {
        showToast("放款完成，资金已下拨", "success");
        setPayingItem(null);
        await fetchData();
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "操作失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewingItem && !payingItem) return;
    if (!rejectReason.trim()) {
      showToast("请填写退回原因", "error");
      return;
    }
    const item = rejectType === "review" ? reviewingItem : payingItem;
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/disbursements/${item.milestone.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejector: operator,
            rejectReason,
          }),
        },
      );
      if (res.ok) {
        showToast("已退回拨付申请", "success");
        setReviewingItem(null);
        setPayingItem(null);
        setShowReject(false);
        setRejectReason("");
        await fetchData();
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "操作失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
            <Clock size={12} />
            待审核
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
            <FileCheck size={12} />
            待放款
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100">
            <CheckCircle size={12} />
            已放款
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
            <Ban size={12} />
            已退回
          </span>
        );
      default:
        return null;
    }
  };

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "requested", label: "待审核" },
    { value: "approved", label: "待放款" },
    { value: "paid", label: "已完成" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">拨付审核</h1>
          <p className="text-slate-500 mt-1">
            审核里程碑拨付申请并执行资金下拨
          </p>
        </div>
        <div className="flex gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === opt.value
                  ? "bg-gradient-to-r from-navy-600 to-teal-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {loading || !pool
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
                <div className="h-10 w-32 bg-slate-100 rounded" />
              </div>
            ))
          : [
              {
                label: "已拨付金额",
                value: pool.disbursedTotal,
                color: "from-teal-500 to-emerald-500",
                icon: CheckCircle,
                bg: "bg-teal-50",
              },
              {
                label: "剩余可拨付",
                value: pool.remaining,
                color: "from-navy-600 to-blue-500",
                icon: Wallet,
                bg: "bg-navy-50",
              },
              {
                label: "待审核拨付",
                value: pendingReviewTotal,
                color: "from-amber-500 to-orange-500",
                icon: Clock,
                bg: "bg-amber-50",
              },
              {
                label: "待放款拨付",
                value: pendingPayTotal,
                color: "from-blue-500 to-indigo-500",
                icon: TrendingUp,
                bg: "bg-blue-50",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 mb-1">
                    {item.label}
                  </div>
                  <div
                    className={`text-3xl font-bold font-display bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                  >
                    {formatAmount(item.value)}
                  </div>
                </div>
              );
            })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-navy-800 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            拨付列表
          </h3>
          <span className="text-xs text-slate-400">共 {items.length} 笔</span>
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
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Wallet size={48} className="mx-auto mb-3 opacity-40" />
            <div>暂无数据</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-xs text-slate-500">
                  <th className="text-left font-medium py-3 px-6">公司名称</th>
                  <th className="text-left font-medium py-3 px-6">支持方向</th>
                  <th className="text-left font-medium py-3 px-6">里程碑</th>
                  <th className="text-right font-medium py-3 px-6">申请金额</th>
                  <th className="text-left font-medium py-3 px-6">状态</th>
                  <th className="text-left font-medium py-3 px-6">时间</th>
                  <th className="text-right font-medium py-3 px-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.milestone.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <DirectionIcon
                          direction={item.direction}
                          size={18}
                          className="text-navy-600"
                        />
                        <span className="font-medium text-navy-800">
                          {item.companyName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">
                        {directionLabel(item.direction)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm font-medium text-navy-800">
                          {item.milestone.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          进度占比 {item.milestone.percentage}% · 核定总额
                          {formatAmount(item.approvedAmount)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-navy-700 font-display text-lg">
                        {formatAmount(item.milestone.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.milestone.status)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDateTime(
                          item.milestone.requestDate ||
                            item.milestone.reviewDate ||
                            item.milestone.paidDate,
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {item.milestone.status === "requested" && (
                        <button
                          onClick={() => openReview(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-navy-600 to-teal-500 text-white hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <FileCheck size={15} />
                          审核
                        </button>
                      )}
                      {item.milestone.status === "approved" && (
                        <button
                          onClick={() => openPay(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <DollarSign size={15} />
                          放款
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-navy-800 flex items-center gap-2">
            <CheckCircle size={18} className="text-teal-500" />
            历史拨付记录
          </h3>
          <span className="text-xs text-slate-400">共 {history.length} 条</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-slate-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-400">暂无历史记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-xs text-slate-500">
                  <th className="text-left font-medium py-3 px-6">公司名称</th>
                  <th className="text-left font-medium py-3 px-6">支持方向</th>
                  <th className="text-left font-medium py-3 px-6">里程碑</th>
                  <th className="text-right font-medium py-3 px-6">金额</th>
                  <th className="text-left font-medium py-3 px-6">时间</th>
                  <th className="text-center font-medium py-3 px-6">状态</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const keyId = `${item.appId}-${item.milestone.id}`;
                  return (
                    <tr
                      key={keyId}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <DirectionIcon
                            direction={item.direction}
                            size={16}
                            className="text-navy-600"
                          />
                          <span className="font-medium text-navy-800 text-sm">
                            {item.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-xs text-slate-600">
                          {directionLabel(item.direction)}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-sm text-slate-700">
                          {item.milestone.name}
                          <span className="text-slate-400 ml-2 text-xs">
                            ({item.milestone.percentage}%)
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="font-bold font-display text-navy-700">
                          {formatAmount(
                            item.milestone.paidAmount ?? item.milestone.amount,
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-xs text-slate-500 font-mono">
                          {formatDateTime(
                            item.milestone.paidDate ||
                              item.milestone.approveDate ||
                              item.milestone.rejectDate ||
                              item.milestone.requestDate,
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {getStatusBadge(item.milestone.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalShell
        open={!!reviewingItem}
        onClose={() => !submitting && setReviewingItem(null)}
        title={reviewingItem ? `拨付审核 - ${reviewingItem.companyName}` : ""}
      >
        {reviewingItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                企业申请
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="flex items-center gap-2 font-semibold text-navy-700">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-navy-600 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                审核
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                放款
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <Building2 size={14} />
                  企业名称
                </div>
                <div className="font-semibold text-navy-800">
                  {reviewingItem.companyName}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <Target size={14} />
                  支持方向
                </div>
                <div className="font-semibold text-navy-800 flex items-center gap-1.5">
                  <DirectionIcon
                    direction={reviewingItem.direction}
                    size={16}
                  />
                  {directionLabel(reviewingItem.direction)}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-navy-50 to-teal-50 border border-navy-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                  <Target size={16} className="text-teal-600" />
                  里程碑详情
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/70 text-slate-600 border border-white">
                  进度 {reviewingItem.milestone.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold text-navy-800 mb-2">
                {reviewingItem.milestone.name}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/60">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    申请拨付金额
                  </div>
                  <div className="text-3xl font-bold font-display bg-gradient-to-r from-navy-700 to-teal-600 bg-clip-text text-transparent">
                    {formatAmount(reviewingItem.milestone.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">核定总额度</div>
                  <div className="text-lg font-semibold text-navy-700 font-display">
                    {formatAmount(reviewingItem.approvedAmount)}
                  </div>
                </div>
              </div>
            </div>

            {reviewingItem.milestone.requestRemark && (
              <div className="p-4 rounded-xl bg-white border border-slate-100">
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  申请说明
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {reviewingItem.milestone.requestRemark}
                </p>
              </div>
            )}

            {reviewingItem.application && (
              <div className="p-4 rounded-xl bg-white border border-slate-100">
                <div className="text-xs text-slate-500 mb-2 font-medium">
                  项目概述
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {reviewingItem.application.purposeDescription}
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
              <Calendar
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-800">
                <div className="font-semibold mb-0.5">申请信息</div>
                <div className="text-xs text-amber-700">
                  申请时间：
                  {formatDateTime(reviewingItem.milestone.requestDate)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  审核人
                </div>
              </label>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                placeholder="请输入审核人姓名"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                审核意见
              </label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                placeholder="请详细说明审核意见，包括里程碑完成情况、材料完整性、风险提示等..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReviewingItem(null)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowReject(true);
                  setRejectType("review");
                }}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <Ban size={16} />
                退回
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                审核不通过
              </button>
              <button
                onClick={() => handleReview(true)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {submitting ? "审核中..." : "审核通过"}
              </button>
            </div>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={!!payingItem}
        onClose={() => !submitting && setPayingItem(null)}
        title={payingItem ? `拨付放款 - ${payingItem.companyName}` : ""}
      >
        {payingItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                企业申请
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                审核通过
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="flex items-center gap-2 font-semibold text-navy-700">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-navy-600 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                放款
              </div>
            </div>

            {payingItem.milestone.reviewer && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2">
                  <CheckCircle size={14} />
                  审核通过
                </div>
                <div className="text-sm text-emerald-800 space-y-1">
                  <div>
                    审核人：
                    <span className="font-semibold">
                      {payingItem.milestone.reviewer}
                    </span>
                  </div>
                  {payingItem.milestone.reviewComment && (
                    <div>审核意见：{payingItem.milestone.reviewComment}</div>
                  )}
                  {payingItem.milestone.reviewDate && (
                    <div>
                      审核时间：
                      {formatDateTime(payingItem.milestone.reviewDate)}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <Building2 size={14} />
                  企业名称
                </div>
                <div className="font-semibold text-navy-800">
                  {payingItem.companyName}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <Target size={14} />
                  里程碑
                </div>
                <div className="font-semibold text-navy-800">
                  {payingItem.milestone.name}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    申请拨付金额
                  </div>
                  <div className="text-3xl font-bold font-display bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                    {formatAmount(payingItem.milestone.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">核定总额度</div>
                  <div className="text-lg font-semibold text-navy-700 font-display">
                    {formatAmount(payingItem.approvedAmount)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  放款人
                </div>
              </label>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                placeholder="请输入放款人姓名"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} />
                  实际放款金额（万元）
                </div>
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 outline-none transition-all font-display font-bold ${
                  paidAmount &&
                  (Number(paidAmount) <= 0 ||
                    Number(paidAmount) >
                      Math.min(
                        payingItem.milestone.amount,
                        pool
                          ? pool.total - pool.disbursedTotal
                          : payingItem.milestone.amount,
                      ))
                    ? "border-rose-300 focus:ring-rose-500/30 focus:border-rose-500 text-rose-700"
                    : "border-slate-200 focus:ring-teal-500/30 focus:border-teal-500 text-navy-700"
                }`}
                placeholder={String(payingItem.milestone.amount)}
              />
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  本次可放上限：
                  <span className="font-semibold text-teal-600">
                    {formatAmount(
                      Math.min(
                        payingItem.milestone.amount,
                        pool
                          ? pool.total - pool.disbursedTotal
                          : payingItem.milestone.amount,
                      ),
                    )}
                    万元
                  </span>
                </span>
                <span className="text-slate-400">
                  里程碑应拨：{formatAmount(payingItem.milestone.amount)}万元
                  {pool &&
                    ` · 资金池可用：${formatAmount(pool.total - pool.disbursedTotal)}万元`}
                </span>
              </div>
              {paidAmount && Number(paidAmount) <= 0 && (
                <div className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  放款金额必须大于0
                </div>
              )}
              {paidAmount &&
                Number(paidAmount) >
                  Math.min(
                    payingItem.milestone.amount,
                    pool
                      ? pool.total - pool.disbursedTotal
                      : payingItem.milestone.amount,
                  ) && (
                  <div className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    放款金额超过本次可放上限
                  </div>
                )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                放款审批意见
              </label>
              <textarea
                rows={3}
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                placeholder="请说明放款审批意见..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                备注
              </label>
              <textarea
                rows={2}
                value={payRemark}
                onChange={(e) => setPayRemark(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                placeholder="特殊说明、转账凭证号等..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPayingItem(null)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowReject(true);
                  setRejectType("pay");
                }}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <Ban size={16} />
                退回
              </button>
              <button
                onClick={handlePay}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                <DollarSign size={16} />
                {submitting ? "放款中..." : "确认放款"}
              </button>
            </div>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={showReject && (!!reviewingItem || !!payingItem)}
        onClose={() => !submitting && setShowReject(false)}
        title="退回拨付申请"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
            <AlertTriangle
              size={20}
              className="text-rose-600 flex-shrink-0 mt-0.5"
            />
            <div className="text-sm text-rose-800">
              <div className="font-semibold mb-1">确认退回此拨付申请？</div>
              <div className="text-xs text-rose-700">
                退回后企业可修改后重新提交拨付申请
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              退回原因
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all resize-none"
              placeholder="请说明退回原因..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowReject(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              <Ban size={16} />
              确认退回
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
