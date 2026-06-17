import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SearchCheck,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  AlertTriangle,
  Ban,
  Building2,
  Phone,
  FileText,
  Award,
} from "lucide-react";
import type { Application, FundPool } from "../../../shared/types";
import { useAppStore } from "../../store";
import {
  formatAmount,
  formatDateTime,
  directionLabel,
} from "../../utils/format";
import { useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";
import DirectionIcon from "../../components/DirectionIcon";
import Timeline from "../../components/Timeline";
import ModalShell from "../../components/ModalShell";

type TabKey = "pending_preliminary" | "in_review" | "pending_approval" | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending_preliminary", label: "待初审" },
  { key: "in_review", label: "评审中（待专家）" },
  { key: "pending_approval", label: "待立项" },
  { key: "all", label: "全部" },
];

function ScoreSlider({
  label,
  value,
  onChange,
  color = "navy",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: "navy" | "blue" | "emerald" | "amber" | "teal" | "rose";
}) {
  const colorMap: Record<string, string> = {
    navy: "accent-navy-600 text-navy-600",
    blue: "accent-blue-600 text-blue-600",
    emerald: "accent-emerald-600 text-emerald-600",
    amber: "accent-amber-600 text-amber-600",
    teal: "accent-teal-600 text-teal-600",
    rose: "accent-rose-600 text-rose-600",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span
          className={`text-2xl font-bold font-display ${colorMap[color]?.split(" ")[1] || "text-navy-600"}`}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer ${colorMap[color]?.split(" ")[0] || "accent-navy-600"}`}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    fundPool,
    loadFundPool,
    setFundPool,
    setApplications,
    getApplications,
  } = useAppStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [applications, setAppsState] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const t = searchParams.get("tab");
    return (TABS.find((x) => x.key === t)?.key ||
      "pending_preliminary") as TabKey;
  });
  const [expandedId, setExpandedId] = useState<string | null>(
    searchParams.get("highlight") || null,
  );
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [pool, setPool] = useState<FundPool | null>(fundPool);

  const [preliminary, setPreliminary] = useState({
    reviewer: (user && "name" in user ? user.name : "") || "",
    qualificationScore: 80,
    complianceScore: 80,
    recommendedAmount: 0,
    pass: true,
    comment: "",
  });
  const [expert, setExpert] = useState({
    reviewer: (user && "name" in user ? user.name : "") || "",
    technicalScore: 80,
    feasibilityScore: 80,
    economicScore: 80,
    recommendedAmount: 0,
    pass: true,
    comment: "",
  });
  const [approval, setApproval] = useState({
    approver: (user && "name" in user ? user.name : "") || "",
    approvedAmount: 0,
    pass: true,
    comment: "",
  });
  const [rejection, setRejection] = useState({
    rejectedBy: (user && "name" in user ? user.name : "") || "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const reviewerName = user && "name" in user ? user.name : "评审管理员";

  useEffect(() => {
    setActiveTab(
      (TABS.find((x) => x.key === searchParams.get("tab"))?.key ||
        "pending_preliminary") as TabKey,
    );
    const hl = searchParams.get("highlight");
    if (hl) setExpandedId(hl);
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!fundPool) await loadFundPool();

      const [appsRes, poolRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/fund-pool"),
      ]);
      if (appsRes.ok) {
        const json = await appsRes.json();
        const data: Application[] = json.data || [];
        setAppsState(data);
        setApplications(data);
      }
      if (poolRes.ok) {
        const json = await poolRes.json();
        const data: FundPool = json.data;
        setPool(data);
        setFundPool(data);
      }
    } catch {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabCounts = useMemo(() => {
    const apps =
      getApplications().length > 0 ? getApplications() : applications;
    return {
      pending_preliminary: apps.filter(
        (a) => a.status === "pending_preliminary",
      ).length,
      in_review: apps.filter((a) => a.status === "in_review" && !a.expertReview)
        .length,
      pending_approval: apps.filter(
        (a) => a.status === "in_review" && a.expertReview,
      ).length,
      all: apps.length,
    };
  }, [applications, getApplications]);

  const filtered = useMemo(() => {
    const apps =
      getApplications().length > 0 ? getApplications() : applications;
    switch (activeTab) {
      case "pending_preliminary":
        return apps.filter((a) => a.status === "pending_preliminary");
      case "in_review":
        return apps.filter((a) => a.status === "in_review" && !a.expertReview);
      case "pending_approval":
        return apps.filter((a) => a.status === "in_review" && a.expertReview);
      case "all":
      default:
        return apps;
    }
  }, [activeTab, applications, getApplications]);

  const allocatable = useMemo(() => {
    if (!pool) return 0;
    return pool.total - (pool.approvedTotal - pool.queuedTotal);
  }, [pool]);

  const queuePosition = useMemo(() => {
    const apps =
      getApplications().length > 0 ? getApplications() : applications;
    return apps.filter((a) => a.status === "queued").length + 1;
  }, [applications, getApplications]);

  const isInsufficient =
    activeTab === "pending_approval" &&
    approval.approvedAmount > 0 &&
    approval.approvedAmount > allocatable;

  const openReview = (app: Application) => {
    setReviewingApp(app);
    setPreliminary({
      reviewer: reviewerName,
      qualificationScore: 80,
      complianceScore: 80,
      recommendedAmount: app.requestedAmount,
      pass: true,
      comment: "",
    });
    setExpert({
      reviewer: reviewerName,
      technicalScore: 80,
      feasibilityScore: 80,
      economicScore: 80,
      recommendedAmount: app.requestedAmount,
      pass: true,
      comment: "",
    });
    setApproval({
      approver: reviewerName,
      approvedAmount: app.requestedAmount,
      pass: true,
      comment: "",
    });
  };

  const openReject = (app: Application) => {
    setRejectingApp(app);
    setRejection({ rejectedBy: reviewerName, reason: "" });
  };

  const doSubmit = async (
    endpoint: string,
    body: Record<string, unknown>,
    successMsg: string,
  ) => {
    if (!reviewingApp) return;
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast(successMsg, "success");
        setReviewingApp(null);
        await fetchData();
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.message || "提交失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPreliminary = () => {
    if (!preliminary.comment.trim()) {
      showToast("请填写评审意见", "error");
      return;
    }
    doSubmit(
      `/api/applications/${reviewingApp!.id}/preliminary-review`,
      preliminary,
      preliminary.pass ? "初审通过，已进入专家评审阶段" : "初审已驳回",
    );
  };

  const submitExpert = () => {
    if (!expert.comment.trim()) {
      showToast("请填写评审意见", "error");
      return;
    }
    doSubmit(
      `/api/applications/${reviewingApp!.id}/expert-review`,
      expert,
      expert.pass ? "专家评审通过，可进行立项" : "专家评审已驳回",
    );
  };

  const submitApprove = () => {
    if (!approval.comment.trim()) {
      showToast("请填写审批意见", "error");
      return;
    }
    if (
      approval.pass &&
      (!approval.approvedAmount || approval.approvedAmount <= 0)
    ) {
      showToast("请填写核定额度", "error");
      return;
    }
    let msg = "立项已驳回";
    if (approval.pass) {
      msg = isInsufficient
        ? `额度不足，已进入排队（排位第${queuePosition}位）`
        : "立项成功，额度已预留";
    }
    doSubmit(`/api/applications/${reviewingApp!.id}/approve`, approval, msg);
  };

  const submitReject = async () => {
    if (!rejectingApp) return;
    if (!rejection.reason.trim()) {
      showToast("请填写驳回原因", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${rejectingApp.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rejection),
      });
      if (res.ok) {
        showToast("已驳回该申报", "success");
        setRejectingApp(null);
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

  const currentStep = reviewingApp
    ? reviewingApp.status === "pending_preliminary"
      ? "preliminary"
      : reviewingApp.status === "in_review" && !reviewingApp.expertReview
        ? "expert"
        : reviewingApp.status === "in_review" && reviewingApp.expertReview
          ? "approval"
          : "view"
    : "view";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">申报评审</h1>
        <p className="text-slate-500 mt-1">
          对企业申报进行初审、专家评审及立项决策
        </p>
      </div>

      <div className="card p-1.5 flex flex-wrap gap-1 bg-slate-50">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                const p = new URLSearchParams(searchParams);
                p.set("tab", tab.key);
                p.delete("highlight");
                setSearchParams(p);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white text-navy-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-navy-700 hover:bg-white/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  active
                    ? "bg-gradient-to-r from-navy-600 to-teal-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <SearchCheck size={48} className="mx-auto mb-3 opacity-40" />
            <div>暂无数据</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-xs text-slate-500">
                  <th className="text-left font-medium py-3 px-4 w-10"></th>
                  <th className="text-left font-medium py-3 px-4">公司名称</th>
                  <th className="text-left font-medium py-3 px-4">支持方向</th>
                  <th className="text-right font-medium py-3 px-4">申请金额</th>
                  <th className="text-left font-medium py-3 px-4">提交时间</th>
                  <th className="text-center font-medium py-3 px-4">状态</th>
                  <th className="text-right font-medium py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const expanded = expandedId === app.id;
                  const canReview =
                    app.status === "pending_preliminary" ||
                    (app.status === "in_review" && !app.expertReview) ||
                    (app.status === "in_review" && !!app.expertReview);
                  const canReject =
                    app.status !== "completed" && app.status !== "rejected";
                  return (
                    <>
                      <tr
                        key={app.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          expanded ? "bg-navy-50/30" : ""
                        }`}
                        onClick={() => setExpandedId(expanded ? null : app.id)}
                      >
                        <td className="py-3 px-4">
                          {expanded ? (
                            <ChevronUp size={16} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <DirectionIcon
                              direction={app.direction}
                              size={18}
                              className="text-navy-600"
                            />
                            <span className="font-medium text-navy-800">
                              {app.companyName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600">
                            {directionLabel(app.direction)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-navy-700 font-display">
                            {formatAmount(app.requestedAmount / 10000)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500 font-mono">
                            {formatDateTime(app.submittedAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={app.status} />
                        </td>
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {canReview && (
                              <button
                                onClick={() => openReview(app)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-navy-600 to-teal-500 text-white hover:shadow-md hover:-translate-y-0.5 transition-all"
                              >
                                <SearchCheck size={14} />
                                评审
                              </button>
                            )}
                            {canReject && (
                              <button
                                onClick={() => openReject(app)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 hover:-translate-y-0.5 transition-all"
                              >
                                <Ban size={14} />
                                驳回
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr
                          className="bg-slate-50/50 border-b border-slate-100"
                          key={`${app.id}-detail`}
                        >
                          <td colSpan={7} className="py-5 px-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-1 space-y-3">
                                <div className="text-sm font-semibold text-navy-800 flex items-center gap-2">
                                  <Building2 size={16} /> 企业基本信息
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      统一信用代码
                                    </span>
                                    <span className="text-navy-700 font-mono text-xs">
                                      {app.unifiedCreditCode}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">
                                      联系人
                                    </span>
                                    <span className="text-navy-700">
                                      {app.contactPerson}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Phone size={12} /> 联系电话
                                    </span>
                                    <span className="text-navy-700 font-mono">
                                      {app.contactPhone}
                                    </span>
                                  </div>
                                  {app.approvedAmount && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        核定额度
                                      </span>
                                      <span className="text-teal-700 font-bold font-display">
                                        {formatAmount(
                                          app.approvedAmount / 10000,
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="pt-2">
                                  <div className="text-sm font-semibold text-navy-800 flex items-center gap-2 mb-2">
                                    <FileText size={16} /> 附件材料
                                  </div>
                                  <div className="space-y-1">
                                    {app.attachments.map((att) => (
                                      <div
                                        key={att.name}
                                        className="text-xs text-slate-600 px-2 py-1.5 bg-white rounded-lg border border-slate-100 truncate"
                                        title={att.name}
                                      >
                                        📎 {att.name}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="lg:col-span-1">
                                <div className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                                  <Award size={16} /> 项目概述
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                                  {app.purposeDescription}
                                </p>
                                {app.preliminaryReview && (
                                  <div className="mt-4">
                                    <div className="text-xs font-semibold text-amber-700 mb-1.5">
                                      初审意见
                                    </div>
                                    <div className="bg-amber-50/60 rounded-xl p-3 text-xs text-slate-700 border border-amber-100">
                                      <div className="flex gap-4 mb-1.5">
                                        <span>
                                          资格分：
                                          <b className="text-amber-700 font-display">
                                            {
                                              app.preliminaryReview
                                                .qualificationScore
                                            }
                                          </b>
                                        </span>
                                        <span>
                                          合规分：
                                          <b className="text-amber-700 font-display">
                                            {
                                              app.preliminaryReview
                                                .complianceScore
                                            }
                                          </b>
                                        </span>
                                      </div>
                                      <div>{app.preliminaryReview.comment}</div>
                                    </div>
                                  </div>
                                )}
                                {app.expertReview && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-blue-700 mb-1.5">
                                      专家评审意见
                                    </div>
                                    <div className="bg-blue-50/60 rounded-xl p-3 text-xs text-slate-700 border border-blue-100">
                                      <div className="flex gap-3 mb-1.5 flex-wrap">
                                        <span>
                                          技术：
                                          <b className="text-blue-700 font-display">
                                            {app.expertReview.technicalScore}
                                          </b>
                                        </span>
                                        <span>
                                          可行：
                                          <b className="text-blue-700 font-display">
                                            {app.expertReview.feasibilityScore}
                                          </b>
                                        </span>
                                        <span>
                                          经济：
                                          <b className="text-blue-700 font-display">
                                            {app.expertReview.economicScore}
                                          </b>
                                        </span>
                                      </div>
                                      <div>{app.expertReview.comment}</div>
                                    </div>
                                  </div>
                                )}
                                {app.approval && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-emerald-700 mb-1.5">
                                      立项决议
                                    </div>
                                    <div className="bg-emerald-50/60 rounded-xl p-3 text-xs text-slate-700 border border-emerald-100">
                                      {app.approval.queuePosition && (
                                        <div className="mb-1.5 text-amber-600 font-medium">
                                          📋 排队第 {app.approval.queuePosition}{" "}
                                          位
                                        </div>
                                      )}
                                      <div>{app.approval.comment}</div>
                                    </div>
                                  </div>
                                )}
                                {app.rejection && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-rose-700 mb-1.5">
                                      驳回原因
                                    </div>
                                    <div className="bg-rose-50/60 rounded-xl p-3 text-xs text-slate-700 border border-rose-100">
                                      {app.rejection.reason}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="lg:col-span-1">
                                <div className="text-sm font-semibold text-navy-800 mb-3">
                                  进度跟踪
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <Timeline application={app} />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalShell
        open={!!reviewingApp}
        onClose={() => !submitting && setReviewingApp(null)}
        title={reviewingApp ? `评审 - ${reviewingApp.companyName}` : ""}
        maxWidth="max-w-4xl"
      >
        {reviewingApp && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">支持方向</div>
                <div className="font-semibold text-navy-800 flex items-center gap-1.5">
                  <DirectionIcon direction={reviewingApp.direction} size={16} />
                  {directionLabel(reviewingApp.direction)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">申请金额</div>
                <div className="font-bold text-navy-800 font-display text-lg">
                  {formatAmount(reviewingApp.requestedAmount / 10000)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">当前状态</div>
                <StatusBadge status={reviewingApp.status} />
              </div>
            </div>

            {currentStep === "preliminary" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-xs">1</span>
                  </div>
                  初审评审
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    评审人
                  </label>
                  <input
                    value={preliminary.reviewer}
                    onChange={(e) =>
                      setPreliminary({
                        ...preliminary,
                        reviewer: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                    placeholder="请输入评审人姓名"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ScoreSlider
                    label="资格评分"
                    value={preliminary.qualificationScore}
                    onChange={(v) =>
                      setPreliminary({ ...preliminary, qualificationScore: v })
                    }
                    color="amber"
                  />
                  <ScoreSlider
                    label="合规评分"
                    value={preliminary.complianceScore}
                    onChange={(v) =>
                      setPreliminary({ ...preliminary, complianceScore: v })
                    }
                    color="teal"
                  />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        综合评分
                      </div>
                      <div className="text-3xl font-bold font-display bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent">
                        {Math.round(
                          ((preliminary.qualificationScore +
                            preliminary.complianceScore) /
                            2) *
                            10,
                        ) / 10}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">评审结论：</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setPreliminary({ ...preliminary, pass: true })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            preliminary.pass
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          通过
                        </button>
                        <button
                          onClick={() =>
                            setPreliminary({ ...preliminary, pass: false })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            !preliminary.pass
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          不通过
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    （资格分 + 合规分）/ 2，≥60分自动建议通过
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    推荐额度（万元）
                  </label>
                  <input
                    type="number"
                    value={
                      preliminary.recommendedAmount
                        ? preliminary.recommendedAmount / 10000
                        : ""
                    }
                    onChange={(e) =>
                      setPreliminary({
                        ...preliminary,
                        recommendedAmount: Number(e.target.value) * 10000,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all font-display font-bold text-navy-700"
                    placeholder={String(reviewingApp.requestedAmount / 10000)}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    申请金额：
                    <span className="font-semibold">
                      {formatAmount(reviewingApp.requestedAmount / 10000)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    评审意见
                  </label>
                  <textarea
                    rows={4}
                    value={preliminary.comment}
                    onChange={(e) =>
                      setPreliminary({
                        ...preliminary,
                        comment: e.target.value,
                      })
                    }
                    placeholder="请详细说明初审意见，包括企业资质评估、材料合规性等..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {!preliminary.pass && (
                    <div className="flex-1 text-rose-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      将直接驳回此申报
                    </div>
                  )}
                  <button
                    onClick={() => setReviewingApp(null)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitPreliminary}
                    disabled={submitting}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 ${
                      preliminary.pass
                        ? "bg-gradient-to-r from-navy-600 to-teal-500"
                        : "bg-gradient-to-r from-rose-600 to-rose-500"
                    }`}
                  >
                    <Send size={16} />
                    {submitting
                      ? "提交中..."
                      : preliminary.pass
                        ? "提交初审"
                        : "确认驳回"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === "expert" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs">2</span>
                  </div>
                  专家评审
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    评审人（专家组）
                  </label>
                  <input
                    value={expert.reviewer}
                    onChange={(e) =>
                      setExpert({ ...expert, reviewer: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                    placeholder="请输入评审人或专家组名称"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <ScoreSlider
                    label="技术评分"
                    value={expert.technicalScore}
                    onChange={(v) =>
                      setExpert({ ...expert, technicalScore: v })
                    }
                    color="blue"
                  />
                  <ScoreSlider
                    label="可行性评分"
                    value={expert.feasibilityScore}
                    onChange={(v) =>
                      setExpert({ ...expert, feasibilityScore: v })
                    }
                    color="emerald"
                  />
                  <ScoreSlider
                    label="经济性评分"
                    value={expert.economicScore}
                    onChange={(v) => setExpert({ ...expert, economicScore: v })}
                    color="amber"
                  />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        综合评分
                      </div>
                      <div className="text-3xl font-bold font-display bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {Math.round(
                          ((expert.technicalScore +
                            expert.feasibilityScore +
                            expert.economicScore) /
                            3) *
                            10,
                        ) / 10}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">评审结论：</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpert({ ...expert, pass: true })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            expert.pass
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          通过
                        </button>
                        <button
                          onClick={() => setExpert({ ...expert, pass: false })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            !expert.pass
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          不通过
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    （技术分 + 可行分 + 经济分）/ 3，≥60分自动建议通过
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    推荐额度（万元）
                  </label>
                  <input
                    type="number"
                    value={
                      expert.recommendedAmount
                        ? expert.recommendedAmount / 10000
                        : ""
                    }
                    onChange={(e) =>
                      setExpert({
                        ...expert,
                        recommendedAmount: Number(e.target.value) * 10000,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all font-display font-bold text-navy-700"
                    placeholder={String(reviewingApp.requestedAmount / 10000)}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    申请金额：
                    <span className="font-semibold">
                      {formatAmount(reviewingApp.requestedAmount / 10000)}
                    </span>
                    {reviewingApp.preliminaryReview?.recommendedAmount && (
                      <span className="ml-3">
                        初审推荐：
                        <span className="font-semibold text-amber-600">
                          {formatAmount(
                            reviewingApp.preliminaryReview.recommendedAmount /
                              10000,
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    评审意见
                  </label>
                  <textarea
                    rows={4}
                    value={expert.comment}
                    onChange={(e) =>
                      setExpert({ ...expert, comment: e.target.value })
                    }
                    placeholder="请从技术方案、实施可行性、经济效益等方面阐述综合评价..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {!expert.pass && (
                    <div className="flex-1 text-rose-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      将直接驳回此申报
                    </div>
                  )}
                  <button
                    onClick={() => setReviewingApp(null)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitExpert}
                    disabled={submitting}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 ${
                      expert.pass
                        ? "bg-gradient-to-r from-blue-600 to-teal-500"
                        : "bg-gradient-to-r from-rose-600 to-rose-500"
                    }`}
                  >
                    <Send size={16} />
                    {submitting
                      ? "提交中..."
                      : expert.pass
                        ? "提交专家评审"
                        : "确认驳回"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === "approval" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xs">3</span>
                  </div>
                  立项决策
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    审批人
                  </label>
                  <input
                    value={approval.approver}
                    onChange={(e) =>
                      setApproval({ ...approval, approver: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                    placeholder="请输入审批人姓名"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-xs text-slate-500 mb-1">
                      初审综合分
                    </div>
                    <div className="text-xl font-bold font-display text-amber-700">
                      {reviewingApp.preliminaryReview?.totalScore ?? "-"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      推荐额度：
                      <span className="font-semibold text-amber-600">
                        {reviewingApp.preliminaryReview?.recommendedAmount
                          ? formatAmount(
                              reviewingApp.preliminaryReview.recommendedAmount /
                                10000,
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-xs text-slate-500 mb-1">
                      专家综合分
                    </div>
                    <div className="text-xl font-bold font-display text-blue-700">
                      {reviewingApp.expertReview?.totalScore ?? "-"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      推荐额度：
                      <span className="font-semibold text-blue-600">
                        {reviewingApp.expertReview?.recommendedAmount
                          ? formatAmount(
                              reviewingApp.expertReview.recommendedAmount /
                                10000,
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-navy-50 to-teal-50 border border-navy-100">
                    <div className="text-xs text-slate-500 mb-1">
                      当前可分配额度
                    </div>
                    <div className="text-2xl font-bold font-display bg-gradient-to-r from-navy-700 to-teal-600 bg-clip-text text-transparent">
                      {formatAmount(allocatable / 10000)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      = 总额度 - 已立项(不含排队)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-start gap-3 py-2">
                  <span className="text-sm text-slate-600">立项结论：</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApproval({ ...approval, pass: true })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        approval.pass
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      同意立项
                    </button>
                    <button
                      onClick={() => setApproval({ ...approval, pass: false })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !approval.pass
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      不予立项
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    核定额度（万元）
                  </label>
                  <input
                    type="number"
                    value={
                      approval.approvedAmount
                        ? approval.approvedAmount / 10000
                        : ""
                    }
                    onChange={(e) =>
                      setApproval({
                        ...approval,
                        approvedAmount: Number(e.target.value) * 10000,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all font-display font-bold text-navy-700"
                    placeholder={String(reviewingApp.requestedAmount / 10000)}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    申请金额：
                    <span className="font-semibold">
                      {formatAmount(reviewingApp.requestedAmount / 10000)}
                    </span>
                    {reviewingApp.expertReview?.recommendedAmount && (
                      <span className="ml-3">
                        专家推荐：
                        <span className="font-semibold text-blue-600">
                          {formatAmount(
                            reviewingApp.expertReview.recommendedAmount / 10000,
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                {isInsufficient && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">额度不足提示</div>
                      <div>
                        核定额度超过当前可分配额度（
                        <b className="font-display">
                          {formatAmount(
                            (approval.approvedAmount - allocatable) / 10000,
                          )}
                        </b>
                        ），立项后项目将进入排队序列，队列位次第
                        <b className="font-display text-amber-700">
                          {" "}
                          {queuePosition}{" "}
                        </b>
                        位
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    审批意见
                  </label>
                  <textarea
                    rows={4}
                    value={approval.comment}
                    onChange={(e) =>
                      setApproval({ ...approval, comment: e.target.value })
                    }
                    placeholder="请说明立项理由、额度核定依据、后续监管要求等..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {!approval.pass && (
                    <div className="flex-1 text-rose-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      将直接驳回此申报
                    </div>
                  )}
                  {approval.pass && isInsufficient && (
                    <div className="flex-1 text-amber-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      将进入排队（队列第 {queuePosition} 位）
                    </div>
                  )}
                  <button
                    onClick={() => setReviewingApp(null)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitApprove}
                    disabled={submitting}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 ${
                      !approval.pass
                        ? "bg-gradient-to-r from-rose-600 to-rose-500"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500"
                    }`}
                  >
                    <Send size={16} />
                    {submitting
                      ? "提交中..."
                      : !approval.pass
                        ? "确认驳回"
                        : isInsufficient
                          ? "提交排队立项"
                          : "提交立项"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === "view" && (
              <div className="text-center py-8 text-slate-500">
                当前状态不支持评审操作
              </div>
            )}
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={!!rejectingApp}
        onClose={() => !submitting && setRejectingApp(null)}
        title={rejectingApp ? `驳回 - ${rejectingApp.companyName}` : ""}
        maxWidth="max-w-xl"
      >
        {rejectingApp && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
              <AlertTriangle
                size={20}
                className="text-rose-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-rose-800">
                <div className="font-semibold mb-1">确认驳回此申报？</div>
                <div>驳回后该申报将无法继续流程，请谨慎操作。</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                操作人
              </label>
              <input
                value={rejection.rejectedBy}
                onChange={(e) =>
                  setRejection({ ...rejection, rejectedBy: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                驳回原因
              </label>
              <textarea
                rows={5}
                value={rejection.reason}
                onChange={(e) =>
                  setRejection({ ...rejection, reason: e.target.value })
                }
                placeholder="请详细说明驳回原因，包括不符合条件的具体条款、需要补充的材料等..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectingApp(null)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={submitReject}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                <Ban size={16} />
                {submitting ? "提交中..." : "确认驳回"}
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}
