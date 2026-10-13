import express from "express";

import { createMenuItem, getMenuItems, updateMenuItem, deactivateMenuItem, getCustomerMenu } from "../controllers/menuController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  createMenuItem
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  getMenuItems
);

router.put(
  "/:menuItemId",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  updateMenuItem
);

router.patch("/:menuItemId",authMiddleware,roleMiddleware("OWNER", "MANAGER"),deactivateMenuItem)

router.get("/customer/:qrToken", getCustomerMenu);

export default router;