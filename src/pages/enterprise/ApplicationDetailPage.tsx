import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  FileText,
  User,
  Phone,
  CreditCard,
  Paperclip,
  Wallet,
  ClipboardCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Star,
  Info,
  ChevronRight,
  Clock,
  FileCheck,
  DollarSign,
  Ban,
  TrendingUp,
} from "lucide-react";
import ModalShell from "../../components/ModalShell";
import { useAppStore } from "../../store";
import StatusBadge from "../../components/StatusBadge";
import DirectionIcon from "../../components/DirectionIcon";
import Timeline from "../../components/Timeline";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  directionLabel,
} from "../../utils/format";
import type {
  Application,
  FundPool,
  Milestone,
  MilestoneStatus,
} from "../../../shared/types";

function msLabel(status: MilestoneStatus): string {
  switch (status) {
    case "pending":
      return "待申请";
    case "requested":
      return "待审核";
    case "approved":
      return "待放款";
    case "paid":
      return "已拨付";
    case "rejected":
      return "已退回";
    default:
      return status;
  }
}

function msColor(status: MilestoneStatus): string {
  switch (status) {
    case "pending":
      return "bg-slate-50 text-slate-600 border-slate-200";
    case "requested":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "approved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function msDate(ms: Milestone): string {
  if (ms.paidDate) return formatDate(ms.paidDate);
  if (ms.approveDate) return formatDate(ms.approveDate);
  if (ms.reviewDate) return formatDate(ms.reviewDate);
  if (ms.rejectDate) return formatDate(ms.rejectDate);
  if (ms.requestDate) return formatDate(ms.requestDate);
  return "—";
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fundPool, loadFundPool } = useAppStore();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingMs, setSubmittingMs] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    loadFundPool();
    if (!id) return;
    setLoading(true);
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.code === 0 && res.data) {
          setApplication(res.data);
        } else {
          setError(res.message || "加载失败");
        }
      })
      .catch(() => setError("网络异常"))
      .finally(() => setLoading(false));
  }, [id, loadFundPool]);

  const handleRequestDisbursement = async (milestoneId: string) => {
    if (!id) return;
    setSubmittingMs(milestoneId);
    try {
      const res = await fetch(`/api/applications/${id}/disbursements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        setApplication(data.data);
        alert("拨付申请已提交，请等待管理员审核");
      } else {
        alert(data.message || "操作失败");
      }
    } catch {
      alert("操作失败，请稍后重试");
    } finally {
      setSubmittingMs(null);
    }
  };

  const canRequestDisbursement = (ms: Milestone, idx: number): boolean => {
    if (!application) return false;
    if (
      application.status !== "approved" &&
      application.status !== "in_disbursement"
    )
      return false;
    if (ms.status !== "pending") return false;
    if (idx > 0) {
      const prev = application.milestones[idx - 1];
      if (!prev || prev.status !== "paid") return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/enterprise/applications")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-navy-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">申报详情</h1>
          </div>
        </div>
        <div className="card p-16 text-center text-slate-400">加载中...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/enterprise/applications")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-navy-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">申报详情</h1>
          </div>
        </div>
        <div className="card p-16 text-center">
          <AlertTriangle size={40} className="text-rose-400 mx-auto mb-3" />
          <div className="text-slate-600 mb-2 font-medium">
            {error || "申报不存在"}
          </div>
          <Link
            to="/enterprise/applications"
            className="btn-outline mt-2 inline-flex"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const totalAmt = fundPool ? fundPool.total / 10000 : 50000;
  const usedAmt = fundPool ? fundPool.approvedTotal / 10000 : 0;
  const remainingPct =
    totalAmt > 0
      ? Math.max(0, Math.min(100, ((totalAmt - usedAmt) / totalAmt) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/enterprise/applications")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-navy-600 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-navy-800">申报详情</h1>
            <p className="text-slate-500 mt-1 text-sm truncate">
              申报编号：<span className="font-mono">{application.id}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-5 border-t-4 border-t-teal-500 overflow-hidden">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Info size={12} />
              基金池剩余额度
            </div>
            <div className="text-xl md:text-2xl font-bold text-navy-800 font-display">
              {fundPool ? formatAmount(fundPool.remaining / 10000) : "加载中"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1.5">总额度 / 已立项</div>
            <div className="text-sm md:text-base font-semibold text-slate-600">
              {formatAmount(totalAmt)}{" "}
              <span className="text-slate-400 mx-1">/</span>{" "}
              <span className="text-navy-600">{formatAmount(usedAmt)}</span>
            </div>
          </div>
        </div>
        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${remainingPct}%`,
              background: "linear-gradient(90deg, #00D4AA 0%, #0B3D91 100%)",
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-navy-50 via-teal-50/60 to-transparent p-6 md:p-7 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-navy-100/50 flex items-center justify-center flex-shrink-0">
                <DirectionIcon
                  direction={application.direction}
                  size={30}
                  className="text-navy-600"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <h2 className="font-bold text-navy-800 text-xl md:text-2xl truncate">
                    {application.companyName}
                  </h2>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap mb-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <DirectionIcon
                      direction={application.direction}
                      size={14}
                      className="text-navy-500"
                    />
                    {directionLabel(application.direction)}
                  </span>
                  <StatusBadge status={application.status} />
                  {application.status === "queued" &&
                    application.approval?.queuePosition && (
                      <span className="chip bg-violet-50 text-violet-700 border-violet-200 border">
                        队列第 {application.approval.queuePosition} 位
                      </span>
                    )}
                </div>
                <div className="text-sm text-slate-500">
                  提交时间：{formatDateTime(application.submittedAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex flex-col">
                <div className="text-xs text-slate-400 mb-1">申请金额</div>
                <div className="font-bold text-navy-800 text-2xl">
                  {formatAmount(application.requestedAmount / 10000)}
                </div>
              </div>
              {application.approvedAmount && (
                <>
                  <div className="w-px h-10 bg-slate-200 hidden md:block" />
                  <div className="flex flex-col">
                    <div className="text-xs text-slate-400 mb-1">核定金额</div>
                    <div className="font-bold text-teal-700 text-2xl">
                      {formatAmount(application.approvedAmount / 10000)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-5">
              <Building2 size={18} className="text-navy-600" />
              基本信息
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <div className="text-xs text-slate-400 mb-1.5">企业名称</div>
                <div className="font-semibold text-navy-800 text-sm">
                  {application.companyName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1.5">
                  统一社会信用代码
                </div>
                <div className="font-mono font-semibold text-navy-800 text-sm">
                  {application.unifiedCreditCode}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <User size={12} />
                  联系人
                </div>
                <div className="font-semibold text-navy-800 text-sm">
                  {application.contactPerson}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <Phone size={12} />
                  联系电话
                </div>
                <div className="font-semibold text-navy-800 text-sm font-mono">
                  {application.contactPhone}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">
              <FileText size={18} className="text-navy-600" />
              用途说明
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {application.purposeDescription}
            </p>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">
              <Paperclip size={18} className="text-navy-600" />
              佐证材料
              <span className="text-xs text-slate-400 font-normal">
                （共{application.attachments.length}份）
              </span>
            </h3>
            {application.attachments.length === 0 ? (
              <div className="text-sm text-slate-400">暂无附件</div>
            ) : (
              <div className="space-y-2">
                {application.attachments.map((att, idx) => {
                  const sizeKB = att.size / 1024;
                  const sizeStr =
                    sizeKB >= 1024
                      ? `${(sizeKB / 1024).toFixed(1)} MB`
                      : `${sizeKB.toFixed(0)} KB`;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-navy-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-navy-800 truncate">
                          {att.name}
                        </div>
                        <div className="text-xs text-slate-400">{sizeStr}</div>
                      </div>
                      <a
                        href={att.url}
                        className="btn-outline py-1.5 px-3 text-xs flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                      >
                        预览
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(application.status === "approved" ||
            application.status === "in_disbursement" ||
            application.status === "completed") &&
            application.milestones.length > 0 && (
              <div className="card p-6">
                <h3 className="section-title mb-5">
                  <Wallet size={18} className="text-navy-600" />
                  里程碑拨付
                </h3>
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-full">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            里程碑名称
                          </th>
                          <th className="text-right py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            比例
                          </th>
                          <th className="text-right py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            金额
                          </th>
                          <th className="text-center py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            状态
                          </th>
                          <th className="text-right py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                            日期
                          </th>
                          <th className="text-right py-3 px-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {application.milestones.map((ms, idx) => {
                          const canRequest = canRequestDisbursement(ms, idx);
                          const submitting = submittingMs === ms.id;
                          return (
                            <tr
                              key={ms.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="py-4 px-2.5">
                                <div className="flex items-center gap-2.5 min-w-[180px]">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      ms.status === "paid"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : ms.status === "requested"
                                          ? "bg-amber-50 text-amber-600"
                                          : "bg-slate-50 text-slate-400"
                                    }`}
                                  >
                                    {ms.status === "paid" ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      <span className="text-xs font-bold">
                                        {idx + 1}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-navy-800 text-sm">
                                    {ms.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-2.5 text-right">
                                <span className="font-semibold text-slate-700 text-sm">
                                  {ms.percentage}%
                                </span>
                              </td>
                              <td className="py-4 px-2.5 text-right">
                                <span className="font-bold text-navy-800 text-sm">
                                  {formatAmount(ms.amount / 10000)}
                                </span>
                              </td>
                              <td className="py-4 px-2.5 text-center">
                                <span
                                  className={`chip border ${msColor(ms.status)}`}
                                >
                                  {msLabel(ms.status)}
                                </span>
                              </td>
                              <td className="py-4 px-2.5 text-right text-sm text-slate-500 whitespace-nowrap hidden sm:table-cell">
                                {msDate(ms)}
                              </td>
                              <td className="py-4 px-2.5 text-right whitespace-nowrap">
                                {canRequest ? (
                                  <button
                                    onClick={() =>
                                      handleRequestDisbursement(ms.id)
                                    }
                                    disabled={submitting}
                                    className="btn-teal py-1.5 px-3 text-xs"
                                  >
                                    <Send size={12} />
                                    {submitting ? "提交中..." : "发起拨款"}
                                  </button>
                                ) : ms.status === "pending" ? (
                                  <span
                                    className="text-xs text-slate-400"
                                    title={
                                      idx > 0
                                        ? "需前一笔拨付完成后可申请"
                                        : "立项后可申请"
                                    }
                                  >
                                    —
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-1">
              <ClipboardCheck size={18} className="text-navy-600" />
              审批流程
            </h3>
            <div className="pt-4">
              <Timeline application={application} />
            </div>
          </div>

          {application.rejection && (
            <div className="card p-6 border border-rose-100 bg-rose-50/30">
              <h3 className="section-title mb-3">
                <XCircle size={18} className="text-rose-600" />
                驳回原因
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <User size={12} />
                  <span>驳回人：{application.rejection.rejectedBy}</span>
                  <span className="mx-1 text-slate-300">·</span>
                  <span>
                    {formatDateTime(application.rejection.rejectedAt)}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-rose-100 text-sm text-slate-700 leading-relaxed">
                  {application.rejection.reason}
                </div>
              </div>
            </div>
          )}

          {(application.preliminaryReview || application.expertReview) && (
            <div className="card p-6 space-y-5">
              <h3 className="section-title mb-1">
                <Users size={18} className="text-navy-600" />
                评审记录
              </h3>

              {application.preliminaryReview && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={15} className="text-amber-600" />
                      <span className="font-semibold text-sm text-amber-800">初审结果</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(application.preliminaryReview.reviewedAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2.5">
                    评审人：{application.preliminaryReview.reviewer}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">资质分</div>
                      <div className="font-bold text-amber-700">
                        {application.preliminaryReview.qualificationScore}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">合规分</div>
                      <div className="font-bold text-amber-700">
                        {application.preliminaryReview.complianceScore}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-lg p-2 text-center border border-amber-200">
                      <div className="text-[10px] text-slate-500 mb-0.5">综合分</div>
                      <div className="font-bold bg-gradient-to-r from-amber-700 to-teal-700 bg-clip-text text-transparent">
                        {application.preliminaryReview.totalScore?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                  </div>
                  {application.preliminaryReview.recommendedAmount && (
                    <div className="mb-3 flex items-center gap-2 bg-white rounded-lg p-2.5 border border-amber-100">
                      <TrendingUp size={14} className="text-amber-600" />
                      <span className="text-xs text-slate-500">推荐额度：</span>
                      <span className="font-bold text-amber-700 font-display">
                        {formatAmount(application.preliminaryReview.recommendedAmount / 10000)}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {application.preliminaryReview.comment}
                  </div>
                </div>
              )}

              {application.expertReview && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-blue-600" />
                      <span className="font-semibold text-sm text-blue-800">专家评审</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(application.expertReview.reviewedAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2.5">
                    评审人：{application.expertReview.reviewer}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">技术分</div>
                      <div className="font-bold text-blue-700">
                        {application.expertReview.technicalScore}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">可行分</div>
                      <div className="font-bold text-blue-700">
                        {application.expertReview.feasibilityScore}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-blue-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">经济分</div>
                      <div className="font-bold text-blue-700">
                        {application.expertReview.economicScore}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-2 text-center border border-blue-200">
                      <div className="text-[10px] text-slate-500 mb-0.5">综合分</div>
                      <div className="font-bold bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
                        {application.expertReview.totalScore?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                  </div>
                  {application.expertReview.recommendedAmount && (
                    <div className="mb-3 flex items-center gap-2 bg-white rounded-lg p-2.5 border border-blue-100">
                      <TrendingUp size={14} className="text-blue-600" />
                      <span className="text-xs text-slate-500">推荐额度：</span>
                      <span className="font-bold text-blue-700 font-display">
                        {formatAmount(application.expertReview.recommendedAmount / 10000)}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {application.expertReview.comment}
                  </div>
                </div>
              )}

              {application.approval && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span className="font-semibold text-sm text-emerald-800">
                        立项决策
                      </span>
                      {application.status === 'queued' && (
                        <span className="chip bg-violet-50 text-violet-700 border border-violet-200 text-[10px]">
                          排队第 {application.approval.queuePosition}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(application.approval.approvedAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    决策人：{application.approval.approver}
                  </div>
                  {application.approvedAmount && (
                    <div className="mb-3 flex items-center gap-2 bg-white rounded-lg p-2.5 border border-emerald-100">
                      <DollarSign size={14} className="text-emerald-600" />
                      <span className="text-xs text-slate-500">核定额度：</span>
                      <span className="font-bold text-emerald-700 font-display">
                        {formatAmount(application.approvedAmount / 10000)}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {application.approval.comment}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalShell
        open={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        title={selectedMilestone ? `${selectedMilestone.name} - 拨付详情` : ''}
      >
        {selectedMilestone && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
              <div className={`flex items-center gap-2 ${selectedMilestone.status === 'pending' ? '' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedMilestone.status !== 'pending' && selectedMilestone.status !== 'requested'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedMilestone.status === 'requested'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedMilestone.status !== 'pending' && selectedMilestone.status !== 'requested' ? '✓' : '1'}
                </span>
                申请
              </div>
              <ChevronRight size={16} className="text-slate-300" />
              <div className={`flex items-center gap-2 ${selectedMilestone.status === 'approved' || selectedMilestone.status === 'paid' ? 'text-emerald-700' : selectedMilestone.status === 'requested' ? 'font-semibold text-amber-700' : selectedMilestone.status === 'rejected' ? 'text-rose-700' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedMilestone.status === 'approved' || selectedMilestone.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedMilestone.status === 'requested'
                    ? 'bg-amber-100 text-amber-700'
                    : selectedMilestone.status === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {selectedMilestone.status === 'approved' || selectedMilestone.status === 'paid' ? '✓' : selectedMilestone.status === 'rejected' ? '✗' : '2'}
                </span>
                审核
              </div>
              <ChevronRight size={16} className="text-slate-300" />
              <div className={`flex items-center gap-2 ${selectedMilestone.status === 'paid' ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedMilestone.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {selectedMilestone.status === 'paid' ? '✓' : '3'}
                </span>
                放款
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-navy-50 to-teal-50 border border-navy-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-navy-800">
                  {selectedMilestone.name}
                </div>
                <span className={`chip border ${msColor(selectedMilestone.status)}`}>
                  {msLabel(selectedMilestone.status)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/60">
                <div>
                  <div className="text-xs text-slate-500 mb-1">申请拨付金额</div>
                  <div className="text-2xl font-bold font-display bg-gradient-to-r from-navy-700 to-teal-600 bg-clip-text text-transparent">
                    {formatAmount(selectedMilestone.amount / 10000)}
                  </div>
                </div>
                {selectedMilestone.paidAmount && (
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">实际到账金额</div>
                    <div className="text-xl font-semibold text-emerald-700 font-display">
                      {formatAmount(selectedMilestone.paidAmount / 10000)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedMilestone.requestDate && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <Clock size={16} />
                  申请信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">申请时间</div>
                    <div className="font-medium text-navy-800">{formatDateTime(selectedMilestone.requestDate)}</div>
                  </div>
                </div>
                {selectedMilestone.requestRemark && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">申请说明</div>
                    <div className="text-sm text-slate-700">{selectedMilestone.requestRemark}</div>
                  </div>
                )}
              </div>
            )}

            {selectedMilestone.reviewDate && (
              <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <FileCheck size={16} />
                  审核信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">审核人</div>
                    <div className="font-medium text-navy-800">{selectedMilestone.reviewer || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">审核时间</div>
                    <div className="font-medium text-navy-800">{formatDateTime(selectedMilestone.reviewDate)}</div>
                  </div>
                </div>
                {selectedMilestone.reviewComment && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">审核意见</div>
                    <div className="text-sm text-slate-700">{selectedMilestone.reviewComment}</div>
                  </div>
                )}
              </div>
            )}

            {selectedMilestone.paidDate && (
              <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <DollarSign size={16} />
                  放款信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">放款人</div>
                    <div className="font-medium text-navy-800">{selectedMilestone.approver || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">放款时间</div>
                    <div className="font-medium text-navy-800">{formatDateTime(selectedMilestone.paidDate)}</div>
                  </div>
                </div>
                {selectedMilestone.approveComment && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">审批意见</div>
                    <div className="text-sm text-slate-700">{selectedMilestone.approveComment}</div>
                  </div>
                )}
                {selectedMilestone.remark && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">备注</div>
                    <div className="text-sm text-slate-700">{selectedMilestone.remark}</div>
                  </div>
                )}
              </div>
            )}

            {selectedMilestone.rejectDate && (
              <div className="space-y-3 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                  <Ban size={16} />
                  退回信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">退回人</div>
                    <div className="font-medium text-navy-800">{selectedMilestone.rejector || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">退回时间</div>
                    <div className="font-medium text-navy-800">{formatDateTime(selectedMilestone.rejectDate)}</div>
                  </div>
                </div>
                {selectedMilestone.rejectReason && (
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">退回原因</div>
                    <div className="text-sm text-slate-700">{selectedMilestone.rejectReason}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ModalShell>
    </div>
  );
}
