import express from "express";
import {
  getMorningMotivation,
  getWeeklyReport,
  getRecoveryPlan,
  getSuggestedHabits,
  chatWithCoach,
  publicChatWithCoach,
} from "../controllers/aiController.js";
import { project as protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/public-chat", publicChatWithCoach);

router.use(protect);

router.get("/morning", getMorningMotivation);
router.post("/weekly-report", getWeeklyReport);
router.post("/recovery-plan", getRecoveryPlan);
router.post("/suggest-habits", getSuggestedHabits);
router.post("/chat", chatWithCoach);


export default router;
