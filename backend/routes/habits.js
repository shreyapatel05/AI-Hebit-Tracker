import express from "express";
import {
  getHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
} from "../controllers/habitController.js";
import { project as protect } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all habit routes
router.use(protect);

router.route("/")
  .get(getHabits)
  .post(createHabit);

router.route("/:id")
  .put(updateHabit)
  .delete(deleteHabit);

router.put("/:id/archive", archiveHabit);

export default router;
