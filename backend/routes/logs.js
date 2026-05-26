import express from "express";
import {
  logHabit,
  unlogHabit,
  getTodayLogs,
  getLogsRange,
  getHeatmap,
  getStats,
  getHabitStats,
} from "../controllers/logController.js";
import { project as protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(logHabit)
  .delete(unlogHabit);

router.get("/today", getTodayLogs);
router.get("/range", getLogsRange);
router.get("/heatmap", getHeatmap);
router.get("/stats", getStats);
router.get("/stats/:id", getHabitStats);

export default router;
