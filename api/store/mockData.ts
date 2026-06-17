import type {
  Application,
  Transaction,
  FundPool,
} from "../../shared/types/index.js";

export const FUND_POOL_TOTAL = 500_000_000;

export const mockFundPool: FundPool = {
  total: FUND_POOL_TOTAL,
  approvedTotal: 0,
  disbursedTotal: 0,
  remaining: FUND_POOL_TOTAL,
  queuedTotal: 0,
  byDirection: {
    testing_capability: { approved: 0, disbursed: 0, count: 0 },
    tech_breakthrough: { approved: 0, disbursed: 0, count: 0 },
    production_expansion: { approved: 0, disbursed: 0, count: 0 },
  },
};

const genId = () => Math.random().toString(36).slice(2, 10);

const createMilestones = (
  approvedAmount: number,
  statuses: ("pending" | "requested" | "approved" | "paid")[],
  options?: {
    requestDates?: (string | undefined)[];
    approveDates?: (string | undefined)[];
    paidDates?: (string | undefined)[];
  },
) => {
  const percentages = [30, 40, 30];
  const names = [
    "项目启动与方案设计",
    "核心研发与样机试制",
    "验收交付与成果转化",
  ];
  return percentages.map((p, i) => ({
    id: genId(),
    name: names[i],
    percentage: p,
    amount: Math.round((approvedAmount * p) / 100),
    status: statuses[i],
    requestDate: options?.requestDates?.[i],
    approveDate: options?.approveDates?.[i],
    paidDate: options?.paidDates?.[i],
  }));
};

export const mockApplications: Application[] = [
  {
    id: genId(),
    companyName: "天航智造科技有限公司",
    unifiedCreditCode: "91110108MA01ABCD12",
    contactPerson: "张明远",
    contactPhone: "13800138001",
    direction: "testing_capability",
    requestedAmount: 80_000_000,
    purposeDescription:
      "建设低空飞行器综合测试平台，包括风洞测试、电磁兼容测试、飞行性能测试等实验室，提升区域低空经济产业检测能力。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/1.pdf",
        size: 2_456_000,
      },
      {
        name: "项目可行性报告.pdf",
        url: "/uploads/attachments/2.pdf",
        size: 5_123_000,
      },
      {
        name: "财务报表.xlsx",
        url: "/uploads/attachments/3.xlsx",
        size: 876_000,
      },
    ],
    status: "pending_preliminary",
    submittedAt: "2026-06-10T09:30:00.000Z",
    milestones: [],
  },
  {
    id: genId(),
    companyName: "云翼无人机系统股份有限公司",
    unifiedCreditCode: "91310000MA1FL2XY34",
    contactPerson: "李雪梅",
    contactPhone: "13900139002",
    direction: "tech_breakthrough",
    requestedAmount: 120_000_000,
    purposeDescription:
      "研发大型载重物流无人机核心技术，突破长续航、重载、自主避障等关键技术瓶颈，形成具有自主知识产权的产品。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/4.pdf",
        size: 2_345_000,
      },
      {
        name: "专利证书汇总.pdf",
        url: "/uploads/attachments/5.pdf",
        size: 3_456_000,
      },
      {
        name: "技术方案.docx",
        url: "/uploads/attachments/6.docx",
        size: 4_567_000,
      },
    ],
    status: "in_review",
    submittedAt: "2026-06-05T14:20:00.000Z",
    preliminaryReview: {
      reviewer: "评审员王建国",
      qualificationScore: 92,
      complianceScore: 88,
      totalScore: 90,
      recommendedAmount: 120_000_000,
      pass: true,
      comment:
        "企业资质良好，申报材料齐全，符合申报方向要求，建议进入专家评审阶段。",
      reviewedAt: "2026-06-08T10:15:00.000Z",
    },
    milestones: [],
  },
  {
    id: genId(),
    companyName: "鸿鹄通用航空集团有限公司",
    unifiedCreditCode: "91440300MA5EXYZ567",
    contactPerson: "王浩然",
    contactPhone: "13700137003",
    direction: "production_expansion",
    requestedAmount: 150_000_000,
    approvedAmount: 120_000_000,
    purposeDescription:
      "扩建电动垂直起降飞行器（eVTOL）生产线，新增年产能50架，配套建设总装车间、试飞场地及供应链体系。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/7.pdf",
        size: 2_678_000,
      },
      {
        name: "土地使用证.pdf",
        url: "/uploads/attachments/8.pdf",
        size: 1_234_000,
      },
      {
        name: "环评报告.pdf",
        url: "/uploads/attachments/9.pdf",
        size: 6_789_000,
      },
    ],
    status: "in_disbursement",
    submittedAt: "2026-05-20T11:00:00.000Z",
    preliminaryReview: {
      reviewer: "评审员赵晓峰",
      qualificationScore: 95,
      complianceScore: 90,
      totalScore: 92.5,
      recommendedAmount: 120_000_000,
      pass: true,
      comment: "行业龙头企业，项目带动效应显著，材料齐全合规。",
      reviewedAt: "2026-05-23T15:30:00.000Z",
    },
    expertReview: {
      reviewer: "专家组组长陈思远",
      technicalScore: 93,
      feasibilityScore: 91,
      economicScore: 89,
      totalScore: 91,
      recommendedAmount: 120_000_000,
      pass: true,
      comment: "技术路线清晰，市场前景广阔，建议核定额度1.2亿元予以支持。",
      reviewedAt: "2026-05-28T09:45:00.000Z",
    },
    approval: {
      approver: "管委会主任刘伟",
      approvedAmount: 120_000_000,
      pass: true,
      comment: "同意立项，核定额度1.2亿元，按里程碑拨付。",
      approvedAt: "2026-06-01T14:00:00.000Z",
    },
    milestones: createMilestones(
      120_000_000,
      ["paid", "requested", "pending"],
      {
        requestDates: [undefined, "2026-06-12T10:00:00.000Z", undefined],
        approveDates: ["2026-06-03T11:00:00.000Z", undefined, undefined],
        paidDates: ["2026-06-05T09:30:00.000Z", undefined, undefined],
      },
    ),
  },
  {
    id: genId(),
    companyName: "苍穹芯科微电子有限公司",
    unifiedCreditCode: "91330100MA2KLMN890",
    contactPerson: "陈佳怡",
    contactPhone: "13600136004",
    direction: "tech_breakthrough",
    requestedAmount: 100_000_000,
    approvedAmount: 80_000_000,
    purposeDescription:
      "研发低空飞行器专用飞控芯片，突破高可靠性、低功耗、强实时性等技术难点，填补国内空白。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/10.pdf",
        size: 2_123_000,
      },
      {
        name: "流片合同.pdf",
        url: "/uploads/attachments/11.pdf",
        size: 3_890_000,
      },
    ],
    status: "queued",
    submittedAt: "2026-06-01T16:40:00.000Z",
    preliminaryReview: {
      reviewer: "评审员孙丽华",
      qualificationScore: 90,
      complianceScore: 87,
      totalScore: 88.5,
      recommendedAmount: 80_000_000,
      pass: true,
      comment: "技术团队实力雄厚，项目符合战略方向，初审通过。",
      reviewedAt: "2026-06-04T08:50:00.000Z",
    },
    expertReview: {
      reviewer: "专家组副组长钱文博",
      technicalScore: 94,
      feasibilityScore: 86,
      economicScore: 88,
      totalScore: 89.3,
      recommendedAmount: 80_000_000,
      pass: true,
      comment: "技术创新性强，建议立项，额度8000万元。",
      reviewedAt: "2026-06-09T13:20:00.000Z",
    },
    approval: {
      approver: "管委会副主任周明",
      queuePosition: 1,
      approvedAmount: 80_000_000,
      pass: true,
      comment: "项目优质但额度已满，进入排队序列，排位第1。",
      approvedAt: "2026-06-12T15:10:00.000Z",
    },
    milestones: [],
  },
  {
    id: genId(),
    companyName: "智航检测技术服务有限公司",
    unifiedCreditCode: "91510100MA6QRST123",
    contactPerson: "刘文博",
    contactPhone: "13500135005",
    direction: "testing_capability",
    requestedAmount: 60_000_000,
    approvedAmount: 50_000_000,
    purposeDescription:
      "建设低空飞行器适航认证检测中心，提供型号合格审定、生产许可审定等第三方检测服务。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/12.pdf",
        size: 2_567_000,
      },
      {
        name: "资质证书.pdf",
        url: "/uploads/attachments/13.pdf",
        size: 4_123_000,
      },
    ],
    status: "completed",
    submittedAt: "2026-03-15T10:25:00.000Z",
    preliminaryReview: {
      reviewer: "评审员赵晓峰",
      qualificationScore: 91,
      complianceScore: 93,
      totalScore: 92,
      recommendedAmount: 50_000_000,
      pass: true,
      comment: "专业检测机构，资质完备，项目意义重大。",
      reviewedAt: "2026-03-18T14:40:00.000Z",
    },
    expertReview: {
      reviewer: "专家组组长陈思远",
      technicalScore: 89,
      feasibilityScore: 94,
      economicScore: 90,
      totalScore: 91,
      recommendedAmount: 50_000_000,
      pass: true,
      comment: "填补区域检测能力空白，建议全额支持。",
      reviewedAt: "2026-03-23T09:15:00.000Z",
    },
    approval: {
      approver: "管委会主任刘伟",
      approvedAmount: 50_000_000,
      pass: true,
      comment: "同意立项，额度5000万元。",
      approvedAt: "2026-03-28T11:30:00.000Z",
    },
    milestones: createMilestones(50_000_000, ["paid", "paid", "paid"], {
      requestDates: [
        "2026-04-01T10:00:00.000Z",
        "2026-04-25T14:00:00.000Z",
        "2026-05-28T09:00:00.000Z",
      ],
      approveDates: [
        "2026-04-03T11:00:00.000Z",
        "2026-04-28T10:30:00.000Z",
        "2026-06-02T15:00:00.000Z",
      ],
      paidDates: [
        "2026-04-05T09:30:00.000Z",
        "2026-04-30T16:20:00.000Z",
        "2026-06-05T10:45:00.000Z",
      ],
    }),
  },
  {
    id: genId(),
    companyName: "鹏城航电系统有限公司",
    unifiedCreditCode: "91440300MA5DJKE456",
    contactPerson: "黄志强",
    contactPhone: "13400134006",
    direction: "production_expansion",
    requestedAmount: 70_000_000,
    purposeDescription:
      "计划建设航电系统生产线，扩大航空通信、导航、监视设备产能。",
    attachments: [
      {
        name: "营业执照.pdf",
        url: "/uploads/attachments/14.pdf",
        size: 2_789_000,
      },
      {
        name: "申报书.pdf",
        url: "/uploads/attachments/15.pdf",
        size: 3_234_000,
      },
    ],
    status: "rejected",
    submittedAt: "2026-06-08T13:55:00.000Z",
    preliminaryReview: {
      reviewer: "评审员孙丽华",
      qualificationScore: 72,
      complianceScore: 68,
      totalScore: 70,
      pass: false,
      comment: "部分材料缺失，企业财务指标未达标。",
      reviewedAt: "2026-06-11T10:05:00.000Z",
    },
    rejection: {
      reason:
        "企业近三年连续亏损，资产负债率超过75%，不符合申报基本条件；且申报材料中缺少关键的技术专利证明文件。建议完善后重新申报。",
      rejectedAt: "2026-06-13T14:30:00.000Z",
      rejectedBy: "管委会副主任周明",
    },
    milestones: [],
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: genId(),
    type: "approve_reserve",
    amount: 50_000_000,
    applicationId: mockApplications[4].id,
    companyName: mockApplications[4].companyName,
    direction: mockApplications[4].direction,
    remark: `立项额度预留 - ${mockApplications[4].companyName}`,
    createdAt: "2026-03-28T11:30:00.000Z",
  },
  {
    id: genId(),
    type: "disbursement",
    amount: 15_000_000,
    applicationId: mockApplications[4].id,
    companyName: mockApplications[4].companyName,
    direction: mockApplications[4].direction,
    remark: `第一笔拨付（30%） - 项目启动与方案设计`,
    createdAt: "2026-04-05T09:30:00.000Z",
  },
  {
    id: genId(),
    type: "disbursement",
    amount: 20_000_000,
    applicationId: mockApplications[4].id,
    companyName: mockApplications[4].companyName,
    direction: mockApplications[4].direction,
    remark: `第二笔拨付（40%） - 核心研发与样机试制`,
    createdAt: "2026-04-30T16:20:00.000Z",
  },
  {
    id: genId(),
    type: "approve_reserve",
    amount: 120_000_000,
    applicationId: mockApplications[2].id,
    companyName: mockApplications[2].companyName,
    direction: mockApplications[2].direction,
    remark: `立项额度预留 - ${mockApplications[2].companyName}`,
    createdAt: "2026-06-01T14:00:00.000Z",
  },
  {
    id: genId(),
    type: "disbursement",
    amount: 36_000_000,
    applicationId: mockApplications[2].id,
    companyName: mockApplications[2].companyName,
    direction: mockApplications[2].direction,
    remark: `第一笔拨付（30%） - 项目启动与方案设计`,
    createdAt: "2026-06-05T09:30:00.000Z",
  },
  {
    id: genId(),
    type: "disbursement",
    amount: 15_000_000,
    applicationId: mockApplications[4].id,
    companyName: mockApplications[4].companyName,
    direction: mockApplications[4].direction,
    remark: `第三笔拨付（30%） - 验收交付与成果转化`,
    createdAt: "2026-06-05T10:45:00.000Z",
  },
];
