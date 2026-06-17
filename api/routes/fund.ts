import { Router, type Request, type Response } from "express";
import {
  computeFundPool,
  getTransactions,
  processQueue,
  getAvailableAmount,
} from "../store/index.js";

const router = Router();

router.get("/fund-pool", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = computeFundPool();
    res.status(200).json({ code: 0, message: "ok", data });
  } catch (error) {
    res.status(500).json({ code: 500, message: (error as Error).message });
  }
});

router.get(
  "/fund-pool/available",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const available = getAvailableAmount();
      const pool = computeFundPool();
      res.status(200).json({
        code: 0,
        message: "ok",
        data: {
          available,
          total: pool.total,
          approvedTotal: pool.approvedTotal,
          queuedTotal: pool.queuedTotal,
        },
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.post(
  "/fund-pool/process-queue",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const releasedApps = processQueue();
      res.status(200).json({
        code: 0,
        message: `已处理队列，成功释放 ${releasedApps.length} 个项目`,
        data: {
          releasedCount: releasedApps.length,
          releasedApps,
          fundPool: computeFundPool(),
        },
      });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

router.get(
  "/fund-pool/transactions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = getTransactions();
      res.status(200).json({ code: 0, message: "ok", data });
    } catch (error) {
      res.status(500).json({ code: 500, message: (error as Error).message });
    }
  },
);

export default router;
