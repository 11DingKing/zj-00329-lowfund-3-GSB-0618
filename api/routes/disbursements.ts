import { Router, type Request, type Response } from "express";
import {
  addTransaction,
  getApplicationById,
  getApplications,
  updateApplication,
  processQueue,
  computeFundPool,
} from "../store/index.js";
import type { Application, Milestone } from "../../shared/types/index.js";

const router = Router();

router.get(
  "/disbursements",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      const apps = getApplications();
      const data: {
        appId: string;
        companyName: string;
        approvedAmount: number;
        direction: Application["direction"];
        milestone: Milestone;
        application?: Application;
      }[] = [];

      const filterStatus = status ? String(status) : null;

      for (const app of apps) {
        if (!app.milestones || app.milestones.length === 0) continue;
        for (const ms of app.milestones) {
          if (filterStatus) {
            if (ms.status === filterStatus) {
              data.push({
                appId: app.id,
                companyName: app.companyName,
                approvedAmount: app.approvedAmount ?? 0,
                direction: app.direction,
                milestone: ms,
                application: app,
              });
            }
          } else {
            if (ms.status === "requested" || ms.status === "approved") {
              data.push({
                appId: app.id,
                companyName: app.companyName,
                approvedAmount: app.approvedAmount ?? 0,
                direction: app.direction,
                milestone: ms,
                application: app,
              });
            }
          }
        }
      }

      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/applications/:id/disbursements",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { milestoneId, remark } = req.body;
      const app = getApplicationById(id);

      if (!app) {
        res.status(404).json({ code: 404, message: "申报不存在" });
        return;
      }
      if (app.status !== "approved" && app.status !== "in_disbursement") {
        res
          .status(400)
          .json({ code: 400, message: "当前状态不允许发起拨付申请" });
        return;
      }
      if (!milestoneId) {
        res.status(400).json({ code: 400, message: "缺少里程碑ID" });
        return;
      }

      const msIndex = app.milestones.findIndex((m) => m.id === milestoneId);
      if (msIndex === -1) {
        res.status(404).json({ code: 404, message: "里程碑不存在" });
        return;
      }

      const currentMs = app.milestones[msIndex];
      if (currentMs.status !== "pending") {
        res
          .status(400)
          .json({ code: 400, message: "里程碑状态不是待申请，无法发起拨付" });
        return;
      }

      if (msIndex > 0) {
        const prevMs = app.milestones[msIndex - 1];
        if (prevMs.status !== "paid") {
          res.status(400).json({
            code: 400,
            message: "前一个里程碑未完成拨付，请按顺序申请",
          });
          return;
        }
      }

      const newMilestones = [...app.milestones];
      newMilestones[msIndex] = {
        ...currentMs,
        status: "requested",
        requestDate: new Date().toISOString(),
        requestRemark: remark ?? currentMs.remark,
      };

      const newStatus: Application["status"] =
        app.status === "approved" ? "in_disbursement" : app.status;

      const data = updateApplication(id, {
        status: newStatus,
        milestones: newMilestones,
      });

      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/disbursements/:msId/review",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { msId } = req.params;
      const { reviewer, reviewComment, pass } = req.body;
      const allApps = getApplications();

      let targetApp: Application | null = null;
      let targetMsIndex = -1;

      for (const app of allApps) {
        const idx = app.milestones.findIndex((m) => m.id === msId);
        if (idx !== -1) {
          targetApp = app;
          targetMsIndex = idx;
          break;
        }
      }

      if (!targetApp || targetMsIndex === -1) {
        res.status(404).json({ code: 404, message: "里程碑不存在" });
        return;
      }
      if (!reviewer) {
        res.status(400).json({ code: 400, message: "缺少审核人信息" });
        return;
      }

      const currentMs = targetApp.milestones[targetMsIndex];
      if (currentMs.status !== "requested") {
        res.status(400).json({ code: 400, message: "里程碑状态不是待审核" });
        return;
      }

      const shouldPass = pass !== undefined ? Boolean(pass) : true;
      const now = new Date().toISOString();

      if (!shouldPass) {
        const newMilestones = [...targetApp.milestones];
        newMilestones[targetMsIndex] = {
          ...currentMs,
          status: "pending",
          reviewDate: now,
          reviewer,
          reviewComment: reviewComment || "",
          rejectDate: now,
          rejector: reviewer,
          rejectReason: reviewComment || "审核未通过",
        };

        const data = updateApplication(targetApp.id, {
          milestones: newMilestones,
        });

        res
          .status(200)
          .json({ code: 0, message: "审核未通过，已退回企业", data });
        return;
      }

      const newMilestones = [...targetApp.milestones];
      newMilestones[targetMsIndex] = {
        ...currentMs,
        status: "approved",
        reviewDate: now,
        reviewer,
        reviewComment: reviewComment || "",
      };

      const data = updateApplication(targetApp.id, {
        milestones: newMilestones,
      });

      res.status(200).json({ code: 0, message: "审核通过，待放款", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/disbursements/:msId/pay",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { msId } = req.params;
      const { approver, approveComment, paidAmount } = req.body;
      const allApps = getApplications();

      let targetApp: Application | null = null;
      let targetMsIndex = -1;

      for (const app of allApps) {
        const idx = app.milestones.findIndex((m) => m.id === msId);
        if (idx !== -1) {
          targetApp = app;
          targetMsIndex = idx;
          break;
        }
      }

      if (!targetApp || targetMsIndex === -1) {
        res.status(404).json({ code: 404, message: "里程碑不存在" });
        return;
      }
      if (!approver) {
        res.status(400).json({ code: 400, message: "缺少放款人信息" });
        return;
      }

      const currentMs = targetApp.milestones[targetMsIndex];
      if (currentMs.status !== "approved") {
        res
          .status(400)
          .json({ code: 400, message: "里程碑状态不是已审核，无法放款" });
        return;
      }

      const actualPaidAmount = paidAmount
        ? Number(paidAmount)
        : currentMs.amount;

      if (!Number.isFinite(actualPaidAmount)) {
        res
          .status(400)
          .json({ code: 400, message: "实付金额必须是有效的数值" });
        return;
      }
      if (actualPaidAmount <= 0) {
        res.status(400).json({ code: 400, message: "实付金额必须大于0" });
        return;
      }
      if (actualPaidAmount > currentMs.amount) {
        res.status(400).json({
          code: 400,
          message: `实付金额不能超过该里程碑的应拨额（${currentMs.amount.toLocaleString()}元）`,
        });
        return;
      }

      const fundPool = computeFundPool();
      const availableBalance = fundPool.total - fundPool.disbursedTotal;
      if (actualPaidAmount > availableBalance) {
        res.status(400).json({
          code: 400,
          message: `实付金额不能超过资金池可用余额（${availableBalance.toLocaleString()}元）`,
        });
        return;
      }

      const now = new Date().toISOString();

      const newMilestones = [...targetApp.milestones];
      newMilestones[targetMsIndex] = {
        ...currentMs,
        status: "paid",
        approveDate: now,
        approver,
        approveComment: approveComment || "",
        paidDate: now,
        paidAmount: actualPaidAmount,
      };

      const allPaid = newMilestones.every((m) => m.status === "paid");
      const newStatus: Application["status"] = allPaid
        ? "completed"
        : "in_disbursement";

      const data = updateApplication(targetApp.id, {
        status: newStatus,
        milestones: newMilestones,
      });

      addTransaction({
        type: "disbursement",
        amount: actualPaidAmount,
        applicationId: targetApp.id,
        companyName: targetApp.companyName,
        direction: targetApp.direction,
        remark: `拨付（${currentMs.percentage}%） - ${currentMs.name}`,
      });

      const releasedApps = processQueue();

      res.status(200).json({
        code: 0,
        message: "放款成功",
        data: {
          application: data,
          releasedFromQueue: releasedApps.length,
          releasedApps,
          fundPool: computeFundPool(),
        },
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/disbursements/:msId/reject",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { msId } = req.params;
      const { rejector, rejectReason } = req.body;
      const allApps = getApplications();

      let targetApp: Application | null = null;
      let targetMsIndex = -1;

      for (const app of allApps) {
        const idx = app.milestones.findIndex((m) => m.id === msId);
        if (idx !== -1) {
          targetApp = app;
          targetMsIndex = idx;
          break;
        }
      }

      if (!targetApp || targetMsIndex === -1) {
        res.status(404).json({ code: 404, message: "里程碑不存在" });
        return;
      }
      if (!rejector || !rejectReason) {
        res.status(400).json({ code: 400, message: "缺少退回人或退回原因" });
        return;
      }

      const currentMs = targetApp.milestones[targetMsIndex];
      if (currentMs.status !== "requested" && currentMs.status !== "approved") {
        res.status(400).json({ code: 400, message: "当前状态不允许退回" });
        return;
      }

      const now = new Date().toISOString();
      const newMilestones = [...targetApp.milestones];
      newMilestones[targetMsIndex] = {
        ...currentMs,
        status: "pending",
        rejectDate: now,
        rejector,
        rejectReason,
      };

      const data = updateApplication(targetApp.id, {
        milestones: newMilestones,
      });

      res.status(200).json({ code: 0, message: "已退回拨付申请", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

export default router;
