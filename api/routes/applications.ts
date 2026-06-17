import { Router, type Request, type Response } from "express";
import {
  addApplication,
  addTransaction,
  computeFundPool,
  getApplicationById,
  getApplications,
  updateApplication,
} from "../store/index.js";
import type {
  Application,
  SupportDirection,
} from "../../shared/types/index.js";

const router = Router();

router.get(
  "/applications",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, direction } = req.query;
      const filters: {
        status?: Application["status"];
        direction?: SupportDirection;
      } = {};
      if (status && typeof status === "string")
        filters.status = status as Application["status"];
      if (direction && typeof direction === "string")
        filters.direction = direction as SupportDirection;
      const data = getApplications(filters);
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.get(
  "/applications/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = getApplicationById(id);
      if (!data) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        companyName,
        unifiedCreditCode,
        contactPerson,
        contactPhone,
        direction,
        requestedAmount,
        purposeDescription,
        attachments,
      } = req.body;

      if (
        !companyName ||
        !unifiedCreditCode ||
        !contactPerson ||
        !contactPhone ||
        !direction ||
        !requestedAmount ||
        !purposeDescription ||
        !attachments
      ) {
        res.status(400).json({ code: 400, message: "缺少必填字段" });
        return;
      }

      const data = addApplication({
        companyName,
        unifiedCreditCode,
        contactPerson,
        contactPhone,
        direction,
        requestedAmount: Number(requestedAmount),
        purposeDescription,
        attachments,
      });
      res.status(201).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications/:id/preliminary-review",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        reviewer,
        qualificationScore,
        complianceScore,
        comment,
        recommendedAmount,
        pass,
      } = req.body;
      const app = getApplicationById(id);

      if (!app) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      if (app.status !== "pending_preliminary") {
        res.status(400).json({ code: 400, message: "当前状态不允许初审操作" });
        return;
      }
      if (
        !reviewer ||
        qualificationScore == null ||
        complianceScore == null ||
        !comment
      ) {
        res.status(400).json({ code: 400, message: "缺少必填字段" });
        return;
      }

      const qs = Number(qualificationScore);
      const cs = Number(complianceScore);
      const totalScore = Math.round(((qs + cs) / 2) * 10) / 10;
      const shouldPass = pass !== undefined ? Boolean(pass) : totalScore >= 60;

      if (!shouldPass) {
        const data = updateApplication(id, {
          status: "rejected",
          preliminaryReview: {
            reviewer,
            qualificationScore: qs,
            complianceScore: cs,
            totalScore,
            recommendedAmount: recommendedAmount
              ? Number(recommendedAmount)
              : undefined,
            pass: false,
            comment,
            reviewedAt: new Date().toISOString(),
          },
          rejection: {
            rejectedBy: reviewer,
            reason: `初审未通过，综合评分：${totalScore}。${comment}`,
            rejectedAt: new Date().toISOString(),
          },
        });
        res
          .status(200)
          .json({ code: 0, message: "初审未通过，申报已驳回", data });
        return;
      }

      const data = updateApplication(id, {
        status: "in_review",
        preliminaryReview: {
          reviewer,
          qualificationScore: qs,
          complianceScore: cs,
          totalScore,
          recommendedAmount: recommendedAmount
            ? Number(recommendedAmount)
            : app.requestedAmount,
          pass: true,
          comment,
          reviewedAt: new Date().toISOString(),
        },
      });
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications/:id/expert-review",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        reviewer,
        technicalScore,
        feasibilityScore,
        economicScore,
        comment,
        recommendedAmount,
        pass,
      } = req.body;
      const app = getApplicationById(id);

      if (!app) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      if (app.status !== "in_review" || !app.preliminaryReview) {
        res
          .status(400)
          .json({ code: 400, message: "当前状态不允许专家评审操作" });
        return;
      }
      if (
        !reviewer ||
        technicalScore == null ||
        feasibilityScore == null ||
        economicScore == null ||
        !comment
      ) {
        res.status(400).json({ code: 400, message: "缺少必填字段" });
        return;
      }

      const ts = Number(technicalScore);
      const fs = Number(feasibilityScore);
      const es = Number(economicScore);
      const totalScore = Math.round(((ts + fs + es) / 3) * 10) / 10;
      const shouldPass = pass !== undefined ? Boolean(pass) : totalScore >= 60;

      if (!shouldPass) {
        const data = updateApplication(id, {
          status: "rejected",
          expertReview: {
            reviewer,
            technicalScore: ts,
            feasibilityScore: fs,
            economicScore: es,
            totalScore,
            recommendedAmount: recommendedAmount
              ? Number(recommendedAmount)
              : undefined,
            pass: false,
            comment,
            reviewedAt: new Date().toISOString(),
          },
          rejection: {
            rejectedBy: reviewer,
            reason: `专家评审未通过，综合评分：${totalScore}。${comment}`,
            rejectedAt: new Date().toISOString(),
          },
        });
        res
          .status(200)
          .json({ code: 0, message: "专家评审未通过，申报已驳回", data });
        return;
      }

      const data = updateApplication(id, {
        expertReview: {
          reviewer,
          technicalScore: ts,
          feasibilityScore: fs,
          economicScore: es,
          totalScore,
          recommendedAmount: recommendedAmount
            ? Number(recommendedAmount)
            : app.requestedAmount,
          pass: true,
          comment,
          reviewedAt: new Date().toISOString(),
        },
      });
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications/:id/approve",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approver, approvedAmount, comment } = req.body;
      const app = getApplicationById(id);

      if (!app) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      if (app.status !== "in_review") {
        res.status(400).json({ code: 400, message: "当前状态不允许立项操作" });
        return;
      }
      if (!approver || approvedAmount == null || !comment) {
        res.status(400).json({ code: 400, message: "缺少必填字段" });
        return;
      }

      const amount = Number(approvedAmount);
      const currentFundPool = computeFundPool();
      const allocatable =
        currentFundPool.total -
        (currentFundPool.approvedTotal - currentFundPool.queuedTotal);

      const queuedApps = getApplications({ status: "queued" });

      if (amount > allocatable) {
        const queuePosition = queuedApps.length + 1;
        const data = updateApplication(id, {
          status: "queued",
          approvedAmount: amount,
          approval: {
            approver,
            queuePosition,
            approvedAmount: amount,
            pass: true,
            comment,
            approvedAt: new Date().toISOString(),
          },
        });
        res
          .status(200)
          .json({ code: 0, message: "额度不足，已进入排队序列", data });
      } else {
        const percentages = [30, 40, 30];
        const names = [
          "项目启动与方案设计",
          "核心研发与样机试制",
          "验收交付与成果转化",
        ];
        const milestones = percentages.map((p, i) => ({
          id: Math.random().toString(36).slice(2, 10),
          name: names[i],
          percentage: p,
          amount: Math.round((amount * p) / 100),
          status: "pending" as const,
        }));

        const data = updateApplication(id, {
          status: "approved",
          approvedAmount: amount,
          approval: {
            approver,
            approvedAmount: amount,
            pass: true,
            comment,
            approvedAt: new Date().toISOString(),
          },
          milestones,
        });

        addTransaction({
          type: "approve_reserve",
          amount,
          applicationId: id,
          companyName: app.companyName,
          direction: app.direction,
          remark: `立项额度预留 - ${app.companyName}`,
        });

        res.status(200).json({ code: 0, message: "ok", data });
      }
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications/:id/reject",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rejectedBy, reason } = req.body;
      const app = getApplicationById(id);

      if (!app) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      if (app.status === "completed" || app.status === "rejected") {
        res.status(400).json({ code: 400, message: "当前状态不允许驳回操作" });
        return;
      }
      if (!rejectedBy || !reason) {
        res.status(400).json({ code: 400, message: "缺少必填字段" });
        return;
      }

      const data = updateApplication(id, {
        status: "rejected",
        rejection: {
          reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy,
        },
      });
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

export default router;
