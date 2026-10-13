import express from "express";

import { getManagerDashboard, getOwnerDashboard } from "../controllers/dashboardController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/manager",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  getManagerDashboard
);

router.get(
  "/owner",
  authMiddleware,
  roleMiddleware("OWNER"),
  getOwnerDashboard
);

export default router;