import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  X,
  UploadCloud,
  Building2,
  ShieldCheck,
  Target,
  Wallet,
  Paperclip,
  FileText,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "../../store";
import DirectionIcon from "../../components/DirectionIcon";
import { directionLabel } from "../../utils/format";
import type { SupportDirection } from "../../../shared/types";

interface Attachment {
  name: string;
  url: string;
  size: number;
}

interface DirectionOption {
  key: SupportDirection;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
}

const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    key: "testing_capability",
    title: "检测能力提升",
    description:
      "支持企业建设专业检测实验室、认证测试平台，提升低空飞行器、核心零部件及系统的检测认证能力，降低企业外部检测成本。",
    icon: ShieldCheck,
  },
  {
    key: "tech_breakthrough",
    title: "核心技术攻关",
    description:
      '支持企业突破低空经济产业链核心关键技术，包括飞控系统、动力系统、通信导航、新材料、芯片等"卡脖子"技术方向。',
    icon: Target,
  },
  {
    key: "production_expansion",
    title: "产线扩建",
    description:
      "支持企业扩大产能、建设智能化生产线，完善供应链体系，推动低空经济产业规模化、集群化发展。",
    icon: Building2,
  },
];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export default function ApplyPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCompany =
    "companyName" in (user || {})
      ? ((user as { companyName?: string })?.companyName ?? "")
      : "";
  const defaultContact =
    "contactPerson" in (user || {})
      ? ((user as { contactPerson?: string })?.contactPerson ?? "")
      : "";

  const [companyName, setCompanyName] = useState(defaultCompany);
  const [unifiedCreditCode, setUnifiedCreditCode] = useState("");
  const [contactPerson, setContactPerson] = useState(defaultContact);
  const [contactPhone, setContactPhone] = useState("");
  const [direction, setDirection] = useState<SupportDirection | null>(null);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [purposeDescription, setPurposeDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles: Attachment[] = Array.from(files).map((f) => ({
      name: f.name,
      url: `/uploads/attachments/${Date.now()}-${f.name}`,
      size: f.size,
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "companyName":
        if (!value.trim()) return "请填写企业名称";
        return "";
      case "unifiedCreditCode":
        if (!value.trim()) return "请填写统一社会信用代码";
        if (
          !/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(
            value.trim(),
          )
        ) {
          return "统一社会信用代码格式不正确";
        }
        return "";
      case "contactPerson":
        if (!value.trim()) return "请填写联系人姓名";
        return "";
      case "contactPhone":
        if (!value.trim()) return "请填写联系电话";
        if (!/^1[3-9]\d{9}$/.test(value.trim())) return "手机号格式不正确";
        return "";
      case "requestedAmount":
        if (!value.trim()) return "请填写申请额度";
        if (Number(value) <= 0) return "申请额度必须大于0";
        if (Number(value) > 50000) return "单笔申请额度不超过5亿元";
        return "";
      case "purposeDescription":
        if (!value.trim()) return "请填写用途说明";
        if (value.trim().length < 20) return "用途说明至少20字";
        return "";
      default:
        return "";
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const companyNameError = validateField("companyName", companyName);
    if (companyNameError) e.companyName = companyNameError;
    const creditCodeError = validateField(
      "unifiedCreditCode",
      unifiedCreditCode,
    );
    if (creditCodeError) e.unifiedCreditCode = creditCodeError;
    const contactPersonError = validateField("contactPerson", contactPerson);
    if (contactPersonError) e.contactPerson = contactPersonError;
    const contactPhoneError = validateField("contactPhone", contactPhone);
    if (contactPhoneError) e.contactPhone = contactPhoneError;
    if (!direction) e.direction = "请选择扶持方向";
    const amountError = validateField("requestedAmount", requestedAmount);
    if (amountError) e.requestedAmount = amountError;
    const purposeError = validateField(
      "purposeDescription",
      purposeDescription,
    );
    if (purposeError) e.purposeDescription = purposeError;
    if (attachments.length === 0) e.attachments = "请至少上传一份佐证材料";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          unifiedCreditCode: unifiedCreditCode.trim(),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim(),
          direction,
          requestedAmount: Number(requestedAmount) * 10000,
          purposeDescription: purposeDescription.trim(),
          attachments,
        }),
      });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        alert("申报提交成功！");
        navigate(`/enterprise/applications/${data.data.id}`);
      } else {
        alert(data.message || "提交失败，请稍后重试");
      }
    } catch {
      alert("提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/enterprise")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-navy-600 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-navy-800">新建申报</h1>
            <p className="text-slate-500 mt-1 text-sm">
              请认真填写申报信息，所有带 * 号字段均为必填项。
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 md:p-7 space-y-8">
        <div>
          <h3 className="section-title mb-5">
            <Building2 size={20} className="text-navy-600" />
            基本信息
          </h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label">
                企业名称 <span className="text-rose-500">*</span>
              </label>
              <input
                className={`input ${errors.companyName ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="请输入企业全称"
              />
              {errors.companyName && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.companyName}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                统一社会信用代码 <span className="text-rose-500">*</span>
              </label>
              <input
                className={`input font-mono ${errors.unifiedCreditCode ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
                value={unifiedCreditCode}
                onChange={(e) =>
                  setUnifiedCreditCode(e.target.value.toUpperCase())
                }
                placeholder="18位统一社会信用代码"
                maxLength={18}
              />
              {errors.unifiedCreditCode && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.unifiedCreditCode}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                联系人 <span className="text-rose-500">*</span>
              </label>
              <input
                className={`input ${errors.contactPerson ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="请输入联系人姓名"
              />
              {errors.contactPerson && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.contactPerson}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                联系电话 <span className="text-rose-500">*</span>
              </label>
              <input
                className={`input font-mono ${errors.contactPhone ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
                value={contactPhone}
                onChange={(e) =>
                  setContactPhone(
                    e.target.value.replace(/\D/g, "").slice(0, 11),
                  )
                }
                placeholder="请输入手机号"
              />
              {errors.contactPhone && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.contactPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="divider" />

        <div>
          <h3 className="section-title mb-5">
            <Target size={20} className="text-navy-600" />
            扶持方向 <span className="text-rose-500">*</span>
          </h3>
          {errors.direction && (
            <p className="mb-3 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.direction}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {DIRECTION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = direction === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDirection(opt.key)}
                  className={`text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selected
                      ? "border-teal-500 bg-teal-50/50 shadow-lg shadow-teal-500/10"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-card"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      selected
                        ? "bg-teal-500 text-white"
                        : "bg-navy-50 text-navy-600"
                    }`}
                  >
                    <DirectionIcon direction={opt.key} size={22} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`font-bold text-base ${selected ? "text-teal-700" : "text-navy-800"}`}
                    >
                      {directionLabel(opt.key)}
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="divider" />

        <div>
          <h3 className="section-title mb-5">
            <Wallet size={20} className="text-navy-600" />
            资金申请
          </h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label">
                申请额度（万元） <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  className={`input pr-12 font-semibold text-lg ${
                    errors.requestedAmount
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : ""
                  }`}
                  value={requestedAmount}
                  onChange={(e) =>
                    setRequestedAmount(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="请输入申请金额"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  万元
                </span>
              </div>
              {errors.requestedAmount && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.requestedAmount}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-400">
                单笔申请额度最高不超过5亿元
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="label">
              用途说明 <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              className={`input resize-none ${
                errors.purposeDescription
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                  : ""
              }`}
              value={purposeDescription}
              onChange={(e) => {
                const val = e.target.value;
                setPurposeDescription(val);
                if (errors.purposeDescription) {
                  const err = validateField("purposeDescription", val);
                  if (!err) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.purposeDescription;
                      return next;
                    });
                  }
                }
              }}
              placeholder="请详细描述项目背景、主要建设内容、预期经济与社会效益、产业带动作用等（建议不少于100字）"
              maxLength={2000}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.purposeDescription ? (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.purposeDescription}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  建议描述清楚项目价值与资金使用计划
                </p>
              )}
              <p
                className={`text-xs font-mono ${
                  purposeDescription.trim().length < 20
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                {purposeDescription.trim().length < 20
                  ? `还需 ${20 - purposeDescription.trim().length} 字达到最低要求`
                  : `${purposeDescription.trim().length} / 2000`}
              </p>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div>
          <h3 className="section-title mb-5">
            <Paperclip size={20} className="text-navy-600" />
            佐证材料 <span className="text-rose-500">*</span>
          </h3>
          {errors.attachments && (
            <p className="mb-3 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.attachments}
            </p>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-8 md:p-10 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UploadCloud size={26} className="text-teal-500" />
            </div>
            <div className="font-semibold text-navy-800 mb-1">
              点击选择文件，或拖拽至此处上传
            </div>
            <p className="text-sm text-slate-500">
              支持 PDF、Word、Excel、图片格式，单个文件不超过 50MB
            </p>
            <p className="text-xs text-slate-400 mt-2">
              建议上传：营业执照、项目可行性报告、财务报表、专利证书、资质证明等
            </p>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white group hover:border-slate-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-navy-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-navy-800 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate("/enterprise")}
            className="btn-outline"
          >
            <X size={16} />
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-teal"
          >
            <Send size={16} />
            {submitting ? "提交中..." : "提交申报"}
          </button>
        </div>
      </div>
    </div>
  );
}
