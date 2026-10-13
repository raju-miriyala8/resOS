import express from "express";

import { createTable, getTables, updateTable, deactivateTable } from "../controllers/tableController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "MANAGER"),
    createTable
)

router.get(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  getTables
);

router.put(
  "/:tableId",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  updateTable
);

router.delete(
  "/:tableId",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  deactivateTable
);

export default router;