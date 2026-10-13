import express from "express";

import { createStaff, getStaff, deactivateStaff } from "../controllers/staffController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  createStaff
);


router.get(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  getStaff
);

router.patch("/:staffId/deactivate", authMiddleware, roleMiddleware("OWNER", "MANAGER"), deactivateStaff);

export default router;