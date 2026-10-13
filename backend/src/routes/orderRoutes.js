import express from "express";
import { createOrder, getKitchenOrders, updateOrderStatus, getCustomerOrder, getSessionBill } from "../controllers/orderController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/kitchen", authMiddleware, roleMiddleware("KITCHEN"), getKitchenOrders);
router.patch("/:orderId/status", authMiddleware, roleMiddleware("KITCHEN"), updateOrderStatus);
router.get("/customer/:orderId", getCustomerOrder);
router.get("/bill/:sessionId", authMiddleware, roleMiddleware("OWNER", "MANAGER"), getSessionBill);

export default router;