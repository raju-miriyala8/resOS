import express from "express";

import { createTableSession, completeTableSession } from "../controllers/tableSessionController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", createTableSession);
router.patch(
  "/:sessionId/complete",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  completeTableSession
);

export default router;